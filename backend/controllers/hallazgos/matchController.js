// RUTA: backend/controllers/hallazgos/matchController.js

import logger from '../../utils/logger.js';
import * as fichasQueries from '../../db/queries/fichasQueries.js';
import * as matchHelpers from '../../utils/matchingHelpers.js';

/**
 * Busca coincidencias de un nuevo hallazgo con fichas de desaparición existentes.
 * @param {Object} hallazgoData - Los datos del hallazgo a buscar coincidencias.
 * @returns {Promise<Array<Object>>} - Una lista de fichas que coinciden.
 */
export async function findMatchesForHallazgo(hallazgoData) {
    logger.info(`🔍 Buscando coincidencias para el hallazgo ID: ${hallazgoData.id_hallazgo}`);
    
    try {
        const fichas = await fichasQueries.getAllPublicFichas(); // Obtiene todas las fichas activas
        if (!fichas || fichas.length === 0) {
            logger.info("No hay fichas activas para comparar.");
            return [];
        }

        const matches = [];
        for (const ficha of fichas) {
            let score = 0;
            let matchedCriteria = [];
            
            const generalMatch = matchHelpers.checkGeneralDataMatch(ficha, hallazgoData);
            score += generalMatch.score;
            matchedCriteria.push(...generalMatch.criteria);

            const locationMatch = matchHelpers.checkLocationMatch(ficha.ubicacion_desaparicion, hallazgoData.ubicacion_hallazgo);
            score += locationMatch.score;
            matchedCriteria.push(...locationMatch.criteria);
            
            const rasgosMatch = matchHelpers.checkRasgosMatch(ficha.rasgos_fisicos, hallazgoData.caracteristicas);
            score += rasgosMatch.score;
            matchedCriteria.push(...rasgosMatch.criteria);

            const vestimentaMatch = matchHelpers.checkVestimentaMatch(ficha.vestimenta, hallazgoData.vestimenta);
            score += vestimentaMatch.score;
            matchedCriteria.push(...vestimentaMatch.criteria);

            const nameMatch = matchHelpers.checkNameMatch(ficha, hallazgoData);
            score += nameMatch.score;
            matchedCriteria.push(...nameMatch.criteria);

            if (score > 50) { // Umbral de puntaje mínimo
                matches.push({
                    id_ficha: ficha.id_ficha,
                    score,
                    matchedCriteria: [...new Set(matchedCriteria)],
                    id_usuario_creador_ficha: ficha.id_usuario_creador,
                });
            }
        }
        
        matches.sort((a, b) => b.score - a.score);
        const topMatches = matches.slice(0, 5);

        if (topMatches.length > 0) {
            logger.info(`✅ ${topMatches.length} posibles coincidencias encontradas para el hallazgo ${hallazgoData.id_hallazgo}`);
        }

        return topMatches;

    } catch (error) {
        logger.error(`❌ Error en el servicio de matching de hallazgos: ${error.message}`);
        return [];
    }
}