import { findUserByEmail, findUserById, updateUserProfile } from '../../db/users/core.js';
import { openDb } from '../../db/users/initDb.js';
import { plans } from '../../shared/planes.js';

import { sendHEUserDataChangedEmail, sendHEPlanChangedEmail } from '../../utils/hastaEncontrarteEmailService.js';
// (Crearemos sendHEPlanChangedEmail en el siguiente paso)


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

    
        // ✅ 2. LLAMAMOS A LA NUEVA FUNCIÓN DE CORREO
        // await sendHEPlanChangedEmail(
        //     req.user.email, 
        //     req.user.nombre, 
        //     planes.map(plan => plan.nombre).join(', ')
        // );
        // Nota: He comentado esta línea por ahora, ya que primero necesitamos crear la plantilla.


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
        
        await sendHEUserDataChangedEmail(email, nombre);

        res.json({
            mensaje: 'Perfil actualizado',
            usuario: { nombre, email, telefono },
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
