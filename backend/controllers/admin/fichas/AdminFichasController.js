// RUTA: backend/controllers/admin/fichasController.js

import { openDb } from '../../../db/users/initDb.js';
import logger from '../../../utils/logger.js';
// Asumimos que las queries ya fueron migradas a PostgreSQL
import { getFichaCompletaByIdAdmin } from '../../../db/queries/fichasAndHallazgosQueries.js';

/**
 * Obtiene todas las fichas para el admin (Versión PostgreSQL).
 */
export const getAllFichasAdmin = async (req, res) => {
    try {
        const db = openDb();
        const { searchTerm = '', limit = 50, offset = 0 } = req.query;
        const queryTerm = `%${searchTerm.toLowerCase()}%`;

        // Se usa CONCAT para la concatenación y ILIKE para búsqueda case-insensitive
        const fichasSql = `
            SELECT
                fd.id_ficha, fd.nombre, fd.apellido_paterno, fd.fecha_desaparicion,
                fd.estado_ficha, fd.estado_pago,
                u.nombre AS nombre_usuario, u.email AS email_usuario
            FROM fichas_desaparicion AS fd
            LEFT JOIN users AS u ON fd.id_usuario_creador = u.id
            WHERE 
                LOWER(CONCAT(fd.nombre, ' ', COALESCE(fd.segundo_nombre, ''), ' ', fd.apellido_paterno, ' ', COALESCE(fd.apellido_materno, ''))) ILIKE $1
            ORDER BY fd.fecha_desaparicion DESC
            LIMIT $2 OFFSET $3;
        `;
        
        const result = await db.query(fichasSql, [queryTerm, limit, offset]);
        res.json({ success: true, data: result.rows });

    } catch (error) {
        logger.error(`❌ Error al obtener fichas para admin (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener fichas.' });
    }
};

/**
 * Obtiene una ficha específica por ID para el admin.
 * No necesita cambios ya que delega a un archivo de queries ya migrado.
 */
export const getFichaByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const fichaCompleta = await getFichaCompletaByIdAdmin(id);

        if (!fichaCompleta) {
            return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
        }
        
        res.json({ success: true, data: fichaCompleta });
    } catch (error) {
        logger.error(`❌ Error al obtener la ficha por ID para admin: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener la ficha.' });
    }
};

/**
 * Actualiza una ficha existente desde el panel de admin (Versión PostgreSQL).
 */
export const updateFichaAdmin = async (req, res) => {
    const client = await openDb().connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_desaparicion, id_tipo_lugar_desaparicion, foto_perfil,
            estado_ficha, estado_pago, fecha_registro_encontrado,
            ubicacion_desaparicion, rasgos_fisicos, vestimenta,
        } = req.body;

        const fichaResult = await client.query(`SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = $1`, [id]);
        if (fichaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
        }
        const ficha = fichaResult.rows[0];

        // 1. Actualiza la ubicación
        if (ubicacion_desaparicion) {
            const fields = Object.keys(ubicacion_desaparicion);
            const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(', ');
            await client.query(
                `UPDATE ubicaciones SET ${setClause} WHERE id_ubicacion = $${fields.length + 1}`,
                [...Object.values(ubicacion_desaparicion), ficha.id_ubicacion_desaparicion]
            );
        }

        // 2. Actualiza los campos principales de la ficha
        const mainFields = {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_desaparicion, id_tipo_lugar_desaparicion, foto_perfil,
            estado_ficha, estado_pago, fecha_registro_encontrado
        };
        const fichaUpdateData = Object.fromEntries(Object.entries(mainFields).filter(([_, v]) => v !== undefined && v !== null));
        if (Object.keys(fichaUpdateData).length > 0) {
            const fields = Object.keys(fichaUpdateData);
            const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(', ');
            await client.query(
                `UPDATE fichas_desaparicion SET ${setClause} WHERE id_ficha = $${fields.length + 1}`,
                [...Object.values(fichaUpdateData), id]
            );
        }

        // 3. Reemplaza rasgos y vestimenta
        if (rasgos_fisicos) {
            await client.query(`DELETE FROM ficha_rasgos_fisicos WHERE id_ficha = $1`, [id]);
            const promises = rasgos_fisicos.map(r => client.query(`INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES ($1, $2, $3, $4)`, [id, r.id_parte_cuerpo, r.tipo_rasgo, r.descripcion_detalle]));
            await Promise.all(promises);
        }
        if (vestimenta) {
            await client.query(`DELETE FROM ficha_vestimenta WHERE id_ficha = $1`, [id]);
            const promises = vestimenta.map(p => client.query(`INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`, [id, p.id_prenda, p.color, p.marca, p.caracteristica_especial]));
            await Promise.all(promises);
        }
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'Ficha actualizada correctamente' });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al actualizar ficha para admin (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar ficha.' });
    } finally {
        client.release();
    }
};

/**
 * Elimina una ficha de desaparición desde el panel de admin (Versión PostgreSQL).
 */
export const deleteFichaAdmin = async (req, res) => {
    const client = await openDb().connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const fichaResult = await client.query(`SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = $1`, [id]);
        const ficha = fichaResult.rows[0];

        if (!ficha) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
        }

        await client.query(`DELETE FROM fichas_desaparicion WHERE id_ficha = $1`, [id]);
        await client.query(`DELETE FROM ubicaciones WHERE id_ubicacion = $1`, [ficha.id_ubicacion_desaparicion]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Ficha y registros asociados eliminados correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al eliminar ficha para admin (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar ficha.' });
    } finally {
        client.release();
    }
};
