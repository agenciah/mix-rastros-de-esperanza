// backend/controllers/fichas/matchingService.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { sendMatchNotification } from '../../utils/emailService.js';
import { getFichaCompletaById, getAllHallazgosCompletos } from '../../db/queries/fichasAndHallazgosQueries.js';
import { insertSystemNotification, insertPossibleMatch } from '../../db/queries/messagingQueries.js';
import { createNotification } from '../../db/queries/notificationsQueries.js';

/**
 * Busca posibles coincidencias entre una nueva ficha de desaparición y los hallazgos existentes.
 * @param {object} fichaData - Los datos de la ficha de desaparición recién creada.
 * @returns {Promise<Array<object>>} - Una lista de hallazgos que coinciden, ordenada por un puntaje de relevancia.
 */
export async function findMatchesForFicha(req, fichaData) {
    logger.info(`🔍 Buscando coincidencias para la ficha: ${fichaData.id_ficha}`);
    
    try {
        const { id_ficha, ubicacion_desaparicion, rasgos_fisicos, vestimenta } = fichaData;
        const db = await openDb();

        const fichaCompleta = await getFichaCompletaById(id_ficha);
        if (!fichaCompleta) {
            logger.warn(`Ficha con ID ${id_ficha} no encontrada para matching.`);
            return [];
        }

        const hallazgos = await getAllHallazgosCompletos();
        
        if (hallazgos.length > 0) {
            logger.debug(`Estructura del primer hallazgo para depuración: `, hallazgos[0]);
        }

        const matches = [];

        for (const hallazgo of hallazgos) {
            let score = 0;
            let matchedCriteria = [];

            // Coincidencia por datos generales (NUEVA LÓGICA)
            const generalDataMatch = checkGeneralDataMatch(fichaCompleta, hallazgo);
            if (generalDataMatch.score > 0) {
                score += generalDataMatch.score;
                matchedCriteria.push(...generalDataMatch.criteria);
            }

            // Coincidencia por Ubicación
            const locationMatch = checkLocationMatch(ubicacion_desaparicion, hallazgo);
            if (locationMatch.score > 0) {
                score += locationMatch.score;
                matchedCriteria.push(...locationMatch.criteria);
            }

            // Coincidencia por Rasgos Físicos
            if (rasgos_fisicos && rasgos_fisicos.length > 0) {
                const rasgosScore = checkRasgosMatch(rasgos_fisicos, hallazgo.rasgos_fisicos);
                if (rasgosScore.score > 0) {
                    score += rasgosScore.score;
                    matchedCriteria.push(...rasgosScore.criteria);
                }
            }

            // Coincidencia por Vestimenta
            if (vestimenta && vestimenta.length > 0) {
                const vestimentaScore = checkVestimentaMatch(vestimenta, hallazgo.vestimenta);
                if (vestimentaScore.score > 0) {
                    score += vestimentaScore.score;
                    matchedCriteria.push(...vestimentaScore.criteria);
                }
            }
            
            // Coincidencia por Nombre
            const nameScore = checkNameMatch(fichaCompleta, hallazgo);
            if (nameScore.score > 0) {
                score += nameScore.score;
                matchedCriteria.push(...nameScore.criteria);
            }

            if (score > 0) {
                matches.push({
                    id_hallazgo: hallazgo.id_hallazgo,
                    score,
                    matchedCriteria,
                    id_usuario_reporte: hallazgo.id_usuario_buscador
                });
            }
        }

        matches.sort((a, b) => b.score - a.score);
        const topMatches = matches.slice(0, 10);

        for (const match of topMatches) {
            await insertPossibleMatch(db, id_ficha, match.id_hallazgo, match.score, match.matchedCriteria.join(', '));
        }
        logger.info(`✅ ${topMatches.length} posibles coincidencias guardadas para la ficha ${id_ficha}`);

        await notifyMatchedUsers(topMatches, fichaCompleta.nombre);

        return topMatches;

    } catch (error) {
        logger.error('❌ Error en el servicio de matching:', error);
        throw error;
    }
}

