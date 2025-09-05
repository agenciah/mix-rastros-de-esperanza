// 📁 backend/db/admin/usuarios.js
/**
 * @fileoverview Funciones de base de datos exclusivas para el dashboard de administrador.
 */
import { openDb } from '../../db/users/initDb.js';

/**
 * Obtiene la lista de todos los usuarios con datos relevantes para el dashboard de administrador.
 * Incluye un conteo de fichas y hallazgos por cada usuario.
 */
export async function getAllUsuariosAdmin() {
    const db = await openDb();

    // 1. Traer todos los usuarios con sus campos relevantes.
    // 2. Realizar subconsultas para contar fichas y hallazgos directamente en la consulta principal.
    const usuarios = await db.all(`
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
        ORDER BY u.id DESC
    `);

    return usuarios;
}