// RUTA: backend/controllers/admin/adminMatchesController.js

import { query } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
// Asumimos que estos archivos de queries ya han sido migrados a PostgreSQL
import { getFichaCompletaById } from '../../db/queries/fichasQueries.js'; 
import { getHallazgoCompletoById } from '../../db/queries/hallazgosQueries.js';

/**
 * @route GET /api/admin/matches
 * @desc Obtiene una lista paginada de posibles coincidencias (Versión PostgreSQL).
 */
export const getRecentMatches = async (req, res) => {
    try {
         // Obtiene el pool de PostgreSQL
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const offset = (page - 1) * limit;

        let whereClause = '';
        const queryParams = [];
        
        if (status && status !== 'all') {
            whereClause = `WHERE estado_revision = $1`;
            queryParams.push(status);
        }

        const matchesSql = `
            SELECT 
                p.id_posible_coincidencia, p.id_ficha, p.id_hallazgo,
                p.puntaje, p.criterios_match, p.fecha_creacion, p.estado_revision,
                f.nombre AS nombre_ficha, f.apellido_paterno AS apellido_paterno_ficha,
                h.nombre AS nombre_hallazgo, h.apellido_paterno AS apellido_paterno_hallazgo
            FROM posibles_coincidencias p
            JOIN fichas_desaparicion f ON p.id_ficha = f.id_ficha
            JOIN hallazgos h ON p.id_hallazgo = h.id_hallazgo
            ${whereClause}
            ORDER BY p.fecha_creacion DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        const countSql = `SELECT COUNT(*) AS count FROM posibles_coincidencias ${whereClause}`;

        const [matchesResult, countResult] = await Promise.all([
            db.query(matchesSql, [...queryParams, limit, offset]),
            db.query(countSql, queryParams) // El count no necesita limit/offset
        ]);

        const matches = matchesResult.rows;
        const count = parseInt(countResult.rows[0].count, 10);

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
        logger.error(`❌ Error al obtener coincidencias recientes (PostgreSQL): ${error.message}`);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

/**
 * @route GET /api/admin/matches/:id_coincidencia
 * @desc Obtiene los detalles completos de una coincidencia específica (Versión PostgreSQL).
 */
export const getMatchDetail = async (req, res) => {
    try {
        
        const { id_coincidencia } = req.params;

        const posibleCoincidenciaResult = await db.query(
            `SELECT * FROM posibles_coincidencias WHERE id_posible_coincidencia = $1`, 
            [id_coincidencia]
        );
        const posibleCoincidencia = posibleCoincidenciaResult.rows[0];

        if (!posibleCoincidencia) {
            return res.status(404).json({ message: "Coincidencia no encontrada." });
        }

        const [ficha, hallazgo] = await Promise.all([
            getFichaCompletaById(posibleCoincidencia.id_ficha),
            getHallazgoCompletoById(posibleCoincidencia.id_hallazgo)
        ]);

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
        logger.error(`❌ Error al obtener detalles de la coincidencia ${req.params.id_coincidencia} (PostgreSQL): ${error.message}`);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

/**
 * @route PUT /api/admin/matches/:id_coincidencia/review
 * @desc Actualiza el estado de revisión de una coincidencia (Versión PostgreSQL).
 */
export const updateMatchReviewStatus = async (req, res) => {
    try {
        
        const { id_coincidencia } = req.params;
        const { estado, comentarios } = req.body;

        await db.query(
            `UPDATE posibles_coincidencias
             SET estado_revision = $1, comentarios_admin = $2
             WHERE id_posible_coincidencia = $3`,
            [estado, comentarios, id_coincidencia]
        );

        res.status(200).json({ message: "Estado de la coincidencia actualizado correctamente." });

    } catch (error){  
        logger.error(`❌ Error al actualizar el estado de la coincidencia ${req.params.id_coincidencia} (PostgreSQL): ${error.message}`);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};
