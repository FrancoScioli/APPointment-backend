// Eventos soportados por el sistema de notificaciones
export enum AppEvent {
    AppointmentCreated = 'appointment.created',
    AppointmentReminder = 'appointment.reminder',
    AppointmentCanceled = 'appointment.canceled',
}

// Payloads mínimos para evitar depender de otros servicios
export interface BasePayload {
    toEmail: string;
    toWhatsApp?: string;
    toPushToken?: string;
    locale?: string;
}

export interface AppointmentCreatedPayload extends BasePayload {
    appointmentId: string;
    customerName: string;
    professionalName: string;
    startsAt: string;
    serviceName?: string;
}

export interface AppointmentReminderPayload extends BasePayload {
    appointmentId: string;
    customerName: string;
    startsAt: string;
    hoursBefore: number;    // horas de anticipación del recordatorio
}

export interface AppointmentCanceledPayload extends BasePayload {
    appointmentId: string;
    customerName: string;
    canceledBy: 'customer' | 'professional' | 'system';
    reason?: string;
}
