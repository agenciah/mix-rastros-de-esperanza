import transporter from '../transporter.js'
import { getFromAlias } from '../emailAliases.js'

/**
 * Enviar enlace de recuperación de contraseña
 * @param {string} email - Correo del usuario
 * @param {string} resetUrl - URL con token de recuperación
 */
export const sendResetPasswordEmail = async (email, resetUrl) => {
  const html = `
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para continuar. Este enlace expirará en 30 minutos:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
    <br>
    <p>— Equipo de Simplika</p>
  `

  await transporter.sendMail({
    from: getFromAlias('soporte'),
    to: email,
    subject: 'Recuperación de contraseña - Simplika',
    html,
  })
}

/**
 * Enviar confirmación de cambio de contraseña
 * @param {string} email - Correo del usuario
 */
export const sendPasswordChangedNotificationEmail = async (email) => {
  const html = `
    <p>Hola,</p>
    <p>Tu contraseña ha sido cambiada exitosamente.</p>
    <p>Si tú no realizaste este cambio, por favor contáctanos de inmediato.</p>
    <br>
    <p>— Equipo de Simplika</p>
  `

  await transporter.sendMail({
    from: getFromAlias('soporte'),
    to: email,
    subject: 'Tu contraseña ha sido actualizada',
    html,
  })
}
