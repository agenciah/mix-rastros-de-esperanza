import { openDb } from '../../db/users/initDb.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendHEResetPasswordEmail, sendHEPasswordChangedEmail } from '../../utils/hastaEncontrarteEmailService.js';
import logger from '../../utils/logger.js';

const TOKEN_EXPIRATION_MINUTES = 30;

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
        logger.warn('[forgotPassword] Solicitud inválida: email ausente o malformado');
        return res.status(400).json({ message: 'Correo requerido' });
    }

    try {
        const db = openDb(); // Obtiene el pool de PostgreSQL
        const normalizedEmail = email.trim().toLowerCase();
        
        // Se usa db.query y placeholder $1
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        const user = userResult.rows[0];

        const genericMessage = 'Si el correo existe, se ha enviado un enlace';

        if (!user) {
            logger.info(`[forgotPassword] Solicitud de recuperación para correo no registrado: ${normalizedEmail}`);
            return res.status(200).json({ message: genericMessage });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000);

        await db.query(
            `UPDATE users SET reset_token = $1, reset_token_expiration = $2 WHERE id = $3`,
            [token, expiresAt, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/recuperar/${token}`;
        await sendHEResetPasswordEmail(user.email, resetUrl);

        logger.info(`[forgotPassword] Token generado y correo enviado a ${user.email}`);
        return res.status(200).json({ message: genericMessage });
    } catch (err) {
        logger.error('[forgotPassword] Error inesperado:', err);
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
        const db = openDb();
        
        // PostgreSQL usa NOW() para obtener la fecha y hora actual
        const userResult = await db.query(
            `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiration > NOW()`,
            [token]
        );
        const user = userResult.rows[0];

        if (!user) {
            logger.warn('[resetPassword] Token inválido o expirado');
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
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
