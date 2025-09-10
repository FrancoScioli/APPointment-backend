import { Injectable } from '@nestjs/common'

/**
 * Servicio de envío de mails. 
 * Placeholder: integrar proveedor real (Nodemailer, Resend, etc.)
 */
@Injectable()
export class MailService {
  async sendBookingConfirmation(to: string, payload: any): Promise<void> {
    console.log('[Mail] Sending booking confirmation', { to, payload })
  }

  async sendBookingReminder(to: string, payload: any): Promise<void> {
    console.log('[Mail] Sending booking reminder', { to, payload })
  }

  async sendBookingCanceled(to: string, payload: any): Promise<void> {
    console.log('[Mail] Sending booking canceled', { to, payload })
  }
}
