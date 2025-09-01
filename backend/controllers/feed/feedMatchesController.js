// backend/controllers/feed/feedMatchesController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
// Importamos la lógica de matching que ya tienes
import { findMatchesForFicha } from '../fichas/matchingService.js';
import { findMatchesForHallazgo } from '../hallazgos/matchController.js';

/**
 * Función auxiliar para obtener las coincidencias de un usuario.
 * No maneja la respuesta HTTP.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Array<Object>>} - Retorna un array de coincidencias.
 */
export const getMatchesData = async (userId) => {
    let db;
    try {
        db = await openDb();

        // 1. Obtener todas las fichas de desaparición creadas por el usuario
        const userFichas = await db.all(
            `SELECT id_ficha FROM fichas_desaparicion WHERE id_usuario_creador = ?`, 
            [userId]
        );

        const allFichaMatches = [];
        // Para cada ficha del usuario, busca coincidencias con todos los hallazgos
        for (const ficha of userFichas) {
            // Este es un paso crítico: necesitas obtener los datos completos de la ficha
            const fichaData = await db.get(
                `SELECT 
                    f.*, 
                    json_group_array(json_object('id_parte_cuerpo', frf.id_parte_cuerpo, 'tipo_rasgo', frf.tipo_rasgo)) AS rasgos_json,
                    json_group_array(json_object('id_prenda', fv.id_prenda, 'color', fv.color)) AS vestimenta_json
                FROM fichas_desaparicion f
                LEFT JOIN ficha_rasgos_fisicos frf ON f.id_ficha = frf.id_ficha
                LEFT JOIN ficha_vestimenta fv ON f.id_ficha = fv.id_ficha
                WHERE f.id_ficha = ?
                GROUP BY f.id_ficha`,
                [ficha.id_ficha]
            );

            // Debes parsear los datos JSON de la misma manera que en tus otros controladores
            fichaData.rasgos_fisicos = JSON.parse(fichaData.rasgos_json);
            fichaData.vestimenta = JSON.parse(fichaData.vestimenta_json);

            // Ahora llama a tu función de matching
            const matches = await findMatchesForFicha(fichaData);
            // Agregamos la ficha de origen a cada coincidencia
            allFichaMatches.push(...matches.map(m => ({ ...m, source: 'ficha', sourceId: ficha.id_ficha })));
        }

        // 2. (Opcional) Obtener todos los hallazgos creados por el usuario
        // ... (Lógica similar a la de las fichas si quieres mostrar coincidencias de hallazgo a ficha)

        // 3. Combinar y ordenar todas las coincidencias
        const allMatches = allFichaMatches; // En este ejemplo solo usamos las de fichas

        // Ordenamos por puntaje de forma descendente
        allMatches.sort((a, b) => b.score - a.score);

        // La función ahora solo retorna los datos.
        return allMatches;

    } catch (error) {
        logger.error(`❌ Error al obtener coincidencias del usuario: ${error.message}`);
        // Retorna un arreglo vacío en caso de error.
        return [];
    }
};