// backend/services/matchingService.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { sendMatchNotification } from '../../utils/emailService.js';
import { getFichaCompletaById, getAllHallazgosCompletos } from '../../db/queries/fichasAndHallazgosQueries.js';
import { insertSystemNotification } from '../../db/queries/messagingQueries.js'; // <- Crearemos esta función

/**
 * Busca posibles coincidencias entre una nueva ficha de desaparición y los hallazgos existentes.
 * @param {object} fichaData - Los datos de la ficha de desaparición recién creada.
 * @returns {Promise<Array<object>>} - Una lista de hallazgos que coinciden, ordenada por un puntaje de relevancia.
 */
export async function findMatchesForFicha(fichaData) {
    logger.info(`🔍 Buscando coincidencias para la ficha: ${fichaData.id_ficha}`);
    
    try {
        const { id_ficha, ubicacion_desaparicion, rasgos_fisicos, vestimenta } = fichaData;

        // 1. Obtener los datos completos de la ficha para la notificación
        const fichaCompleta = await getFichaCompletaById(id_ficha);
        if (!fichaCompleta) {
            logger.warn(`Ficha con ID ${id_ficha} no encontrada para matching.`);
            return [];
        }

        // 2. Obtener TODOS los hallazgos activos con sus detalles en una sola consulta
        const hallazgos = await getAllHallazgosCompletos();
        
        // Log para mostrar la estructura de un hallazgo y ver el nombre de la columna del ID de usuario
        if (hallazgos.length > 0) {
            logger.debug(`Estructura del primer hallazgo para depuración: `, hallazgos[0]);
        }

        const matches = [];

        // Lógica de coincidencia, ahora con los datos completos en memoria
        for (const hallazgo of hallazgos) {
            let score = 0;
            let matchedCriteria = [];

            // Coincidencia por Ubicación (puntuación alta)
            const locationMatch = checkLocationMatch(ubicacion_desaparicion, hallazgo);
            if (locationMatch.score > 0) {
                score += locationMatch.score;
                matchedCriteria.push(...locationMatch.criteria);
            }

            // Coincidencia por Rasgos Físicos (puntuación media)
            if (rasgos_fisicos && rasgos_fisicos.length > 0) {
                const rasgosScore = checkRasgosMatch(rasgos_fisicos, hallazgo.rasgos_fisicos);
                if (rasgosScore.score > 0) {
                    score += rasgosScore.score;
                    matchedCriteria.push(...rasgosScore.criteria);
                }
            }

            // Coincidencia por Vestimenta (puntuación media)
            if (vestimenta && vestimenta.length > 0) {
                const vestimentaScore = checkVestimentaMatch(vestimenta, hallazgo.vestimenta);
                if (vestimentaScore.score > 0) {
                    score += vestimentaScore.score;
                    matchedCriteria.push(...vestimentaScore.criteria);
                }
            }

            if (score > 0) {
                matches.push({
                    id_hallazgo: hallazgo.id_hallazgo,
                    score,
                    matchedCriteria,
                    id_usuario_reporte: hallazgo.id_usuario_creador
                });
            }
        }

        // Ordenar los matches por puntaje de forma descendente
        matches.sort((a, b) => b.score - a.score);

        // Filtrar para obtener solo los mejores 10 matches
        const topMatches = matches.slice(0, 10);

        // Enviar notificaciones a los usuarios que reportaron los hallazgos
        await notifyMatchedUsers(topMatches, fichaCompleta.nombre);

        return topMatches;

    } catch (error) {
        logger.error('❌ Error en el servicio de matching:', error);
        throw error;
    }
}

/**
 * Lógica para verificar la coincidencia de ubicación.
 * @param {object} ubicacionFicha - El objeto de ubicación de la ficha.
 * @param {object} hallazgo - El objeto de hallazgo completo, incluyendo los datos de ubicación.
 */
