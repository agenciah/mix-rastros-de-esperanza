// RUTA: backend/controllers/admin/messagesAdminController.js

import { query } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todos los mensajes del administrador (Versión PostgreSQL).
 */
export const getAdminMessages = async (req, res) => {
    try {
         // Obtiene el pool de PostgreSQL
        const result = await db.query("SELECT * FROM mensajes_administrador ORDER BY fecha_creacion DESC");
        
        // El resultado de la consulta ahora está en la propiedad 'rows'
        res.json({ success: true, data: result.rows });

    } catch (error) {
        logger.error(`❌ Error al obtener los mensajes de administrador (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};

/**
 * Crea un nuevo mensaje del administrador (Versión PostgreSQL).
 */
export const createAdminMessage = async (req, res) => {
    const { titulo, tipo_mensaje, contenido } = req.body;
    // En un sistema de auth completo, el id_admin se obtendría del token
    const id_admin = 1; 

    if (!titulo || !contenido) {
        return res.status(400).json({ success: false, message: "Título y contenido son obligatorios." });
    }

    try {
        
        const sql = `
            INSERT INTO mensajes_administrador (id_admin, titulo, tipo_mensaje, contenido) 
            VALUES ($1, $2, $3, $4)
            RETURNING id_mensaje; 
        `;
        
        // Usamos db.query y placeholders $1, $2, etc.
        const result = await db.query(sql, [id_admin, titulo, tipo_mensaje, contenido]);
        
        // Obtenemos el ID devuelto por la consulta con RETURNING
        const newId = result.rows[0].id_mensaje;
        
        res.status(201).json({ success: true, message: "Mensaje creado con éxito.", id: newId });

    } catch (error) {
        logger.error(`❌ Error al crear el mensaje de administrador (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};
