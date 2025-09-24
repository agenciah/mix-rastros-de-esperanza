// RUTA: backend/controllers/feed/feedMatchesController.js

import { query } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
// ✅ 1. Importamos la función maestra que ya migramos
import { getFichaCompletaById } from '../../db/queries/fichasQueries.js'; 
import { findMatchesForFicha } from '../fichas/matchingService.js';

/**
 * Función auxiliar para obtener las coincidencias de un usuario (Versión PostgreSQL).
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Array<Object>>} - Retorna un array de coincidencias.
 */
export const getMatchesData = async (userId) => {
    try {
         // Obtiene el pool de PostgreSQL

        // 1. Obtener todas las fichas de desaparición creadas por el usuario
        const userFichasResult = await db.query(
            `SELECT id_ficha FROM fichas_desaparicion WHERE id_usuario_creador = $1`, 
            [userId]
        );
        const userFichas = userFichasResult.rows;

        const allFichaMatches = [];
        // Para cada ficha del usuario, busca coincidencias
        for (const ficha of userFichas) {
            // ✅ 2. Reemplazamos la consulta SQLite con nuestra función maestra de PostgreSQL
            const fichaData = await getFichaCompletaById(ficha.id_ficha);

            if (fichaData) {
                const matches = await findMatchesForFicha(fichaData);
                // Agregamos la ficha de origen a cada coincidencia (lógica original intacta)
                allFichaMatches.push(...matches.map(m => ({ ...m, source: 'ficha', sourceId: ficha.id_ficha })));
            }
        }

        // 3. Combinar y ordenar todas las coincidencias (lógica original intacta)
        allFichaMatches.sort((a, b) => b.score - a.score);

        return allFichaMatches;

    } catch (error) {
        logger.error(`❌ Error al obtener coincidencias del usuario (PostgreSQL): ${error.message}`);
        return []; // Retorna un arreglo vacío en caso de error.
    }
};
