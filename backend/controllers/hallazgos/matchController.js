// backend/controllers/hallazgos/matchController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Busca coincidencias de un nuevo hallazgo con fichas de desaparición existentes.
 * @param {Object} hallazgoData - Los datos del hallazgo a buscar coincidencias.
 * @returns {Promise<Array<Object>>} Promesa que resuelve con una lista de fichas que coinciden.
 */
export const findMatchesForHallazgo = async (hallazgoData) => {
    let db;
    try {
        db = await openDb();

        // 1. Obtener todas las fichas de desaparición activas
        const fichasDesaparicion = await db.all(`
            SELECT 
                f.*,
                GROUP_CONCAT(DISTINCT frf.id_parte_cuerpo || ':' || frf.tipo_rasgo || ':' || frf.descripcion_detalle) AS caracteristicas_str,
                GROUP_CONCAT(DISTINCT fv.id_prenda || ':' || fv.color || ':' || fv.marca || ':' || fv.caracteristica_especial) AS vestimenta_str
            FROM fichas_desaparicion f
            LEFT JOIN ficha_rasgos_fisicos frf ON f.id_ficha = frf.id_ficha
            LEFT JOIN ficha_vestimenta fv ON f.id_ficha = fv.id_ficha
            WHERE f.estado_ficha = 'activo'
            GROUP BY f.id_ficha
        `);

        if (!fichasDesaparicion || fichasDesaparicion.length === 0) {
            logger.info('🔍 No hay fichas de desaparición activas para buscar coincidencias.');
            return [];
        }

        const matches = [];
        const matchThreshold = 60; // Puntuación mínima para considerarse una "coincidencia"

        // Deserializar las características del hallazgo
        const hallazgoCaracteristicas = hallazgoData.caracteristicas || [];
        const hallazgoVestimenta = hallazgoData.vestimenta || [];

        // 2. Iterar sobre cada ficha y calcular la puntuación de coincidencia
        for (const ficha of fichasDesaparicion) {
            let score = 0;

            // Coincidencia de Ubicación
            const fichaUbicacion = await db.get(`SELECT * FROM ubicaciones WHERE id_ubicacion = ?`, [ficha.id_ubicacion_desaparicion]);
            if (fichaUbicacion && hallazgoData.ubicacion_hallazgo) {
                if (fichaUbicacion.estado === hallazgoData.ubicacion_hallazgo.estado && fichaUbicacion.municipio === hallazgoData.ubicacion_hallazgo.municipio) {
                    score += 50;
                }
            }

            // Coincidencia de Fecha
            if (hallazgoData.fecha_hallazgo && ficha.fecha_desaparicion) {
                const hallazgoDate = new Date(hallazgoData.fecha_hallazgo);
                const fichaDate = new Date(ficha.fecha_desaparicion);
                const diffTime = Math.abs(hallazgoDate - fichaDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) { 
                    score += 30;
                } else if (diffDays <= 30) {
                    score += 10;
                }
            }
            
            // Coincidencia de Características
            const fichaCaracteristicas = ficha.caracteristicas_str ? ficha.caracteristicas_str.split(',').map(s => {
                const parts = s.split(':');
                return { id_parte_cuerpo: parseInt(parts[0]), tipo_rasgo: parts[1], descripcion_detalle: parts[2] };
            }) : [];

            for (const hChar of hallazgoCaracteristicas) {
                for (const fChar of fichaCaracteristicas) {
                    if (hChar.id_parte_cuerpo === fChar.id_parte_cuerpo && hChar.tipo_caracteristica === fChar.tipo_rasgo) {
                        score += 10;
                        if (hChar.descripcion && fChar.descripcion_detalle && hChar.descripcion.toLowerCase() === fChar.descripcion_detalle.toLowerCase()) {
                            score += 5;
                        }
                    }
                }
            }

            // Coincidencia de Vestimenta
            const fichaVestimenta = ficha.vestimenta_str ? ficha.vestimenta_str.split(',').map(s => {
                const parts = s.split(':');
                return { id_prenda: parseInt(parts[0]), color: parts[1], marca: parts[2], caracteristica_especial: parts[3] };
            }) : [];

            for (const hVest of hallazgoVestimenta) {
                for (const fVest of fichaVestimenta) {
                    if (hVest.id_prenda && hVest.id_prenda === fVest.id_prenda) {
                        score += 10;
                    }
                    if (hVest.color && fVest.color && hVest.color.toLowerCase() === fVest.color.toLowerCase()) {
                        score += 5;
                    }
                    if (hVest.marca && fVest.marca && hVest.marca.toLowerCase() === fVest.marca.toLowerCase()) {
                        score += 5;
                    }
                }
            }

            // 3. Si la puntuación excede el umbral, agregar la ficha a las coincidencias
            if (score >= matchThreshold) {
                logger.info(`✅ Coincidencia encontrada: Hallazgo ID ${hallazgoData.id_hallazgo} coincide con Ficha ID ${ficha.id_ficha} con una puntuación de ${score}.`);
                matches.push({ id_ficha: ficha.id_ficha, score, id_usuario_creador: ficha.id_usuario_creador });
            }
        }

        return matches;
    } catch (error) {
        logger.error(`❌ Error al buscar coincidencias para hallazgo: ${error.message}`);
        // Devolver un array vacío en caso de error para no bloquear la creación del hallazgo
        return [];
    }
};