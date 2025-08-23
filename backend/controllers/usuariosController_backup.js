import bcrypt from 'bcrypt'
import { findUserById } from '../db/users.js'
import { updateUserPassword } from '../db/users.js';
import { getFiscalesServicioByUserId } from '../db/users.js';
import { updateFiscalesServicioByUserId } from '../db/users.js';
import { getFiscalesByUserId } from '../db/users.js';
import { updateFiscalesByUserId } from '../db/users.js';
import { enviarCorreoCambioPassword } from '../utils/emailService.js'
import { updateUserProfile, findUserByEmail } from '../db/users.js';

export async function cambiarPassword(req, res) {
  try {
    const userId = req.user.id;
    const { actual, nueva } = req.body;

    if (!actual || !nueva) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const usuario = await findUserById(userId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const coincide = await bcrypt.compare(actual, usuario.password);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    const nuevaHash = await bcrypt.hash(nueva, 10);
    await updateUserPassword(userId, nuevaHash);
    await enviarCorreoCambioPassword(usuario.email, usuario.nombre);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

// GET /api/usuarios/fiscales-servicio
export const obtenerDatosFiscalesServicio = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getFiscalesServicioByUserId(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      razon_social_servicio: user.razon_social_servicio || '',
      rfc_servicio: user.rfc_servicio || '',
      cp_fiscal_servicio: user.cp_fiscal_servicio || '',
      uso_cfdi_servicio: user.uso_cfdi_servicio || '',
      email_fiscal_servicio: user.email_fiscal_servicio || '',
    });
  } catch (error) {
    console.error('Error al obtener datos fiscales del servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PUT /api/usuarios/fiscales-servicio
export const actualizarDatosFiscalesServicio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { razon_social, rfc, cp, uso_cfdi, email } = req.body;

    console.log("🔧 Datos recibidos para guardar servicio:", req.body)

    await updateFiscalesServicioByUserId(userId, {
      razon_social, rfc, cp, uso_cfdi, email
    });

    res.json({ mensaje: 'Datos fiscales del servicio actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar datos fiscales del servicio:', error);
    res.status(500).json({ error: 'Error al actualizar datos fiscales del servicio' });
  }
};

// GET /api/usuarios/fiscales
export const obtenerDatosFiscales = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getFiscalesByUserId(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      razon_social: user.razon_social || '',
      rfc: user.rfc || '',
      uso_cfdi: user.uso_cfdi || '',
      cp_fiscal: user.cp_fiscal || '',
      email_fiscal: user.email_fiscal || '',
    });
  } catch (error) {
    console.error('Error al obtener datos fiscales:', error);
    res.status(500).json({ error: 'Error al obtener datos fiscales' });
  }
};

// PUT /api/usuarios/fiscales
export const actualizarDatosFiscales = async (req, res) => {
  try {
    const userId = req.user.id;
    const { razon_social, rfc, uso_cfdi, cp_fiscal, email_fiscal } = req.body;

    await updateFiscalesByUserId(userId, {
      razon_social,
      rfc,
      uso_cfdi,
      cp_fiscal,
      email_fiscal,
    });

    res.json({ mensaje: 'Datos fiscales actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar datos fiscales:', error);
    res.status(500).json({ error: 'Error al actualizar datos fiscales' });
  }
};
// en controllers/usuariosController.js
export const obtenerPlanes = (req, res) => {
  res.json({ planes: ['básico', 'factura_25', 'factura_50', 'chatbot'] });
};
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo permitir que el usuario acceda a su propio perfil
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const user = await findUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let plan = [];
    try {
      plan = user.plan ? JSON.parse(user.plan) : [];
    } catch (e) {
      console.warn("⚠️ Error al parsear plan:", user.plan);
    }

    res.json({
      id: user.id,
      nombre: user.nombre,
      correo: user.email,
      plan,  // <-- singular y correcto
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

// controllers/usuariosController.js
export const actualizarPlanes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nuevosPlanes } = req.body;

    if (!Array.isArray(nuevosPlanes)) {
      return res.status(400).json({ error: 'Formato inválido de planes' });
    }

    const db = await openDb();
    await db.run(`UPDATE users SET plan = ? WHERE id = ?`, [
      JSON.stringify(nuevosPlanes),
      userId,
    ]);

    res.json({ mensaje: 'Planes actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar planes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarPerfil = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, email, telefono } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ mensaje: 'Nombre y correo son requeridos' });
    }

    // Validar si el nuevo correo ya está en uso por otro usuario
    const existente = await findUserByEmail(email);
    if (existente && existente.id !== userId) {
      return res.status(400).json({ mensaje: 'Ese correo ya está en uso' });
    }

    await updateUserProfile(userId, { nombre, email, telefono });

    res.json({
      mensaje: 'Perfil actualizado',
      usuario: { nombre, email, telefono }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};