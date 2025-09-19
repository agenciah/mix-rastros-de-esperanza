// RUTA: backend/controllers/fichas/matchingService.js

import logger from '../../utils/logger.js';
import * as hallazgosQueries from '../../db/queries/hallazgosQueries.js';
import * as matchHelpers from '../../utils/matchingHelpers.js';

/**
 * Orquesta la búsqueda de coincidencias para una ficha.
 * @param {object} fichaData - Los datos completos de la ficha a comparar.
 * @returns {Promise<Array<object>>} - Una lista de las mejores coincidencias.
 */
export async function findMatchesForFicha(fichaData) {
    logger.info(`🔍 Buscando coincidencias para la ficha de: ${fichaData.nombre}`);
    
    try {
        const hallazgos = await hallazgosQueries.getAllHallazgosCompletos();
        if (!hallazgos || hallazgos.length === 0) {
            logger.info("No hay hallazgos en la base de datos para comparar.");
            return [];
        }
        
        const matches = [];

        for (const hallazgo of hallazgos) {
            let score = 0;
            let matchedCriteria = [];

            const generalMatch = matchHelpers.checkGeneralDataMatch(fichaData, hallazgo);
            score += generalMatch.score;
            matchedCriteria.push(...generalMatch.criteria);

            const locationMatch = matchHelpers.checkLocationMatch(fichaData.ubicacion_desaparicion, hallazgo.ubicacion_hallazgo);
            score += locationMatch.score;
            matchedCriteria.push(...locationMatch.criteria);
            
            const rasgosMatch = matchHelpers.checkRasgosMatch(fichaData.rasgos_fisicos, hallazgo.caracteristicas);
            score += rasgosMatch.score;
            matchedCriteria.push(...rasgosMatch.criteria);

            const vestimentaMatch = matchHelpers.checkVestimentaMatch(fichaData.vestimenta, hallazgo.vestimenta);
            score += vestimentaMatch.score;
            matchedCriteria.push(...vestimentaMatch.criteria);

            const nameMatch = matchHelpers.checkNameMatch(fichaData, hallazgo);
            score += nameMatch.score;
            matchedCriteria.push(...nameMatch.criteria);

            if (score > 50) { // Umbral de puntaje mínimo
                matches.push({
                    id_hallazgo: hallazgo.id_hallazgo,
                    score,
                    matchedCriteria: [...new Set(matchedCriteria)],
                });
            }
        }

        matches.sort((a, b) => b.score - a.score);
        const topMatches = matches.slice(0, 5);

        if (topMatches.length > 0) {
            logger.info(`✅ ${topMatches.length} posibles coincidencias encontradas para la ficha ${fichaData.id_ficha}`);
        }

        return topMatches;

    } catch (error) {
        logger.error(`❌ Error fatal en el servicio de matching de fichas: ${error.message}`);
        return [];
    }
}