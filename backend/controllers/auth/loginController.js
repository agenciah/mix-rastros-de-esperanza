// controllers/auth/loginController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, updateUserUltimaConexion } from '../../db/users/core.js';
import logger from '../../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

export async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('❗ Intento de inicio de sesión con campos incompletos');
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  // Normalizar email sin reasignar un const
  const emailNormalized = email.trim().toLowerCase();

  try {
    const user = await findUserByEmail(emailNormalized);
    logger.info(`[LOGIN] email=${email} encontrado=${!!user}`);

    if (!user) {
      logger.warn(`⚠️ Usuario no encontrado con el email: ${emailNormalized}`);
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    if (!user.email_confirmed) {
      logger.warn(`⚠️ Intento de login con correo no confirmado: ${emailNormalized}`);
      return res.status(403).json({ error: 'Correo no confirmado. Revisa tu email para confirmar tu cuenta.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn(`⚠️ Contraseña incorrecta del email: ${emailNormalized}`);
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    // Actualizar última conexión
    const nowISO = new Date().toISOString();
    await updateUserUltimaConexion(user.id, nowISO);

    // JWT con campos importantes
    const tokenPayload = {
      id: user.id,
      email: user.email,
      telefono: user.telefono,
      plan: user.plan,
      estado_suscripcion: user.estado_suscripcion,
      fichas_activas_pagadas: user.fichas_activas_pagadas,
      numero_referencia_unico: user.numero_referencia_unico,
      estado_republica: user.estado_republica
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Excluir password y confirmation_token de la respuesta
    const { password: _, confirmation_token, ...safeUser } = user;

    res.status(200).json({ 
      token, 
      user: {
        ...safeUser,
        estado_suscripcion: user.estado_suscripcion,
        fichas_activas_pagadas: user.fichas_activas_pagadas,
        numero_referencia_unico: user.numero_referencia_unico,
        estado_republica: user.estado_republica
      }
    });

  } catch (err) {
    logger.warn(`❌ Error en login: ${err.message}`);
    res.status(500).json({ error: 'Error del servidor.' });
  }
}
