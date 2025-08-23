// forgotPasswordController.js
import { openDb } from '../../db/users/initDb.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { sendResetPasswordEmail, sendPasswordChangedNotificationEmail } from '../../utils/emails/passwordRecoveryEmail.js'
import logger from '../../utils/logger.js'

const TOKEN_EXPIRATION_MINUTES = 30

export const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email || typeof email !== 'string') {
    logger.warn('[forgotPassword] Solicitud inválida: email ausente o malformado')
    return res.status(400).json({ message: 'Correo requerido' })
  }

  try {
    const db = await openDb()
    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail])

    const genericMessage = 'Si el correo existe, se ha enviado un enlace'

    if (!user) {
      logger.info(`[forgotPassword] Solicitud de recuperación para correo no registrado: ${normalizedEmail}`)
      return res.status(200).json({ message: genericMessage })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000).toISOString()

    await db.run(
      `UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE id = ?`,
      [token, expiresAt, user.id]
    )

    const resetUrl = `${process.env.FRONTEND_URL}/recuperar/${token}`
    await sendResetPasswordEmail(user.email, resetUrl)

    logger.info(`[forgotPassword] Token generado y correo enviado a ${user.email}`)
    return res.status(200).json({ message: genericMessage })
  } catch (err) {
    logger.error('[forgotPassword] Error inesperado:', err)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body

  if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
    logger.warn('[resetPassword] Solicitud inválida: token o contraseña ausente/malformada')
    return res.status(400).json({ message: 'Token y nueva contraseña requeridos' })
  }

  if (newPassword.length < 6) {
    logger.warn('[resetPassword] Contraseña demasiado corta')
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
  }

  try {
    const db = await openDb()
    const user = await db.get(
      `SELECT * FROM users WHERE reset_token = ? AND reset_token_expiration > datetime('now')`,
      [token]
    )

    if (!user) {
      logger.warn('[resetPassword] Token inválido o expirado')
      return res.status(400).json({ message: 'Token inválido o expirado' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await db.run(
      `UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    )

    await sendPasswordChangedNotificationEmail(user.email)
    logger.info(`[resetPassword] Contraseña actualizada correctamente para el usuario ${user.email}`)

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    logger.error('[resetPassword] Error inesperado al actualizar la contraseña:', err)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
