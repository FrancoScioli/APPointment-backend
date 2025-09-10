import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { MailService } from './mail/mail.service'
import { WhatsappService } from './whatsapp/whatsapp.service'

/**
 * Servicio de notificaciones. Orquesta Mail y WhatsApp.
 * No bloquea el flujo principal; los errores se registran en logs.
 */
@Injectable()
export class NotificationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
        private readonly wa: WhatsappService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) { }

    // Dentro de NotificationsService

    /**
     * Helper: carga el contexto del turno y arma el payload reutilizable.
     */
    private async buildAppointmentPayload(appointmentId: string): Promise<{
        appt: any | null
        payload: {
            orgName: string
            serviceName: string
            staffName: string
            locationName: string
            whenText: string
            manageUrl?: string
        } | null
        tz: string
    }> {
        const appt = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { customer: true, service: true, staff: true, location: true, organization: true },
        })

        if (!appt) {
            return { appt: null, payload: null, tz: 'UTC' }
        }

        const tz = appt.location.timezone || 'UTC'
        const startLocal = toZonedTime(appt.startsAt, tz)
        const endLocal = toZonedTime(appt.endsAt, tz)
        const whenText = `${format(startLocal, 'yyyy-MM-dd HH:mm')} - ${format(endLocal, 'HH:mm')} (${tz})`

        const payload = {
            orgName: appt.organization.name,
            serviceName: appt.service.name,
            staffName: appt.staff.name,
            locationName: appt.location.name,
            whenText,
            manageUrl: this.buildManageUrl(appointmentId),
        }

        return { appt, payload, tz }
    }


    /**
     * Envía confirmación de turno por los canales disponibles.
     */
    async sendBookingConfirmation(appointmentId: string) {
        const { appt, payload } = await this.buildAppointmentPayload(appointmentId)

        if (!appt) {
            this.logger.warn('Notification skipped: appointment not found', { ctx: 'notif.booking', appointmentId })
            return
        }

        if (appt.customer.email) {
            Promise.resolve(this.mail.sendBookingConfirmation(appt.customer.email, payload))
                .catch((e) => this.logger.warn('Email failed (non-blocking)', { ctx: 'notif.booking', appointmentId, err: e?.message }))
        } else {
            this.logger.info('Customer has no email, skipping email channel', { ctx: 'notif.booking', appointmentId })
        }

        if (appt.customer.phone) {
            Promise.resolve(this.wa.sendBookingConfirmation(appt.customer.phone, payload))
                .catch((e) => this.logger.warn('WhatsApp failed (non-blocking)', { ctx: 'notif.booking', appointmentId, err: e?.message }))
        } else {
            this.logger.info('Customer has no phone, skipping WhatsApp channel', { ctx: 'notif.booking', appointmentId })
        }
    }

    /**
     * Envía recordatorio de turno (hoursBefore solo se usa en el texto).
     */
    async sendBookingReminder(appointmentId: string, hoursBefore: number) {
        const { appt, payload } = await this.buildAppointmentPayload(appointmentId)

        if (!appt) {
            this.logger.warn('Reminder skipped: appointment not found', { ctx: 'notif.reminder', appointmentId })
            return
        }

        const reminderPayload = { ...payload, hoursBefore }

        if (appt.customer.email) {
            Promise.resolve(this.mail.sendBookingReminder(appt.customer.email, reminderPayload))
                .catch((e) => this.logger.warn('Email failed (non-blocking)', { ctx: 'notif.reminder', appointmentId, err: e?.message }))
        } else {
            this.logger.info('Customer has no email, skipping email channel', { ctx: 'notif.reminder', appointmentId })
        }

        if (appt.customer.phone) {
            Promise.resolve(this.wa.sendBookingReminder(appt.customer.phone, reminderPayload))
                .catch((e) => this.logger.warn('WhatsApp failed (non-blocking)', { ctx: 'notif.reminder', appointmentId, err: e?.message }))
        } else {
            this.logger.info('Customer has no phone, skipping WhatsApp channel', { ctx: 'notif.reminder', appointmentId })
        }
    }

    /**
     * Envía notificación de turno cancelado.
     */
    async sendBookingCanceled(appointmentId: string, canceledBy: 'customer' | 'professional' | 'system', reason?: string) {
        const { appt, payload } = await this.buildAppointmentPayload(appointmentId)

        if (!appt) {
            this.logger.warn('Cancelation skipped: appointment not found', { ctx: 'notif.canceled', appointmentId })
            return
        }

        const canceledPayload = { ...payload, canceledBy, reason }

        if (appt.customer.email) {
            Promise.resolve(this.mail.sendBookingCanceled(appt.customer.email, canceledPayload))
                .catch((e) => this.logger.warn('Email failed (non-blocking)', { ctx: 'notif.canceled', appointmentId, err: e?.message }))
        } else {
            this.logger.info('Customer has no email, skipping email channel', { ctx: 'notif.canceled', appointmentId })
        }

        if (appt.customer.phone) {
            Promise.resolve(this.wa.sendBookingCanceled(appt.customer.phone, canceledPayload))
                .catch((e) => this.logger.warn('WhatsApp failed (non-blocking)', { ctx: 'notif.canceled', appointmentId, err: e?.message }))
        } else {
            this.logger.info('Customer has no phone, skipping WhatsApp channel', { ctx: 'notif.canceled', appointmentId })
        }
    }

    /**
     * Construye URL pública para gestionar un turno si PUBLIC_URL está configurada.
     */
    private buildManageUrl(appointmentId: string) {
        const base = process.env.PUBLIC_URL?.replace(/\/+$/, '')
        return base ? `${base}/booking/${appointmentId}` : undefined
    }
}
