// backend/controllers/match/matchController.js
import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Busca coincidencias entre un nuevo hallazgo y las fichas de desaparición existentes.
 * @param {Object} hallazgoData - Datos del hallazgo a comparar.
 * @param {number} [hallazgoData.id_ubicacion_hallazgo] - ID de la ubicación del hallazgo.
 * @param {Array<Object>} [hallazgoData.rasgos_hallazgo] - Rasgos físicos.
 * @param {Array<Object>} [hallazgoData.vestimenta_hallazgo] - Prendas de vestir.
 * @returns {Promise<Array<Object>>} Promesa que resuelve con una lista de fichas coincidentes.
 */
export const findMatchesForHallazgo = async (hallazgoData) => {
    const db = await openDb();

    try {
        const { id_ubicacion_hallazgo, rasgos_hallazgo, vestimenta_hallazgo } = hallazgoData;

        // Paso 1: Obtener todas las fichas de desaparición activas con sus datos completos
        const fichas = await db.all(
            `SELECT
                fd.id_ficha,
                fd.id_ubicacion_desaparicion,
                fd.nombre,
                fd.segundo_nombre,
                fd.apellido_paterno,
                fd.apellido_materno,
                u.estado,
                u.municipio,
                u.localidad,
                u.latitud,
                u.longitud
            FROM fichas_desaparicion fd
            LEFT JOIN ubicaciones u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
            WHERE fd.estado_ficha = 'activa'`
        );

        if (fichas.length === 0) {
            return []; // No hay fichas activas para comparar
        }

        const scoredMatches = [];

        // Paso 2: Iterar sobre cada ficha para calcular su puntuación de coincidencia
        for (const ficha of fichas) {
            let score = 0;

            // Comparación de ubicación
            if (id_ubicacion_hallazgo === ficha.id_ubicacion_desaparicion) {
                score += 50; // Puntuación alta por coincidencia de ID de ubicación
            }

            // Comparación de rasgos físicos (tipo_caracteristica)
            if (rasgos_hallazgo && rasgos_hallazgo.length > 0) {
                const fichaRasgos = await db.all(
                    `SELECT id_parte_cuerpo, tipo_caracteristica FROM ficha_caracteristicas WHERE id_ficha = ?`,
                    [ficha.id_ficha]
                );

                for (const hRasgo of rasgos_hallazgo) {
                    const match = fichaRasgos.some(fRasgo =>
                        fRasgo.id_parte_cuerpo === hRasgo.id_parte_cuerpo && fRasgo.tipo_caracteristica.toLowerCase() === hRasgo.tipo_caracteristica.toLowerCase()
                    );
                    if (match) {
                        score += 20; // Puntuación por coincidencia de rasgo
                    }
                }
            }

            // Comparación de vestimenta
            if (vestimenta_hallazgo && vestimenta_hallazgo.length > 0) {
                const fichaVestimenta = await db.all(
                    `SELECT id_prenda, color FROM ficha_vestimenta WHERE id_ficha = ?`,
                    [ficha.id_ficha]
                );

                for (const hPrenda of vestimenta_hallazgo) {
                    const match = fichaVestimenta.some(fPrenda =>
                        fPrenda.id_prenda === hPrenda.id_prenda && fPrenda.color && fPrenda.color.toLowerCase() === hPrenda.color.toLowerCase()
                    );
                    if (match) {
                        score += 15; // Puntuación por coincidencia de prenda y color
                    }
                }
            }
            
            // Si la puntuación es superior a 20, la consideramos una coincidencia potencial.
            if (score >= 20) {
                scoredMatches.push({ ...ficha, match_score: score });
            }
        }

        // Ordenar las coincidencias por la puntuación de forma descendente
        scoredMatches.sort((a, b) => b.match_score - a.match_score);

        return scoredMatches;

    } catch (error) {
        logger.error(`❌ Error al buscar coincidencias para hallazgo: ${error.message}`);
        throw new Error('Error interno del servidor al buscar coincidencias.');
    }
};