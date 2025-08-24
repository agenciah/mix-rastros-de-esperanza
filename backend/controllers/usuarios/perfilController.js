import { findUserByEmail, findUserById, updateUserProfile } from '../../db/users/core.js';
import { openDb } from '../../db/users/initDb.js';
import { plans } from '../../shared/planes.js';
import { enviarNotificacion } from '../../utils/notificacionesEmail.js';

export const obtenerPlanes = (req, res) => {
  res.json({ planes: plans });
};

export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const plan = Array.isArray(user.plan) ? user.plan : [];

    res.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      plan,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

export const actualizarPlanes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planes } = req.body;

    if (!Array.isArray(planes)) {
      return res.status(400).json({ error: 'Formato inválido. Se esperaba un array en la propiedad "planes".' });
    }

    const db = await openDb();
    await db.run(`UPDATE users SET plan = ? WHERE id = ?`, [
      JSON.stringify(planes),
      userId,
    ]);

    // Llama a la función con 3 argumentos separados
    await enviarNotificacion(
      'cambio_plan',
      req.user.email,
      {
        nombre: req.user.nombre, // Asegúrate de pasar el nombre del usuario
        nuevoPlan: planes.map(plan => plan.nombre).join(', ')
      }
    );

    res.json({ mensaje: 'Planes actualizados correctamente', planes });
  } catch (error) {
    console.error('Error al actualizar planes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarPerfil = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, email, telefono, estado_republica } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ mensaje: 'Nombre y correo son requeridos' });
    }

    const existente = await findUserByEmail(email);
    if (existente && existente.id !== userId) {
      return res.status(400).json({ mensaje: 'Ese correo ya está en uso' });
    }

    await updateUserProfile(userId, { nombre, email, telefono, estado_republica });

    // Llama a la función con 3 argumentos separados
    await enviarNotificacion(
      'cambio_datos_personales',
      email,
      { nombre }
    );

    res.json({
      mensaje: 'Perfil actualizado',
      usuario: { nombre, email, telefono },
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};
