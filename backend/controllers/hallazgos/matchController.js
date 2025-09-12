// backend/controllers/hallazgos/matchController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { getFichaCompletaById, getAllHallazgosCompletos } from '../../db/queries/fichasAndHallazgosQueries.js';
import { insertPossibleMatch } from '../../db/queries/messagingQueries.js';

// Importa las funciones de matching que ya creamos y validamos en el servicio anterior
import {
    checkLocationMatch,
    checkGeneralDataMatch,
    checkRasgosMatch,
    checkVestimentaMatch,
    checkNameMatch
} from '../fichas/matchingService.js';


// ✅ REEMPLAZA TU FUNCIÓN 'getAllFichasCompletas' CON ESTA
const getAllFichasCompletas = async () => {
    const db = await openDb();
    
    // 1. Primero, obtenemos los IDs de todas las fichas activas. Es una consulta muy rápida.
    const fichasActivasIds = await db.all(`
        SELECT id_ficha FROM fichas_desaparicion WHERE estado_ficha = 'activa'
    `);

    if (!fichasActivasIds || fichasActivasIds.length === 0) {
        return [];
    }

    // 2. Luego, para cada ID, usamos la función 'getFichaCompletaById' que ya sabemos que es 100% confiable.
    // Usamos Promise.all para hacer las búsquedas en paralelo y mejorar el rendimiento.
    const fichasCompletasPromises = fichasActivasIds.map(ficha => getFichaCompletaById(ficha.id_ficha));
    const fichasCompletas = await Promise.all(fichasCompletasPromises);

    // Filtramos cualquier resultado nulo que pudiera ocurrir
    return fichasCompletas.filter(Boolean);
};

/**
 * Busca coincidencias de un nuevo hallazgo con fichas de desaparición existentes.
 * @param {Object} hallazgoData - Los datos del hallazgo a buscar coincidencias.
 * @returns {Promise<Array<Object>>} Promesa que resuelve con una lista de fichas que coinciden.
 */
export const findMatchesForHallazgo = async (hallazgoData) => {
    let db;
    try {
        db = await openDb();

        // Obtener todas las fichas de desaparición activas de forma completa
        const fichasDesaparicion = await getAllFichasCompletas();

        if (!fichasDesaparicion || fichasDesaparicion.length === 0) {
            logger.info('🔍 No hay fichas de desaparición activas para buscar coincidencias.');
            return [];
        }

        const matches = [];

        // Iterar sobre cada ficha y calcular la puntuación de coincidencia
        for (const ficha of fichasDesaparicion) {
            let score = 0;
            let matchedCriteria = [];

            // Coincidencia por datos generales
            const generalDataMatch = checkGeneralDataMatch(ficha, hallazgoData);
            if (generalDataMatch.score > 0) {
                score += generalDataMatch.score;
                matchedCriteria.push(...generalDataMatch.criteria);
            }

            // Coincidencia por Ubicación
            const locationMatch = checkLocationMatch(ficha.ubicacion_desaparicion, hallazgoData);
            if (locationMatch.score > 0) {
                score += locationMatch.score;
                matchedCriteria.push(...locationMatch.criteria);
            }

            // Coincidencia por Rasgos Físicos
            if (ficha.rasgos_fisicos && ficha.rasgos_fisicos.length > 0) {
                const rasgosScore = checkRasgosMatch(ficha.rasgos_fisicos, hallazgoData.rasgos_fisicos);
                if (rasgosScore.score > 0) {
                    score += rasgosScore.score;
                    matchedCriteria.push(...rasgosScore.criteria);
                }
            }

            // Coincidencia por Vestimenta
            if (ficha.vestimenta && ficha.vestimenta.length > 0) {
                const vestimentaScore = checkVestimentaMatch(ficha.vestimenta, hallazgoData.vestimenta);
                if (vestimentaScore.score > 0) {
                    score += vestimentaScore.score;
                    matchedCriteria.push(...vestimentaScore.criteria);
                }
            }
            
            // Coincidencia por Nombre
            const nameScore = checkNameMatch(ficha, hallazgoData);
            if (nameScore.score > 0) {
                score += nameScore.score;
                matchedCriteria.push(...nameScore.criteria);
            }

            // Si la puntuación excede el umbral, agregar la ficha a las coincidencias
            const matchThreshold = 60; 
            if (score >= matchThreshold) {
                logger.info(`✅ Coincidencia encontrada: Hallazgo ID ${hallazgoData.id_hallazgo} coincide con Ficha ID ${ficha.id_ficha} con una puntuación de ${score}.`);
                
                // Guardar la posible coincidencia en la base de datos
                await insertPossibleMatch(db, ficha.id_ficha, hallazgoData.id_hallazgo, score, matchedCriteria.join(', '));
                
                matches.push({ id_ficha: ficha.id_ficha, score, id_usuario_creador: ficha.id_usuario_creador });
            }
        }
        
        matches.sort((a, b) => b.score - a.score);
        return matches;

    } catch (error) {
        logger.error(`❌ Error al buscar coincidencias para hallazgo: ${error.message}`);
        return [];
    }
};