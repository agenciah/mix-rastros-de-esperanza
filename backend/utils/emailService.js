// backend/services/emailService.js

import { wrapEmailLayout } from '../utils/emailLayout.js';
import transporter from '../utils/getTransporter.js';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

function getFromAlias(tipo = 'notificaciones') {
  switch (tipo) {
    case 'soporte':
      return `"Simplika Soporte" <${process.env.EMAIL_ALIAS_SOPORTE}>`;
    case 'contacto':
      return `"Simplika Contacto" <${process.env.EMAIL_ALIAS_CONTACTO}>`;
    case 'notificaciones':
    default:
      return `"Simplika" <${process.env.EMAIL_ALIAS_NOTIFICACIONES}>`;
  }
}

// 📧 Confirmación de cuenta
export async function sendConfirmationEmail(to, token) {
  const confirmUrl = `${frontendUrl}/api/auth/confirm?token=${token}`;

  const mailOptions = {
    from: getFromAlias('notificaciones'),
    to,
    subject: 'Confirma tu cuenta',
    html: wrapEmailLayout(`
      <p>Hola 👋,</p>
      <p>Gracias por registrarte. Por favor confirma tu correo haciendo clic en el siguiente enlace:</p>
      <a href="${confirmUrl}">Confirmar correo</a>
      <p>Este enlace expirará en 24 horas.</p>
    `)
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error al enviar correo de confirmación:', error);
    throw error;
  }
}

// 📧 Aviso de expiración
// 📧 Aviso de expiración
export async function sendExpirationEmail(to, nombre) {
  if (!to || !nombre) {
    console.error('❌ No se pudo enviar el correo de expiración: faltan parámetros', { to, nombre });
    return;
  }

  const mailOptions = {
    from: getFromAlias('notificaciones'),
    to,
    subject: 'Tu periodo de prueba ha expirado',
    html: wrapEmailLayout(`
      <p>Hola ${nombre},</p>
      <p>Tu periodo de prueba de 15 días ha expirado. Si deseas seguir utilizando el servicio de simplika en cualquiera de sus servicios, ya sea para registrar gastos, facturar tickets, puedes suscribirte a uno de nuestros planes.</p>
      <p><a href="https://simplika.lat/planes" target="_blank" style="color:#007bff;">Ver planes disponibles</a></p>
      <p>Si tienes dudas, contáctanos respondiendo a este correo o vía WhatsApp.</p>
      <p>Gracias por probar nuestro servicio 🙌</p>
    `)
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error al enviar correo de expiración:', { to, nombre, error });
    throw error;
  }
}

// 📧 Confirmación de cancelación
export async function sendCancelacionEmail(to, nombre, diasRestantes, plan, ticketsRestantes = null) {
  let detallesUso = `<p>Podrás seguir usando tu plan actual durante <strong>${diasRestantes} día(s)</strong>.</p>`;

  if (plan === 'facturacion' && ticketsRestantes !== null) {
    detallesUso += `<p>Aún puedes facturar <strong>${ticketsRestantes} ticket(s)</strong> hasta que expire tu servicio.</p>`;
  }

  const mailOptions = {
    from: getFromAlias('soporte'),
    to,
    subject: 'Confirmación de cancelación del servicio',
    html: wrapEmailLayout(`
      <p>Hola ${nombre},</p>
      <p>Hemos recibido tu solicitud de cancelación. ${detallesUso}</p>
      <p>Gracias por haber usado nuestro servicio. Esperamos verte de vuelta pronto.</p>
    `)
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error al enviar correo de cancelación:', error);
    throw error;
  }
}

// 📧 Confirmación de pago
export async function sendPagoConfirmadoEmail(to, nombreUsuario, plan, monto, periodo, pdfBuffer = null) {
  const mailOptions = {
    from: getFromAlias('notificaciones'),
    to,
    subject: 'Confirmación de pago exitoso',
    html: wrapEmailLayout(`
      <p>Hola ${nombreUsuario},</p>
      <p>Gracias por tu pago. Hemos recibido correctamente tu suscripción al plan <strong>${plan}</strong>.</p>
      <p><strong>Monto:</strong> $${monto}</p>
      <p><strong>Periodo:</strong> ${periodo}</p>
      <p>Adjuntamos tu comprobante en PDF para tu referencia.</p>
      <p>¡Gracias por confiar en nosotros!</p>
    `)
  };

  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: 'comprobante_pago.pdf',
        content: pdfBuffer,
      },
    ];
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error al enviar correo de pago confirmado:', error);
    throw error;
  }
}