/**
 * Lógica para verificar la coincidencia de ubicación.
 */
export function checkLocationMatch(ubicacionFicha, hallazgo) {
    let score = 0;
    let criteria = [];

    if (ubicacionFicha.estado === hallazgo.estado) {
        score += 50;
        criteria.push('Coincidencia de Estado');
    }

    if (ubicacionFicha.municipio === hallazgo.municipio) {
        score += 100;
        criteria.push('Coincidencia de Municipio');
    }

    return { score, criteria };
}

/**
 * Lógica para verificar la coincidencia de datos biográficos.
 */
export function checkGeneralDataMatch(ficha, hallazgo) {
    let score = 0;
    let criteria = [];

    // Coincidencia de género (fuerte)
    if (ficha.genero && hallazgo.genero && ficha.genero === hallazgo.genero) {
        score += 200;
        criteria.push('Coincidencia de Género');
    }

    // Coincidencia de edad (tolerancia de 2 años)
    if (ficha.edad_estimada && hallazgo.edad_estimada) {
        const ageDiff = Math.abs(ficha.edad_estimada - hallazgo.edad_estimada);
        if (ageDiff <= 2) {
            score += 150;
            criteria.push(`Coincidencia de Edad (diferencia de ${ageDiff} años)`);
        }
    }
    
    // Coincidencia de estatura (tolerancia de 5% de la ficha)
    if (ficha.estatura && hallazgo.estatura) {
        const estaturaDiff = Math.abs(ficha.estatura - hallazgo.estatura);
        if (estaturaDiff <= (ficha.estatura * 0.05)) {
            score += 100;
            criteria.push('Coincidencia de Estatura');
        }
    }

    // Coincidencia de peso (tolerancia de 5% de la ficha)
    if (ficha.peso && hallazgo.peso) {
        const pesoDiff = Math.abs(ficha.peso - hallazgo.peso);
        if (pesoDiff <= (ficha.peso * 0.05)) {
            score += 100;
            criteria.push('Coincidencia de Peso');
        }
    }

    // Coincidencia de complexión
    if (ficha.complexion && hallazgo.complexion && ficha.complexion === hallazgo.complexion) {
        score += 50;
        criteria.push('Coincidencia de Complexión');
    }

    return { score, criteria };
}

/**
 * Lógica para verificar la coincidencia de rasgos físicos.
 */
export function checkRasgosMatch(rasgosFicha, rasgosHallazgo) {
    let score = 0;
    let criteria = [];

    if (!Array.isArray(rasgosHallazgo)) {
        logger.warn(`rasgosHallazgo no es un array, se recibió: ${JSON.stringify(rasgosHallazgo)}`);
        return { score, criteria };
    }

    for (const rasgoFicha of rasgosFicha) {
        const matchedRasgo = rasgosHallazgo.find(rh => 
            rh.id_parte_cuerpo === rasgoFicha.id_parte_cuerpo &&
            rh.descripcion.toLowerCase().includes(rasgoFicha.descripcion_detalle.toLowerCase())
        );
        if (matchedRasgo) {
            score += 30;
            criteria.push(`Coincidencia de Rasgo Físico: ${rasgoFicha.descripcion_detalle}`);
        }
    }

    return { score, criteria };
}

/**
 * Lógica para verificar la coincidencia de vestimenta.
 */
export function checkVestimentaMatch(vestimentaFicha, vestimentaHallazgo) {
    let score = 0;
    let criteria = [];

    if (!Array.isArray(vestimentaHallazgo)) {
        logger.warn(`vestimentaHallazgo no es un array, se recibió: ${JSON.stringify(vestimentaHallazgo)}`);
        return { score, criteria };
    }

    for (const prendaFicha of vestimentaFicha) {
        const matchedPrenda = vestimentaHallazgo.find(ph => 
            ph.id_prenda === prendaFicha.id_prenda &&
            (prendaFicha.color && ph.color && ph.color.toLowerCase() === prendaFicha.color.toLowerCase())
        );
        if (matchedPrenda) {
            score += 20;
            criteria.push(`Coincidencia de Vestimenta: ${prendaFicha.color} ${prendaFicha.tipo_prenda}`);
        }
    }

    return { score, criteria };
}

