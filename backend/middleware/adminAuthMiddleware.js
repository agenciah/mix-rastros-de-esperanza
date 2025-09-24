import jwt from 'jsonwebtoken';
import { query } from '../db/users/initDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_temporal';

export async function authenticateAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado.' });

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer')
    return res.status(401).json({ error: 'Token mal formado.' });

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await openDb();
    const admin = await db.get('SELECT * FROM admins WHERE id = ?', decoded.id);

    if (!admin) return res.status(404).json({ error: 'Admin no encontrado.' });

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}
