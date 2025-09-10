/// <reference types="jest" />
import { Test } from '@nestjs/testing'
import { NotificationsService } from '../src/notifications/notifications.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { MailService } from '../src/notifications/mail/mail.service'
import { WhatsappService } from '../src/notifications/whatsapp/whatsapp.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'


describe('NotificationsService', () => {
  const prismaMock = {
    appointment: { findUnique: jest.fn() },
  } as unknown as PrismaService

  const mailMock = {
    sendBookingConfirmation: jest.fn(() => Promise.resolve(void 0)),
  } as unknown as MailService

  const waMock = {
    sendBookingConfirmation: jest.fn(() => Promise.resolve(void 0)),
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

  it('envía email y whatsapp cuando hay datos del cliente', async () => {
    (prismaMock.appointment.findUnique as any).mockResolvedValue({
      id: 'apt_1',
      startsAt: new Date('2025-08-28T12:00:00Z'),
      endsAt: new Date('2025-08-28T13:00:00Z'),
      customer: { email: 'foo@bar.com', phone: '5491112345678' },
      service: { name: 'Corte' },
      staff: { name: 'Ana' },
      location: { name: 'Sede Centro', timezone: 'America/Argentina/Buenos_Aires' },
      organization: { name: 'MiNegocio' },
    })

    await service.sendBookingConfirmation('apt_1')

    expect(mailMock.sendBookingConfirmation).toHaveBeenCalledTimes(1)
    expect(waMock.sendBookingConfirmation).toHaveBeenCalledTimes(1)
    // en happy path, el servicio no escribe info; aseguramos que no hubo warnings
    expect(loggerMock.warn).not.toHaveBeenCalled()
  })


  it('omite email/wa cuando faltan datos del cliente', async () => {
    ; (prismaMock.appointment.findUnique as any).mockResolvedValue({
      id: 'apt_2',
      startsAt: new Date(),
      endsAt: new Date(),
      customer: { email: null, phone: null },
      service: { name: 'Corte' },
      staff: { name: 'Ana' },
      location: { name: 'Sede Centro', timezone: 'UTC' },
      organization: { name: 'MiNegocio' },
    })

    await service.sendBookingConfirmation('apt_2')

    expect(mailMock.sendBookingConfirmation).not.toHaveBeenCalled()
    expect(waMock.sendBookingConfirmation).not.toHaveBeenCalled()
    expect(loggerMock.info).toHaveBeenNthCalledWith(
      1,
      'Customer has no email, skipping email channel',
      expect.objectContaining({ ctx: 'notif.booking', appointmentId: 'apt_2' }),
    )
    expect(loggerMock.info).toHaveBeenNthCalledWith(
      2,
      'Customer has no phone, skipping WhatsApp channel',
      expect.objectContaining({ ctx: 'notif.booking', appointmentId: 'apt_2' }),
    )
  })

  it('omite notificación si el turno no existe', async () => {
    ; (prismaMock.appointment.findUnique as any).mockResolvedValue(null)

    await service.sendBookingConfirmation('missing')

    expect(mailMock.sendBookingConfirmation).not.toHaveBeenCalled()
    expect(waMock.sendBookingConfirmation).not.toHaveBeenCalled()
    expect(loggerMock.warn).toHaveBeenCalledWith(
      'Notification skipped: appointment not found',
      expect.objectContaining({ ctx: 'notif.booking', appointmentId: 'missing' }),
    )
  })
})
