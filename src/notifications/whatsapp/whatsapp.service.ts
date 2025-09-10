import { Injectable } from '@nestjs/common'

/**
 * Servicio de envío de WhatsApp. 
 * Placeholder: integrar proveedor real (Twilio, Meta WhatsApp Cloud API, etc.)
 */
@Injectable()
export class WhatsappService {
  async sendBookingConfirmation(to: string, payload: any): Promise<void> {
    console.log('[WhatsApp] Sending booking confirmation', { to, payload })
  }

  async sendBookingReminder(to: string, payload: any): Promise<void> {
    console.log('[WhatsApp] Sending booking reminder', { to, payload })
  }

  async sendBookingCanceled(to: string, payload: any): Promise<void> {
    console.log('[WhatsApp] Sending booking canceled', { to, payload })
  }
}
