// RUTA: backend/db/admin/usuarios.js
/**
 * @fileoverview Funciones de base de datos exclusivas para el dashboard de administrador.
 */
import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene la lista de usuarios para el dashboard de administrador.
 * ✅ AHORA ACEPTA UN FILTRO DE ESTADO ('activo', 'inactivo', o 'todos').
 */
export async function getAllUsuariosAdmin(statusFilter = 'activo') { // Por defecto, solo mostrará los activos
    let whereClause = '';
    const queryParams = [];

    if (statusFilter === 'activo') {
        whereClause = `WHERE u.estado_cuenta = $1`;
        queryParams.push('activo');
    } else if (statusFilter === 'inactivo') {
        whereClause = `WHERE u.estado_cuenta = $1`;
        queryParams.push('inactivo');
    }
    // Si statusFilter es 'todos' o cualquier otra cosa, el whereClause se queda vacío y trae todo.

    const sql = `
        SELECT
          u.id,
          u.nombre,
          u.email,
          u.telefono,
          u.estado_republica,
          u.role,
          u.estado_suscripcion,
          u.estado_cuenta, -- ✅ Añadimos el estado de la cuenta para verlo en el frontend
          u.ultima_conexion,
          u.fichas_activas_pagadas,
          (SELECT COUNT(*) FROM fichas_desaparicion WHERE id_usuario_creador = u.id) as total_fichas,
          (SELECT COUNT(*) FROM hallazgos WHERE id_usuario_buscador = u.id) as total_hallazgos,
          u.acepto_terminos,
          u.fecha_aceptacion
        FROM users u
        ${whereClause}
        ORDER BY u.id DESC;
    `;
    try {
        const result = await query(sql, queryParams);
        return result.rows.map(user => ({
            ...user,
            total_fichas: parseInt(user.total_fichas, 10),
            total_hallazgos: parseInt(user.total_hallazgos, 10)
        }));
    } catch (error) {
        logger.error(`❌ Error en getAllUsuariosAdmin (PostgreSQL): ${error.message}`);
        throw error;
    }
}