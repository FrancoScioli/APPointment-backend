/// <reference types="jest" />
import { Test } from '@nestjs/testing'
import { NotificationsService } from '../src/notifications/notifications.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { MailService } from '../src/notifications/mail/mail.service'
import { WhatsappService } from '../src/notifications/whatsapp/whatsapp.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'

describe('NotificationsService — reminder & canceled', () => {
  const prismaMock = {
    appointment: { findUnique: jest.fn() },
  } as unknown as PrismaService

  const mailMock = {
    sendBookingReminder: jest.fn(() => Promise.resolve(void 0)),
    sendBookingCanceled: jest.fn(() => Promise.resolve(void 0)),
  } as unknown as MailService

  const waMock = {
    sendBookingReminder: jest.fn(() => Promise.resolve(void 0)),
    sendBookingCanceled: jest.fn(() => Promise.resolve(void 0)),
  } as unknown as WhatsappService

  const loggerMock: Partial<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  let service: NotificationsService

  beforeEach(async () => {
    jest.clearAllMocks()

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MailService, useValue: mailMock },
        { provide: WhatsappService, useValue: waMock },
        { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
      ],
    }).compile()

    service = moduleRef.get(NotificationsService)
  })

  it('sendBookingReminder: envía por email y WA si existen datos', async () => {
    ;(prismaMock.appointment.findUnique as any).mockResolvedValue({
      id: 'apt_r1',
      startsAt: new Date('2025-08-28T12:00:00Z'),
      endsAt: new Date('2025-08-28T13:00:00Z'),
      customer: { email: 'foo@bar.com', phone: '5491112345678' },
      service: { name: 'Corte' },
      staff: { name: 'Ana' },
      location: { name: 'Sede Centro', timezone: 'America/Argentina/Buenos_Aires' },
      organization: { name: 'MiNegocio' },
    })

    await service.sendBookingReminder('apt_r1', 24)

    expect(mailMock.sendBookingReminder).toHaveBeenCalledTimes(1)
    expect(waMock.sendBookingReminder).toHaveBeenCalledTimes(1)
    // happy path: no warnings
    expect(loggerMock.warn).not.toHaveBeenCalled()
  })

  it('sendBookingCanceled: envía por email y WA si existen datos', async () => {
    ;(prismaMock.appointment.findUnique as any).mockResolvedValue({
      id: 'apt_c1',
      startsAt: new Date('2025-08-28T12:00:00Z'),
      endsAt: new Date('2025-08-28T13:00:00Z'),
      customer: { email: 'foo@bar.com', phone: '5491112345678' },
      service: { name: 'Corte' },
      staff: { name: 'Ana' },
      location: { name: 'Sede Centro', timezone: 'America/Argentina/Buenos_Aires' },
      organization: { name: 'MiNegocio' },
    })

    await service.sendBookingCanceled('apt_c1', 'customer', 'No puede asistir')

    expect(mailMock.sendBookingCanceled).toHaveBeenCalledTimes(1)
    expect(waMock.sendBookingCanceled).toHaveBeenCalledTimes(1)
    expect(loggerMock.warn).not.toHaveBeenCalled()
  })

  it('sendBookingReminder: si no existe el turno, loguea warn y no envía', async () => {
    ;(prismaMock.appointment.findUnique as any).mockResolvedValue(null)

    await service.sendBookingReminder('missing_r', 12)

    expect(mailMock.sendBookingReminder).not.toHaveBeenCalled()
    expect(waMock.sendBookingReminder).not.toHaveBeenCalled()
    expect(loggerMock.warn).toHaveBeenCalledWith(
      'Reminder skipped: appointment not found',
      expect.objectContaining({ ctx: 'notif.reminder', appointmentId: 'missing_r' }),
    )
  })

  it('sendBookingCanceled: si no existe el turno, loguea warn y no envía', async () => {
    ;(prismaMock.appointment.findUnique as any).mockResolvedValue(null)

    await service.sendBookingCanceled('missing_c', 'system')

    expect(mailMock.sendBookingCanceled).not.toHaveBeenCalled()
    expect(waMock.sendBookingCanceled).not.toHaveBeenCalled()
    expect(loggerMock.warn).toHaveBeenCalledWith(
      'Cancelation skipped: appointment not found',
      expect.objectContaining({ ctx: 'notif.canceled', appointmentId: 'missing_c' }),
    )
  })
})
