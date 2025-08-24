// backend/services/matchingService.js
import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { sendMatchNotification } from '../../utils/emailService.js';
import { getFichaById } from './fichasController.js'; // Necesario para obtener datos de la ficha

/**
 * Busca posibles coincidencias entre una nueva ficha de desaparición y los hallazgos existentes.
 * @param {object} fichaData - Los datos de la ficha de desaparición recién creada.
 * @returns {Promise<Array<object>>} - Una lista de hallazgos que coinciden, ordenada por un puntaje de relevancia.
 */
export async function findMatchesForFicha(fichaData) {
  logger.info(`🔍 Buscando coincidencias para la ficha: ${fichaData.id_ficha}`);
  const db = await openDb();

  try {
    const {
      id_ficha,
      ubicacion_desaparicion,
      rasgos_fisicos,
      vestimenta
    } = fichaData;

    // Obtener los datos completos de la ficha para la notificación
    const fichaCompleta = await getFichaById(id_ficha);

    // Consulta base para hallazgos activos (estado 1)
    const hallazgosQuery = `
      SELECT
        h.id_hallazgo, h.id_usuario_reporte, h.foto,
        u.estado, u.municipio, u.localidad, u.latitud, u.longitud,
        (SELECT COUNT(*) FROM hallazgo_caracteristicas WHERE id_hallazgo = h.id_hallazgo) AS num_caracteristicas_hallazgo,
        (SELECT COUNT(*) FROM hallazgo_vestimenta WHERE id_hallazgo = h.id_hallazgo) AS num_vestimenta_hallazgo
      FROM hallazgos AS h
      JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
      WHERE h.estado = 1
    `;

    const hallazgos = await db.all(hallazgosQuery);

    const matches = [];

    // Lógica de coincidencia
    for (const hallazgo of hallazgos) {
      let score = 0;
      let matchedCriteria = [];

      // 1. Coincidencia por Ubicación (puntuación alta)
      const locationMatch = checkLocationMatch(ubicacion_desaparicion, hallazgo);
      if (locationMatch.score > 0) {
        score += locationMatch.score;
        matchedCriteria.push(...locationMatch.criteria);
      }

      // 2. Coincidencia por Rasgos Físicos (puntuación media)
      if (rasgos_fisicos && rasgos_fisicos.length > 0) {
        const rasgosHallazgo = await db.all(`
          SELECT id_parte_cuerpo, tipo_caracteristica, descripcion
          FROM hallazgo_caracteristicas
          WHERE id_hallazgo = ?`, [hallazgo.id_hallazgo]);
        
        const rasgosScore = checkRasgosMatch(rasgos_fisicos, rasgosHallazgo);
        if (rasgosScore.score > 0) {
          score += rasgosScore.score;
          matchedCriteria.push(...rasgosScore.criteria);
        }
      }

      // 3. Coincidencia por Vestimenta (puntuación media)
      if (vestimenta && vestimenta.length > 0) {
        const vestimentaHallazgo = await db.all(`
          SELECT id_prenda, color
          FROM hallazgo_vestimenta
          WHERE id_hallazgo = ?`, [hallazgo.id_hallazgo]);
        
        const vestimentaScore = checkVestimentaMatch(vestimenta, vestimentaHallazgo);
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
          id_usuario_reporte: hallazgo.id_usuario_reporte
        });
      }
    }

    // Ordenar los matches por puntaje de forma descendente
    matches.sort((a, b) => b.score - a.score);

    // Filtrar para obtener solo los mejores 5 o 10 matches
    const topMatches = matches.slice(0, 10);

    // Enviar notificaciones a los usuarios que reportaron los hallazgos
    await notifyMatchedUsers(topMatches, fichaCompleta.nombre_completo);

    return topMatches;

  } catch (error) {
    logger.error('❌ Error en el servicio de matching:', error);
    throw error;
  }
}

/**
 * Lógica para verificar la coincidencia de ubicación.
 */
function checkLocationMatch(ubicacionFicha, ubicacionHallazgo) {
  let score = 0;
  let criteria = [];

  // Puntos por coincidencia de estado
  if (ubicacionFicha.estado === ubicacionHallazgo.estado) {
    score += 50;
    criteria.push('Coincidencia de Estado');
  }

  // Puntos por coincidencia de municipio
  if (ubicacionFicha.municipio === ubicacionHallazgo.municipio) {
    score += 100;
    criteria.push('Coincidencia de Municipio');
  }

  // Puntos por proximidad geográfica (usando la fórmula de la distancia)
  const distance = calculateDistance(
    ubicacionFicha.latitud, ubicacionFicha.longitud,
    ubicacionHallazgo.latitud, ubicacionHallazgo.longitud
  );

  if (distance <= 10) { // 10 km de radio
    score += 200;
    criteria.push('Proximidad Geográfica (< 10km)');
  } else if (distance <= 50) { // 50 km de radio
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
      rh.tipo_caracteristica === rasgoFicha.tipo_rasgo
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
async function notifyMatchedUsers(matches, nombreVictima) {
  const db = await openDb();
  // Usar un Set para evitar enviar múltiples correos al mismo usuario
  const notifiedUsers = new Set();
  
  for (const match of matches) {
    if (!notifiedUsers.has(match.id_usuario_reporte)) {
      const user = await db.get('SELECT email, nombre FROM usuarios WHERE id_usuario = ?', [match.id_usuario_reporte]);
      if (user) {
        const subject = `🚨 ¡Posible coincidencia encontrada para tu reporte!`;
        const message = `Hemos encontrado una posible coincidencia con una ficha de desaparición para el hallazgo que reportaste. El nombre de la persona desaparecida es ${nombreVictima}. Por favor, revisa tu cuenta para más detalles.`;
        await sendMatchNotification(user.email, subject, message);
        notifiedUsers.add(match.id_usuario_reporte);
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