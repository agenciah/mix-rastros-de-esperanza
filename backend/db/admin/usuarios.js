// RUTA: backend/db/admin/usuarios.js
/**
 * @fileoverview Funciones de base de datos exclusivas para el dashboard de administrador.
 */
import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene la lista de todos los usuarios con datos relevantes para el dashboard de administrador.
 * Incluye un conteo de fichas y hallazgos por cada usuario.
 */
export async function getAllUsuariosAdmin() {
    const sql = `
        SELECT
          u.id,
          u.nombre,
          u.email,
          u.telefono,
          u.estado_republica,
          u.role,
          u.estado_suscripcion,
          u.ultima_conexion,
          u.fichas_activas_pagadas,
          (SELECT COUNT(*) FROM fichas_desaparicion WHERE id_usuario_creador = u.id) as total_fichas,
          (SELECT COUNT(*) FROM hallazgos WHERE id_usuario_buscador = u.id) as total_hallazgos,
          u.acepto_terminos,
          u.fecha_aceptacion
        FROM users u
        ORDER BY u.id DESC;
    `;
    try {
        const result = await query(sql); // ✅ Corregido
        // Convertimos los conteos a números, ya que PostgreSQL los devuelve como strings
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