/**
 * Lógica para verificar la coincidencia de nombre.
 */
export function checkNameMatch(ficha, hallazgo) {
    let score = 0;
    let criteria = [];
    
    const fichaNombreCompleto = `${ficha.nombre} ${ficha.apellido_paterno}`.toLowerCase();
    const hallazgoNombreCompleto = `${hallazgo.nombre} ${hallazgo.apellido_paterno}`.toLowerCase();
    
    if (fichaNombreCompleto === hallazgoNombreCompleto) {
        score += 500;
        criteria.push('Coincidencia de Nombre Exacta');
    } else if (ficha.nombre.toLowerCase() === hallazgo.nombre.toLowerCase()) {
        score += 100;
        criteria.push('Coincidencia en el Primer Nombre');
    }
    
    return { score, criteria };
}

/**
 * Notifica al CREADOR DE LA FICHA sobre las posibles coincidencias encontradas.
 */
async function notifyMatchedUsers(req, topMatches, fichaCompleta) {
    if (topMatches.length === 0) {
        return;
    }

    const db = await openDb();
    const creadorDeLaFicha = await db.get('SELECT id, nombre, email FROM users WHERE id = ?', [fichaCompleta.id_usuario_creador]);

    if (!creadorDeLaFicha) {
        logger.warn(`No se encontró al usuario creador (ID: ${fichaCompleta.id_usuario_creador}) para notificar.`);
        return;
    }

    // Preparamos un resumen de las coincidencias para las notificaciones
    const resumenCoincidencias = topMatches.map(match => `- Hallazgo #${match.id_hallazgo} (Puntaje: ${match.score})`).join('\n');

    // 1. Notificación por Email
    const subject = `🚨 ¡Posibles coincidencias para la búsqueda de ${fichaCompleta.nombre}!`;
    const message = `Hola ${creadorDeLaFicha.nombre},\n\nHemos encontrado ${topMatches.length} posible(s) coincidencia(s) para tu ficha de búsqueda de ${fichaCompleta.nombre}. Por favor, inicia sesión para revisar los detalles.\n\nCoincidencias:\n${resumenCoincidencias}\n\nSaludos,\nEl equipo de Rastros de Esperanza.`;
    
    await sendMatchNotification(creadorDeLaFicha.email, subject, message);
    logger.info(`📧 Email de coincidencia enviado a ${creadorDeLaFicha.email}`);
    
    // Suponemos que solo hay una coincidencia principal para la notificación inicial
    const matchPrincipal = topMatches[0];

    // 2. Notificación guardada en la Base de Datos
    const notificationContent = `¡Encontramos una posible coincidencia para tu búsqueda de ${fichaCompleta.nombre}! Revisa el Hallazgo #${matchPrincipal.id_hallazgo}.`;
    const urlDestino = `/dashboard/hallazgos-list/${matchPrincipal.id_hallazgo}`; // URL para ver el detalle del hallazgo
    
    await createNotification(
        creadorDeLaFicha.id,
        'nueva_coincidencia',
        notificationContent,
        urlDestino
    );
    logger.info(`💾 Notificación de coincidencia guardada en la BD para el usuario ${creadorDeLaFicha.id}.`);

    // 3. Notificación por WebSocket
    const { sendNotificationToUser } = req.app.locals;
    if (sendNotificationToUser) {
        sendNotificationToUser(creadorDeLaFicha.id, {
            type: 'NEW_MATCH',
            payload: {
                contenido: notificationContent,
                url: urlDestino
            }
        });
        logger.info(`🔌 Notificación de coincidencia enviada por WebSocket al usuario ${creadorDeLaFicha.id}.`);
    }
}