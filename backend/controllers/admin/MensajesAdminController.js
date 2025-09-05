import db from '../db/database.js';

const getAdminMessages = async (req, res) => {
  try {
    const messages = await db.all("SELECT * FROM mensajes_administrador ORDER BY fecha_creacion DESC");
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error al obtener los mensajes de administrador:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

const createAdminMessage = async (req, res) => {
  const { titulo, tipo_mensaje, contenido } = req.body;
  // TODO: En un sistema de auth completo, el id_admin se obtendría del token de autenticación
  const id_admin = 1; 

  if (!titulo || !contenido) {
    return res.status(400).json({ success: false, message: "Título y contenido son obligatorios." });
  }

  try {
    const result = await db.run(
      "INSERT INTO mensajes_administrador (id_admin, titulo, tipo_mensaje, contenido) VALUES (?, ?, ?, ?)",
      [id_admin, titulo, tipo_mensaje, contenido]
    );
    res.status(201).json({ success: true, message: "Mensaje creado con éxito.", id: result.lastID });
  } catch (error) {
    console.error("Error al crear el mensaje de administrador:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

export { getAdminMessages, createAdminMessage };

