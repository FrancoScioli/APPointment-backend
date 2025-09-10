import { AppEvent, AppointmentCreatedPayload, AppointmentReminderPayload, AppointmentCanceledPayload,  } from "../types/events";

// Estructuras de mensaje por canal
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface WhatsAppMessage {
  to: string;  
  text: string;
}

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ComposedMessage {
  email: EmailMessage;
  whatsapp?: WhatsAppMessage;
  push?: PushMessage;
}

/**
 * Genera plantillas según el tipo de evento.
 */
export function buildTemplate(event: AppEvent, payload: any): ComposedMessage {
  switch (event) {
    case AppEvent.AppointmentCreated:
      return appointmentCreatedTemplate(payload as AppointmentCreatedPayload);
    case AppEvent.AppointmentReminder:
      return appointmentReminderTemplate(payload as AppointmentReminderPayload);
    case AppEvent.AppointmentCanceled:
      return appointmentCanceledTemplate(payload as AppointmentCanceledPayload);
    default:
      throw new Error(`Evento no soportado: ${event}`);
  }
}

function appointmentCreatedTemplate(p: AppointmentCreatedPayload): ComposedMessage {
  const subject = `Turno confirmado #${p.appointmentId}`;
  const html = `
    <h2>¡Tu turno fue confirmado!</h2>
    <p>Hola ${p.customerName},</p>
    <p>Profesional: <b>${p.professionalName}</b></p>
    <p>Servicio: <b>${p.serviceName ?? '-'}</b></p>
    <p>Fecha y hora: <b>${p.startsAt}</b></p>
  `;
  const text = `Turno confirmado #${p.appointmentId} para ${p.customerName} el ${p.startsAt}.`;

  return {
    email: { to: p.toEmail, subject, html },
    whatsapp: p.toWhatsApp ? { to: p.toWhatsApp, text } : undefined,
    push: p.toPushToken ? { to: p.toPushToken, title: subject, body: text } : undefined,
  };
}

function appointmentReminderTemplate(p: AppointmentReminderPayload): ComposedMessage {
  const subject = `Recordatorio de turno #${p.appointmentId}`;
  const html = `
    <h2>Recordatorio de turno</h2>
    <p>Hola ${p.customerName},</p>
    <p>Tu turno es el <b>${p.startsAt}</b> (en ~${p.hoursBefore}h).</p>
  `;
  const text = `Recordatorio: turno #${p.appointmentId} el ${p.startsAt} (en ~${p.hoursBefore}h).`;

  return {
    email: { to: p.toEmail, subject, html },
    whatsapp: p.toWhatsApp ? { to: p.toWhatsApp, text } : undefined,
    push: p.toPushToken ? { to: p.toPushToken, title: subject, body: text } : undefined,
  };
}

function appointmentCanceledTemplate(p: AppointmentCanceledPayload): ComposedMessage {
  const subject = `Turno cancelado #${p.appointmentId}`;
  const reasonLine = p.reason ? `<p>Motivo: <i>${p.reason}</i></p>` : '';
  const html = `
    <h2>Turno cancelado</h2>
    <p>Hola ${p.customerName},</p>
    <p>El turno #${p.appointmentId} fue cancelado por: <b>${p.canceledBy}</b>.</p>
    ${reasonLine}
  `;
  const text = `Turno cancelado #${p.appointmentId}. Cancelado por: ${p.canceledBy}${p.reason ? ` - ${p.reason}` : ''}.`;

  return {
    email: { to: p.toEmail, subject, html },
    whatsapp: p.toWhatsApp ? { to: p.toWhatsApp, text } : undefined,
    push: p.toPushToken ? { to: p.toPushToken, title: subject, body: text } : undefined,
  };
}
