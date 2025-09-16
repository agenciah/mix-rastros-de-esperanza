// RUTA: backend/controllers/catalogosController.js

import { openDb } from '../db/users/initDb.js';
import logger from '../utils/logger.js';

// Esta función obtiene TODOS los catálogos a la vez.
export const getAllCatalogos = async (req, res) => {
    try {
        const db = await openDb();
        const [tiposLugar, partesCuerpoRaw, prendas] = await Promise.all([
            db.all(`SELECT * FROM catalogo_tipo_lugar`),
            db.all(`SELECT * FROM catalogo_partes_cuerpo`),
            db.all(`SELECT * FROM catalogo_prendas`)
        ]);

        // Normalizamos los nombres para que el frontend no tenga que adivinar
        const partesCuerpo = partesCuerpoRaw.map(p => ({
            id: p.id_parte_cuerpo,
            nombre: p.nombre_parte,
            categoria: p.categoria_principal
        }));

        res.json({ success: true, data: { tiposLugar, partesCuerpo, prendas } });
    } catch (error) {
        logger.error(`❌ Error al obtener todos los catálogos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};