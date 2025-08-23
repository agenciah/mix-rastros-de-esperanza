import jwt from 'jsonwebtoken';
import { findUserById } from '../db/users/core.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

export async function authenticateToken(req, res, next) {
  console.log('[authMiddleware] Verificando token de autorización...');

  const authHeader = req.headers['authorization'];
  console.log('[authMiddleware] authHeader:', authHeader);

  const token = authHeader && authHeader.split(' ')[1];
  console.log('[authMiddleware] Token extraído:', token);

  if (!token) {
    console.warn('[authMiddleware] No se proporcionó token.');
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[authMiddleware] Token decodificado:', decoded);

    const user = await findUserById(decoded.id);
    console.log('[authMiddleware] Usuario obtenido de DB:', user);

    if (!user) {
      console.warn('[authMiddleware] Usuario no encontrado en DB.');
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Normaliza el plan a array siempre
    if (!Array.isArray(user.plan)) {
      user.plan = user.plan ? [user.plan] : [];
    }
    console.log('[authMiddleware] Plan del usuario:', user.plan);

    // Validaciones de acceso
    // if (
    //   user.cancelado ||
    //   user.activo === 0 ||
    //   user.plan.length === 0 ||
    //   user.plan.includes('expirado')
    // ) {
    //   console.warn('[authMiddleware] Acceso denegado por estado o plan del usuario.');
    //   return res.status(403).json({ error: 'Tu cuenta ya no tiene acceso al servicio.' });
    // }

    req.user = user;
    console.log('[authMiddleware] Usuario autorizado, pasando al siguiente middleware.');
    next();
  } catch (err) {
    console.error('[authMiddleware] Error de verificación de token:', err.message);
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}
