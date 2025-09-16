    // backend/controllers/admin/adminMatchesController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { getFichaCompletaById } from '../../db/queries/fichasAndHallazgosQueries.js';
import { getHallazgoCompletoById } from '../../db/queries/hallazgosQueries.js';

/**
 * @route GET /api/admin/matches
 * @desc Obtiene una lista paginada de posibles coincidencias para el dashboard de admin.
 * @param {object} req - Objeto de la solicitud HTTP.
 * @param {object} res - Objeto de la respuesta HTTP.
 */
export const getRecentMatches = async (req, res) => {
    let db;
    try {
        db = await openDb();
        const { page = 1, limit = 10, status = 'all' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        if (status && status !== 'all') {
            whereClause = `WHERE estado_revision = '${status}'`;
        }

        const matches = await db.all(`
            SELECT 
                p.id_posible_coincidencia,
                p.id_ficha,
                p.id_hallazgo,
                p.puntaje,
                p.criterios_match,
                p.fecha_creacion,
                p.estado_revision,
                f.nombre AS nombre_ficha,
                f.apellido_paterno AS apellido_paterno_ficha,
                h.nombre AS nombre_hallazgo,
                h.apellido_paterno AS apellido_paterno_hallazgo
            FROM posibles_coincidencias p
            JOIN fichas_desaparicion f ON p.id_ficha = f.id_ficha
            JOIN hallazgos h ON p.id_hallazgo = h.id_hallazgo
            ${whereClause}
            ORDER BY p.fecha_creacion DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        const { count } = await db.get(`
            SELECT COUNT(*) AS count
            FROM posibles_coincidencias
            ${whereClause}
        `);

        // Deserializar los criterios_match de JSON a un array de strings
        const matchesWithParsedCriteria = matches.map(match => ({
            ...match,
            criterios_match: JSON.parse(match.criterios_match || '[]')
        }));
        
        res.status(200).json({
            matches: matchesWithParsedCriteria,
            totalItems: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });

    } catch (error) {
        logger.error(`Error al obtener coincidencias recientes: ${error.message}`);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

/**
 * @route GET /api/admin/matches/:id_coincidencia
 * @desc Obtiene los detalles completos de una coincidencia específica.
 * @param {object} req - Objeto de la solicitud HTTP.
 * @param {object} res - Objeto de la respuesta HTTP.
 */
export const getMatchDetail = async (req, res) => {
    let db;
    try {
        db = await openDb();
        const { id_coincidencia } = req.params;

        const posibleCoincidencia = await db.get(`
            SELECT * FROM posibles_coincidencias WHERE id_posible_coincidencia = ?
        `, [id_coincidencia]);

        if (!posibleCoincidencia) {
            return res.status(404).json({ message: "Coincidencia no encontrada." });
        }

        const ficha = await getFichaCompletaById(posibleCoincidencia.id_ficha);
        const hallazgo = await getHallazgoCompletoById(posibleCoincidencia.id_hallazgo);

        const matchDetail = {
            id_posible_coincidencia: posibleCoincidencia.id_posible_coincidencia,
            puntaje: posibleCoincidencia.puntaje,
            criterios_match: JSON.parse(posibleCoincidencia.criterios_match || '[]'),
            estado_revision: posibleCoincidencia.estado_revision,
            comentarios_admin: posibleCoincidencia.comentarios_admin,
            fecha_creacion: posibleCoincidencia.fecha_creacion,
            ficha,
            hallazgo
        };

        res.status(200).json(matchDetail);

    } catch (error) {
        logger.error(`Error al obtener detalles de la coincidencia ${req.params.id_coincidencia}: ${error.message}`);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

/**
 * @route PUT /api/admin/matches/:id_coincidencia/review
 * @desc Actualiza el estado de revisión y los comentarios de una coincidencia.
 * @param {object} req - Objeto de la solicitud HTTP.
 * @param {object} res - Objeto de la respuesta HTTP.
 */
export const updateMatchReviewStatus = async (req, res) => {
    let db;
    try {
        db = await openDb();
        const { id_coincidencia } = req.params;
        const { estado, comentarios } = req.body;

        await db.run(`
            UPDATE posibles_coincidencias
            SET estado_revision = ?, comentarios_admin = ?
            WHERE id_posible_coincidencia = ?
        `, [estado, comentarios, id_coincidencia]);

        res.status(200).json({ message: "Estado de la coincidencia actualizado correctamente." });

    } catch (error) {
        logger.error(`Error al actualizar el estado de la coincidencia ${req.params.id_coincidencia}: ${error.message}`);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

