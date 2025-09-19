// controllers/auth/resendConfirmationController.js
import jwt from 'jsonwebtoken';
import { findUserByEmail, updateUserConfirmationToken } from '../../db/users/core.js';
import { sendConfirmationEmail } from '../../utils/emailService.js';
import { sendHEConfirmationEmail } from '../../utils/hastaEncontrarteEmailService.js';
import logger from '../../utils/logger.js';

export async function resendConfirmationEmail(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo es requerido.' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.email_confirmed) {
      return res.status(400).json({ error: 'El correo ya está confirmado.' });
    }

    const confirmationToken = jwt.sign(
      { email },
      process.env.JWT_CONFIRM_SECRET || 'confirm_secret',
      { expiresIn: '1d' }
    );

    await updateUserConfirmationToken(email, confirmationToken);
    await sendHEConfirmationEmail(email, confirmationToken);

    logger.info(`📧 Correo de confirmación reenviado a ${email}`);
    res.json({ message: 'Correo de confirmación reenviado correctamente.' });
  } catch (error) {
    logger.error(`❌ Error al reenviar correo de confirmación: ${error.message}`);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
