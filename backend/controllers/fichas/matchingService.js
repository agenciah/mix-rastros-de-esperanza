// backend/controllers/fichas/matchingService.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { sendMatchNotification } from '../../utils/emailService.js';
import { getFichaCompletaById, getAllHallazgosCompletos } from '../../db/queries/fichasAndHallazgosQueries.js';
import { insertSystemNotification, insertPossibleMatch } from '../../db/queries/messagingQueries.js';
import { createNotification } from '../../db/queries/notificationsQueries.js';

/**
 * Orquesta la búsqueda de coincidencias para una ficha.
 * Su única responsabilidad es comparar una ficha contra todos los hallazgos y devolver un puntaje.
 * @param {object} fichaData - Los datos completos de la ficha a comparar.
 * @returns {Promise<Array<object>>} - Una lista de las mejores coincidencias con su puntaje.
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

            // Se utilizan las funciones helper para cada comparación
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

            // Solo consideramos una coincidencia si el puntaje supera un umbral mínimo
            if (score > 50) {
                matches.push({
                    id_hallazgo: hallazgo.id_hallazgo,
                    score,
                    matchedCriteria: [...new Set(matchedCriteria)], // Eliminar criterios duplicados
                });
            }
        }

        // Ordenamos para tener las mejores coincidencias primero
        matches.sort((a, b) => b.score - a.score);
        
        const topMatches = matches.slice(0, 5); // Devolvemos solo las 5 mejores

        if (topMatches.length > 0) {
            logger.info(`✅ ${topMatches.length} posibles coincidencias encontradas para la ficha ${fichaData.id_ficha}`);
        }

        return topMatches;

    } catch (error) {
        logger.error(`❌ Error fatal en el servicio de matching: ${error.message}`);
        return []; // Devolvemos un array vacío en caso de error para no detener el flujo.
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