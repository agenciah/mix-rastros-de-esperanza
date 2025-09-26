// backend/controllers/admin/usuariosController.js

import { query } from '../../db/users/initDb.js';
import { getAllUsuariosAdmin } from '../../db/admin/usuarios.js';
import logger from '../../utils/logger.js';
import { generarYEnviarTokenDeReseteo } from '../auth/forgotPasswordController.js';

/**
 * Obtiene la lista de todos los usuarios para el dashboard de administrador.
 * ✅ AHORA LEE EL FILTRO DE ESTADO DESDE LA URL.
 */
export async function obtenerUsuariosParaAdmin(req, res) {
    try {
        // Leemos el parámetro 'status' de la URL. Si no viene, por defecto es 'activo'.
        const { status = 'activo' } = req.query;
        
        const usuarios = await getAllUsuariosAdmin(status);
        return res.json(usuarios);
    } catch (error) {
        logger.error(`❌ Error al obtener usuarios para admin: ${error.message}`);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

/**
 * Actualiza los datos de un usuario desde el panel de administrador.
 * ✅ VERSIÓN CORREGIDA: Usa 'estado_cuenta' en lugar de 'cancelado'.
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
        estado_cuenta // Usamos el nuevo campo
    } = req.body;

    try {
        const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        await query(
            `UPDATE users SET
                nombre = $1, email = $2, telefono = $3, estado_republica = $4,
                role = $5, estado_suscripcion = $6, estado_cuenta = $7
            WHERE id = $8`,
            [
                nombre, email, telefono, estado_republica,
                role, estado_suscripcion, estado_cuenta, id
            ]
        );

        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        logger.error(`❌ Error al actualizar usuario ${id}: ${error.message}`);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
}

/**
 * Confirma manualmente el correo de un usuario desde el panel de admin.
 */
export async function confirmarEmailManualmente(req, res) {
    const { id } = req.params; // Obtenemos el ID del usuario de la URL

    try {
        const result = await query(
            `UPDATE users SET email_confirmed = 1 WHERE id = $1`,
            [id]
        );

        // Si la consulta no afectó a ninguna fila, significa que el usuario no existe.
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json({ message: 'Correo del usuario confirmado manualmente con éxito.' });

    } catch (error) {
        logger.error(`❌ Error al confirmar email para usuario ${id}: ${error.message}`);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

/**
 * Dispara el envío de un correo de reseteo de contraseña para un usuario específico.
 */
export async function enviarEnlaceDeReseteo(req, res) {
    const { id } = req.params;

    try {
        const user = await findUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Llamamos a la función reutilizable que creamos en el Paso 1
        await generarYEnviarTokenDeReseteo(user);

        res.json({ message: `Enlace de recuperación enviado a ${user.email}.` });

    } catch (error) {
        // El error ya se loguea en la función auxiliar
        res.status(500).json({ message: 'Error interno del servidor al enviar el correo.' });
    }
}

// ✅ AÑADE ESTA NUEVA FUNCIÓN AL FINAL DEL ARCHIVO
/**
 * Realiza un "soft delete" de un usuario, marcándolo como inactivo.
 */
export async function softDeleteUser(req, res) {
    const { id } = req.params;
    try {
        const result = await query(
            `UPDATE users SET estado_cuenta = 'inactivo', fecha_desactivacion = NOW() WHERE id = $1`,
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json({ message: 'Usuario desactivado correctamente (soft delete).' });
    } catch (error) {
        logger.error(`❌ Error al desactivar usuario ${id}: ${error.message}`);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}