// RUTA: backend/controllers/admin/adminMessagesController.js

import {
    createAdminMessage,
    getAllAdminMessages,
    updateAdminMessage,
    updateAdminMessageStatus
} from '../../db/admin/adminQueriesMessages.js';
import logger from '../../utils/logger.js';

// -- Esta función se queda igual --
export const postAdminMessage = async (req, res) => {
    const { titulo, contenido, tipo_mensaje = 'info' } = req.body;
    const id_admin = req.user?.id || 1; 

    if (!titulo || !contenido) {
        return res.status(400).json({ success: false, message: 'El título y el contenido son obligatorios.' });
    }

    try {
        const result = await createAdminMessage({ titulo, contenido, tipo_mensaje, id_admin });
        res.status(201).json({ success: true, message: 'Mensaje publicado con éxito.', data: result });
    } catch (error) {
        logger.error(`❌ Error en el controlador postAdminMessage: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al publicar el mensaje.' });
    }
};

// --- ESTA ES LA FUNCIÓN CORREGIDA ---
export const getMessagesForAdmin = async (req, res) => {
    try {
        // La línea que faltaba: llamamos a la función que busca en la BD.
        const messages = await getAllAdminMessages();
        res.json({ success: true, data: messages });
    } catch (error) {
        // Ahora, si hay un error en la BD, lo capturaremos aquí
        logger.error(`❌ Error en el controlador getMessagesForAdmin: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los mensajes.' });
    }
};

// -- El resto de las funciones se quedan igual --
export const editAdminMessage = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido } = req.body;

    if (!titulo || !contenido) {
        return res.status(400).json({ success: false, message: 'El título y el contenido son obligatorios.' });
    }

    try {
        await updateAdminMessage(id, { titulo, contenido });
        res.json({ success: true, message: 'Mensaje actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el mensaje.' });
    }
};

export const setAdminMessageStatus = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !['activo', 'archivado'].includes(estado)) {
        return res.status(400).json({ success: false, message: "El estado debe ser 'activo' o 'archivado'." });
    }

    try {
        await updateAdminMessageStatus(id, estado);
        res.json({ success: true, message: `Mensaje marcado como ${estado}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cambiar el estado del mensaje.' });
    }
};