function checkLocationMatch(ubicacionFicha, hallazgo) {
    let score = 0;
    let criteria = [];

    // ✅ La lógica ya está correcta, ya que ahora 'hallazgo' trae los campos 'estado', 'municipio', etc.
    if (ubicacionFicha.estado === hallazgo.estado) {
        score += 50;
        criteria.push('Coincidencia de Estado');
    }

    if (ubicacionFicha.municipio === hallazgo.municipio) {
        score += 100;
        criteria.push('Coincidencia de Municipio');
    }

    const distance = calculateDistance(
        ubicacionFicha.latitud, ubicacionFicha.longitud,
        hallazgo.latitud, hallazgo.longitud
    );

    if (distance <= 10) {
        score += 200;
        criteria.push('Proximidad Geográfica (< 10km)');
    } else if (distance <= 50) {
        score += 100;
        criteria.push('Proximidad Geográfica (< 50km)');
    }
    
    return { score, criteria };
}

/**
 * Lógica para verificar la coincidencia de rasgos físicos.
 */
function checkRasgosMatch(rasgosFicha, rasgosHallazgo) {
    let score = 0;
    let criteria = [];

    for (const rasgoFicha of rasgosFicha) {
        const matchedRasgo = rasgosHallazgo.find(rh => 
            rh.id_parte_cuerpo === rasgoFicha.id_parte_cuerpo &&
            rh.tipo_rasgo === rasgoFicha.tipo_rasgo
        );
        if (matchedRasgo) {
            score += 30; // Puntos por cada rasgo que coincide en parte del cuerpo y tipo
            criteria.push(`Coincidencia de Rasgo Físico: ${matchedRasgo.nombre_parte}`);
        }
    }

    return { score, criteria };
}

/**
 * Lógica para verificar la coincidencia de vestimenta.
 */
function checkVestimentaMatch(vestimentaFicha, vestimentaHallazgo) {
    let score = 0;
    let criteria = [];

    for (const prendaFicha of vestimentaFicha) {
        const matchedPrenda = vestimentaHallazgo.find(ph => 
            ph.id_prenda === prendaFicha.id_prenda &&
            (prendaFicha.color && ph.color.toLowerCase() === prendaFicha.color.toLowerCase())
        );
        if (matchedPrenda) {
            score += 20; // Puntos por cada prenda que coincide en tipo y color
            criteria.push(`Coincidencia de Vestimenta: ${matchedPrenda.tipo_prenda}`);
        }
    }

    return { score, criteria };
}

/**
 * Notifica a los usuarios de los hallazgos coincidentes.
 */
async function notifyMatchedUsers(matches, fichaCompleta) {
    const db = await openDb();
    const notifiedUsers = new Set();
    
    // Obtener los datos del creador de la ficha
    const usuarioFicha = await db.get('SELECT email, nombre FROM users WHERE id = ?', [fichaCompleta.id_usuario_creador]);
    if (!usuarioFicha) {
        logger.warn(`Usuario creador de ficha ${fichaCompleta.id_usuario_creador} no encontrado.`);
        return;
    }

    for (const match of matches) {
        const idUsuarioHallazgo = match.id_usuario_reporte;
        if (!notifiedUsers.has(idUsuarioHallazgo)) {
            const usuarioHallazgo = await db.get('SELECT email, nombre FROM users WHERE id = ?', [idUsuarioHallazgo]);
            if (usuarioHallazgo) {
                // 1. Enviar el correo electrónico
                const subject = `🚨 ¡Posible coincidencia encontrada!`;
                const message = `Hemos encontrado una posible coincidencia para el hallazgo que reportaste, con la ficha de búsqueda de ${fichaCompleta.nombre}. Por favor, revisa tu cuenta para más detalles.`;
                await sendMatchNotification(usuarioHallazgo.email, subject, message);

                // 2. Insertar notificación en la base de datos
                const systemUserId = 1; // Suponiendo que el ID 1 es el usuario del sistema
                const notificationContent = `Se ha encontrado una **posible coincidencia** con el reporte que hiciste. Por favor, revisa la ficha de ${fichaCompleta.nombre} para ver los detalles y decidir si es un match.`;
                
                await insertSystemNotification(
                    idUsuarioHallazgo, // ID del usuario que recibe la notificacion
                    notificationContent,
                    'match_found', // Tipo de notificación
                    fichaCompleta.id_ficha, // ID de la ficha que hizo match
                    match.id_hallazgo // ID del hallazgo que hizo match
                );
                
                notifiedUsers.add(idUsuarioHallazgo);
            }
        }
    }
}

/**
 * Función para calcular la distancia entre dos puntos geográficos (fórmula de Haversine).
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radio de la Tierra en km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distancia en km
}
