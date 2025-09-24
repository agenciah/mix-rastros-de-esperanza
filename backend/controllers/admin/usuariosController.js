// backend/controllers/admin/usuariosController.js

import { query } from '../../db/users/initDb.js';
import { getAllUsuariosAdmin } from '../../db/admin/usuarios.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene la lista de todos los usuarios para el dashboard de administrador.
 * No necesita cambios ya que delega la lógica a un archivo de queries ya migrado.
 */
export async function obtenerUsuariosParaAdmin(req, res) {
    try {
        const usuarios = await getAllUsuariosAdmin();
        return res.json(usuarios);
    } catch (error) {
        logger.error(`❌ Error al obtener usuarios para admin: ${error.message}`);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

/**
 * Actualiza los datos de un usuario desde el panel de administrador (Versión PostgreSQL).
 */
export async function actualizarUsuario(req, res) {
    const { id } = req.params;
    const {
        nombre,
        email,
        telefono,
        estado_republica,
        role,
        estado_suscripcion,
        cancelado
    } = req.body;

    try {
        // 1. Validar que el usuario exista
        const userResult = await query('SELECT * FROM users WHERE id = $1', [id]); // ✅ Corregido
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // 2. Actualizar campos usando placeholders de PostgreSQL ($1, $2, etc.)
        await query( // ✅ Corregido
            `UPDATE users SET
                nombre = $1,
                email = $2,
                telefono = $3,
                estado_republica = $4,
                role = $5,
                estado_suscripcion = $6,
                cancelado = $7
            WHERE id = $8`,
            [
                nombre,
                email,
                telefono,
                estado_republica,
                role,
                estado_suscripcion,
                cancelado,
                id
            ]
        );

        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        logger.error(`❌ Error al actualizar usuario ${id}: ${error.message}`);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
}