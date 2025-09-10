/// <reference types="jest" />
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { NotificationsController } from '../src/notifications/notifications.controller'
import { NotificationsService } from '../src/notifications/notifications.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { MailService } from '../src/notifications/mail/mail.service'
import { WhatsappService } from '../src/notifications/whatsapp/whatsapp.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'

describe('NotificationsController (e2e)', () => {
  let app: INestApplication

  const prismaMock = {
    appointment: { findUnique: jest.fn() },
  } as unknown as PrismaService

  const mailMock = {
    sendBookingConfirmation: jest.fn(() => Promise.resolve(void 0)),
    sendBookingReminder: jest.fn(() => Promise.resolve(void 0)),
    sendBookingCanceled: jest.fn(() => Promise.resolve(void 0)),
  } as unknown as MailService

  const waMock = {
    sendBookingConfirmation: jest.fn(() => Promise.resolve(void 0)),
    sendBookingReminder: jest.fn(() => Promise.resolve(void 0)),
    sendBookingCanceled: jest.fn(() => Promise.resolve(void 0)),
  } as unknown as WhatsappService

  const loggerMock: Partial<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MailService, useValue: mailMock },
        { provide: WhatsappService, useValue: waMock },
        { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('/notifications/booking-confirmation (POST) -> 204', async () => {
    ;(prismaMock.appointment.findUnique as any).mockResolvedValue({
      id: 'apt_e2e_1',
      startsAt: new Date('2025-08-28T12:00:00Z'),
      endsAt: new Date('2025-08-28T13:00:00Z'),
      customer: { email: 'foo@bar.com', phone: '5491112345678' },
      service: { name: 'Corte' },
      staff: { name: 'Ana' },
      location: { name: 'Sede Centro', timezone: 'America/Argentina/Buenos_Aires' },
      organization: { name: 'MiNegocio' },
    })

    await request(app.getHttpServer())
      .post('/notifications/booking-confirmation')
      .send({ appointmentId: 'apt_e2e_1' })
      .expect(204)

    expect(mailMock.sendBookingConfirmation).toHaveBeenCalledTimes(1)
    expect(waMock.sendBookingConfirmation).toHaveBeenCalledTimes(1)
  })

  it('/notifications/booking-reminder (POST) -> 204', async () => {
    ;(prismaMock.appointment.findUnique as any).mockResolvedValue({
      id: 'apt_e2e_2',
      startsAt: new Date('2025-08-28T12:00:00Z'),
      endsAt: new Date('2025-08-28T13:00:00Z'),
      customer: { email: 'foo@bar.com', phone: '5491112345678' },
      service: { name: 'Corte' },
      staff: { name: 'Ana' },
      location: { name: 'Sede Centro', timezone: 'America/Argentina/Buenos_Aires' },
      organization: { name: 'MiNegocio' },
    })

    await request(app.getHttpServer())
      .post('/notifications/booking-reminder')
      .send({ appointmentId: 'apt_e2e_2', hoursBefore: 24 })
      .expect(204)

    expect(mailMock.sendBookingReminder).toHaveBeenCalledTimes(1)
    expect(waMock.sendBookingReminder).toHaveBeenCalledTimes(1)
  })

  it('/notifications/booking-canceled (POST) -> 204', async () => {
    ;(prismaMock.appointment.findUnique as any).mockResolvedValue({
      id: 'apt_e2e_3',
      startsAt: new Date('2025-08-28T12:00:00Z'),
      endsAt: new Date('2025-08-28T13:00:00Z'),
      customer: { email: 'foo@bar.com', phone: '5491112345678' },
      service: { name: 'Corte' },
      staff: { name: 'Ana' },
      location: { name: 'Sede Centro', timezone: 'America/Argentina/Buenos_Aires' },
      organization: { name: 'MiNegocio' },
    })

    await request(app.getHttpServer())
      .post('/notifications/booking-canceled')
      .send({ appointmentId: 'apt_e2e_3', canceledBy: 'customer', reason: 'No puede asistir' })
      .expect(204)

    expect(mailMock.sendBookingCanceled).toHaveBeenCalledTimes(1)
    expect(waMock.sendBookingCanceled).toHaveBeenCalledTimes(1)
  })
})
