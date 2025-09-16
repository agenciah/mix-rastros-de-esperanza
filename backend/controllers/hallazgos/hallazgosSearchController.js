// RUTA: backend/controllers/hallazgos/hallazgosSearchController.js

import * as hallazgosDB from '../../db/queries/hallazgosQueries.js';
import logger from '../../utils/logger.js';

/**
 * Maneja la búsqueda avanzada de hallazgos.
 */
export const searchHallazgos = async (req, res) => {
    try {
        // req.query ya contiene todos los parámetros (nombre, estado, etc.)
        const hallazgos = await hallazgosDB.searchHallazgos(req.query);
        res.json({ success: true, data: hallazgos });
    } catch (error) {
        logger.error(`❌ Error en búsqueda avanzada de hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda.' });
    }
};

/**
 * Maneja la búsqueda por palabra clave para el feed público.
 */
export const searchHallazgosFeed = async (req, res) => {
    try {
        const { searchTerm = '', limit = 10, offset = 0 } = req.query;
        const hallazgos = await hallazgosDB.searchHallazgosByKeyword(searchTerm, parseInt(limit), parseInt(offset));
        res.json({ success: true, data: hallazgos });
    } catch (error) {
        logger.error(`❌ Error al buscar hallazgos para el feed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda.' });
    }
};