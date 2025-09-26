// backend/controllers/auth/forgotPasswordController.js

import { query } from '../../db/users/initDb.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendHEResetPasswordEmail, sendHEPasswordChangedEmail } from '../../utils/hastaEncontrarteEmailService.js';
import logger from '../../utils/logger.js';

const TOKEN_EXPIRATION_MINUTES = 30;

// ✅ 1. CREAMOS UNA FUNCIÓN AUXILIAR REUTILIZABLE
/**
 * Genera un token de reseteo, lo guarda en la BD y envía el correo.
 * @param {object} user - El objeto del usuario (debe tener id y email).
 */
export async function generarYEnviarTokenDeReseteo(user) {
    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000);

        await query(
            `UPDATE users SET reset_token = $1, reset_token_expiration = $2 WHERE id = $3`,
            [token, expiresAt, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/recuperar/${token}`;
        await sendHEResetPasswordEmail(user.email, resetUrl);

        logger.info(`[Reset Token] Token generado y correo enviado a ${user.email}`);
        return { success: true };
    } catch (err) {
        logger.error('[Reset Token] Error inesperado en la función auxiliar:', err);
        throw err; // Lanzamos el error para que el llamador lo maneje
    }
}


// ✅ 2. SIMPLIFICAMOS EL CONTROLADOR ORIGINAL PARA QUE USE LA FUNCIÓN AUXILIAR
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const genericMessage = 'Si el correo existe, se ha enviado un enlace de recuperación.';

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await findUserByEmail(normalizedEmail);

        if (user) {
            await generarYEnviarTokenDeReseteo(user);
        } else {
            logger.info(`[forgotPassword] Solicitud de recuperación para correo no registrado: ${normalizedEmail}`);
        }
        
        // Siempre enviamos una respuesta exitosa por seguridad
        return res.status(200).json({ message: genericMessage });
    } catch (err) {
        // El error ya fue logueado en la función auxiliar
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
        logger.warn('[resetPassword] Solicitud inválida: token o contraseña ausente/malformada');
        return res.status(400).json({ message: 'Token y nueva contraseña requeridos' });
    }

    if (newPassword.length < 6) {
        logger.warn('[resetPassword] Contraseña demasiado corta');
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        // PostgreSQL usa NOW() para obtener la fecha y hora actual
        const userResult = await query( // ✅ Corregido
            `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiration > NOW()`,
            [token]
        );
        const user = userResult.rows[0];

        if (!user) {
            logger.warn('[resetPassword] Token inválido o expirado');
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await query( // ✅ Corregido
            `UPDATE users SET password = $1, reset_token = NULL, reset_token_expiration = NULL WHERE id = $2`,
            [hashedPassword, user.id]
        );

        // La función de email espera el nombre del usuario, se lo pasamos
        await sendHEPasswordChangedEmail(user.email, user.nombre);
        logger.info(`[resetPassword] Contraseña actualizada correctamente para el usuario ${user.email}`);

        return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        logger.error('[resetPassword] Error inesperado al actualizar la contraseña:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};