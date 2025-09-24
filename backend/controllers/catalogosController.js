// RUTA: backend/controllers/catalogosController.js

import { query } from '../db/users/initDb.js';
import logger from '../utils/logger.js';

/**
 * Obtiene TODOS los catálogos a la vez, adaptado para PostgreSQL.
 */
export const getAllCatalogos = async (req, res) => {
    try {
         // Obtiene el pool de PostgreSQL
        
        // Las consultas se ejecutan en paralelo, como en tu versión original
        const [tiposLugarResult, partesCuerpoResult, prendasResult] = await Promise.all([
            db.query(`SELECT * FROM catalogo_tipo_lugar ORDER BY nombre_tipo`),
            db.query(`SELECT * FROM catalogo_partes_cuerpo ORDER BY nombre_parte`),
            db.query(`SELECT * FROM catalogo_prendas ORDER BY tipo_prenda`)
        ]);

        // Los resultados ahora están en la propiedad 'rows'
        const tiposLugar = tiposLugarResult.rows;
        const partesCuerpoRaw = partesCuerpoResult.rows;
        const prendas = prendasResult.rows;

        // La lógica de normalización se mantiene, solo cambia la fuente de los datos
        const partesCuerpo = partesCuerpoRaw.map(p => ({
            id: p.id_parte_cuerpo,
            nombre: p.nombre_parte,
            categoria: p.categoria_principal
        }));

        res.json({ success: true, data: { tiposLugar, partesCuerpo, prendas } });
    } catch (error) {
        logger.error(`❌ Error al obtener todos los catálogos (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
