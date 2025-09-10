import { EmailMessage, WhatsAppMessage, PushMessage } from '../templates/notification-templates';
/**
 * Contratos de envío por canal. Útiles para tests y para intercambiar implementaciones.
 */
export interface IEmailChannel {
  send(msg: EmailMessage): Promise<void>;
}

export interface IWhatsAppChannel {
  send(msg: WhatsAppMessage): Promise<void>;
}

export interface IPushChannel {
  send(msg: PushMessage): Promise<void>;
}
