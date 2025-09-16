// RUTA: backend/controllers/hallazgos/catalogosController.js

import * as hallazgosDB from '../../db/queries/hallazgosQueries.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todos los catálogos necesarios para los formularios de hallazgos.
 */
export const getAllCatalogos = async (req, res) => {
    try {
        const catalogos = await hallazgosDB.getAllHallazgosCatalogos();
        res.json({ success: true, data: catalogos });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los catálogos.' });
    }
};