// RUTA: backend/middleware/adminAuthMiddleware.js

import jwt from 'jsonwebtoken';
import { query } from '../db/users/initDb.js';

// ✅ Usa la variable de entorno para el secreto del admin
const JWT_SECRET = process.env.JWT_ADMIN_SECRET || 'clave_secreta_admin_temporal';

export async function authenticateAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado.' });

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer')
        return res.status(401).json({ error: 'Token mal formado.' });

    const token = tokenParts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // ✅ Corregido: Se usa 'query' y se accede a la primera fila del resultado
        const adminResult = await query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
        const admin = adminResult.rows[0];

        if (!admin) return res.status(404).json({ error: 'Admin no encontrado.' });

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
}