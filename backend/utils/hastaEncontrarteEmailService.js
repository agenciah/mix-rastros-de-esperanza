// RUTA: backend/utils/hastaEncontrarteEmailService.js

import logger from './logger.js';
import sgMail from '@sendgrid/mail'; 

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// --- 1. Plantilla de Correo (Layout) ---
const getEmailLayout = (contentHtml) => {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background-color:#f7fafc;margin:0;padding:20px;}.container{max-width:600px;margin:auto;background-color:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;}.header{background-color:#1e40af;color:#fff;padding:20px;text-align:center;font-size:24px;font-weight:bold;}.body{padding:30px;color:#1f2937;font-size:16px;line-height:1.6;}.footer{padding:20px;font-size:12px;text-align:center;color:#6b7280;}a{color:#2563eb;}</style></head><body><div class="container"><div class="header">Hasta Encontrarte</div><div class="body">${contentHtml}</div><div class="footer">© ${new Date().getFullYear()} Hasta Encontrarte. Todos los derechos reservados.</div></div></body></html>
  `;
};

// --- 2. Función Principal de Envío (VERSIÓN SENDGRID) ---
const sendEmail = async (to, subject, htmlBody, textBody = '') => {
    // 3. Construimos el mensaje en el formato que SendGrid espera
    const msg = {
        to: to,
        from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: 'Hasta Encontrarte' // El nombre que verán los usuarios
        },
        subject: subject,
        text: textBody,
        html: getEmailLayout(htmlBody), // Reutilizamos tu misma plantilla HTML
    };

    try {
        // ✅ 4. ¡Y simplemente lo enviamos!
        await sgMail.send(msg);
        logger.info(`✅ Correo enviado a ${to} a través de SendGrid.`);
    } catch (error) {
        // El log de error de SendGrid es muy detallado y útil
        logger.error(`❌ Error al enviar correo a través de SendGrid:`, error.response?.body || error.message);
        throw error;
    }
};

// --- 4. Plantillas de Correo Específicas para "Hasta Encontrarte" ---

/** 📧 1. Confirmación de Cuenta */
export async function sendHEConfirmationEmail(to, token) {
    const subject = 'Confirma tu cuenta en Hasta Encontrarte';
    const link = `${process.env.FRONTEND_URL}/confirmar-email?token=${token}`;
    const text = `Hola,\n\nGracias por registrarte. Por favor, confirma tu cuenta haciendo clic en el siguiente enlace:\n${link}\n\nSi no te registraste, por favor ignora este correo.\n\nEl equipo de Hasta Encontrarte.`;
    const html = `
        <p>Hola,</p>
        <p>Gracias por unirte a nuestra red de ayuda. Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
        <p style="text-align:center; margin: 20px 0;">
            <a href="${link}" style="background-color:#2563eb;color:white;padding:12px 20px;text-decoration:none;border-radius:5px;">Confirmar mi Cuenta</a>
        </p>
        <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
        <p style="font-size:12px; word-break:break-all;">${link}</p>
        <p>Si no te registraste, puedes ignorar este correo.</p>
    `;
    return sendEmail(to, subject, html, text);
}

// ... (el resto de tus funciones exportadas se quedan igual)
export async function sendHEResetPasswordEmail(to, resetUrl) {
    const subject = 'Recuperación de tu contraseña';
    const text = `Hola,\n\nRecibimos una solicitud para restablecer tu contraseña. Haz clic en el enlace para continuar:\n${resetUrl}\n\nEl equipo de Hasta Encontrarte.`;
    const html = `
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva:</p>
        <p style="text-align:center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color:#2563eb;color:white;padding:12px 20px;text-decoration:none;border-radius:5px;">Restablecer Contraseña</a>
        </p>
        <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
        <p style="font-size:12px; word-break:break-all;">${resetUrl}</p>
        <p>El enlace es válido por 30 minutos.</p>
    `;
    return sendEmail(to, subject, text, html);
}
export async function sendHEPasswordChangedEmail(to) {
    const subject = 'Tu contraseña ha sido cambiada';
    const html = `<p>Hola,</p><p>Este es un aviso para informarte que la contraseña de tu cuenta ha sido cambiada recientemente.</p><p>Si no reconoces esta actividad, por favor contacta a nuestro equipo de soporte de inmediato.</p>`;
    return sendEmail(to, subject, '', html);
}
export async function sendHEMatchNotification(to, nombreFicha, hallazgoId) {
    const subject = `🚨 ¡Posibles coincidencias para la búsqueda de ${nombreFicha}!`;
    const link = `${process.env.FRONTEND_URL}/dashboard/hallazgos-list/${hallazgoId}`;
    const html = `<p>Hola,</p><p>Hemos encontrado una posible coincidencia importante para tu ficha de búsqueda de <strong>${nombreFicha}</strong>.</p><p>Por favor, inicia sesión para revisar los detalles.</p><p style="text-align:center; margin: 20px 0;"><a href="${link}" style="background-color:#2563eb;color:white;padding:12px 20px;text-decoration:none;border-radius:5px;">Revisar Coincidencia</a></p>`;
    return sendEmail(to, subject, '', html);
}
export async function sendHECancelacionEmail(to, nombre) {
    const subject = 'Confirmación de tu solicitud de cancelación';
    const text = `Hola ${nombre},\n\nHemos recibido tu solicitud para eliminar tu cuenta. Será procesada en las próximas 24 horas.\n\nGracias por haber formado parte de nuestra comunidad.\n\nEl equipo de Hasta Encontrarte.`;
    const html = `<p>Hola ${nombre},</p><p>Hemos recibido tu solicitud para eliminar tu cuenta. Tu cuenta y todos tus datos serán eliminados permanentemente en las próximas 24 horas.</p><p>Gracias por haber formado parte de la comunidad de Hasta Encontrarte.</p><p>Saludos,<br>El equipo de Hasta Encontrarte.</p>`;
    return sendEmail(to, subject, text, html);
}
export async function sendHEUserDataChangedEmail(to, nombre) {
    const subject = 'Aviso de seguridad: Tus datos han sido actualizados';
    const text = `Hola ${nombre},\n\nTe informamos que algunos de tus datos personales (como nombre, teléfono o email) han sido actualizados recientemente en tu cuenta de Hasta Encontrarte. Si no reconoces esta actividad, por favor, contacta a nuestro equipo de soporte inmediatamente.\n\nEl equipo de Hasta Encontrarte.`;
    const html = `<p>Hola ${nombre},</p><p>Este es un aviso para informarte que la información de tu perfil ha sido actualizada recientemente.</p><p>Si no reconoces esta actividad, por favor, contacta a nuestro equipo de soporte de inmediato respondiendo a este correo y considera cambiar tu contraseña.</p><p>Saludos,<br>El equipo de Hasta Encontrarte.</p>`;
    return sendEmail(to, subject, text, html);
}
export async function sendHEPlanChangedEmail(to, nombre, nuevoPlan) {
    const subject = 'Confirmación de cambio en tu plan de donación';
    const html = `<p>Hola ${nombre},</p><p>Te confirmamos que tu plan de donación ha sido actualizado a <strong>${nuevoPlan}</strong>.</p><p>Gracias por tu continuo apoyo a nuestra causa.</p><p>Saludos,<br>El equipo de Hasta Encontrarte.</p>`;
    return sendEmail(to, subject, '', html);
}