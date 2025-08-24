// 📁 backend/db/users/core.js
/**
 * @fileoverview Funciones principales para la gestión de usuarios en la base de datos,
 * actualizado para rastros-de-esperanza.
 */

import { openDb } from './initDb.js';
import logger from '../../utils/logger.js';

/**
 * Crear un nuevo usuario
 */
export async function createUser({
  nombre,
  telefono,
  email,
  passwordHash,
  plan = ['trial'],
  confirmationToken,
  role = 'user',
  razon_social_servicio = null,
  rfc_servicio = null,
  cp_fiscal_servicio = null,
  uso_cfdi_servicio = null,
  email_fiscal_servicio = null,
  acepto_terminos = false,
  fecha_aceptacion = null,
  version_terminos = null,
  // CAMPOS NUEVOS
  estado_republica = null,
  ultima_conexion = null,
  numero_referencia_unico = null,
  fichas_activas_pagadas = 0,
  estado_suscripcion = 'inactivo',
}) {
  const db = await openDb();
  const trialStartDate = new Date().toISOString().split('T')[0];
  const initialState = JSON.stringify({ flow: null, step: null, data: {} });

  if (!Array.isArray(plan)) plan = [plan];

  logger.info("🛠️ Datos completos recibidos para createUser:", {
    nombre, telefono, email, plan, confirmationToken, role,
    razon_social_servicio, rfc_servicio, cp_fiscal_servicio, uso_cfdi_servicio, email_fiscal_servicio,
    acepto_terminos, fecha_aceptacion, version_terminos,
    estado_republica, ultima_conexion, numero_referencia_unico, fichas_activas_pagadas, estado_suscripcion
  });

  try {
    const result = await db.run(
      `INSERT INTO users (
        nombre, telefono, email, password, plan, trial_start_date,
        confirmation_token, role,
        razon_social_servicio, rfc_servicio, cp_fiscal_servicio,
        uso_cfdi_servicio, email_fiscal_servicio,
        cancelado, cancelacion_efectiva,
        acepto_terminos, fecha_aceptacion, version_terminos,
        user_state,
        estado_republica, ultima_conexion, numero_referencia_unico,
        fichas_activas_pagadas, estado_suscripcion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, telefono, email, passwordHash,
        JSON.stringify(plan),
        trialStartDate,
        confirmationToken, role,
        razon_social_servicio, rfc_servicio, cp_fiscal_servicio,
        uso_cfdi_servicio, email_fiscal_servicio,
        0, null,
        acepto_terminos, fecha_aceptacion, version_terminos,
        initialState,
        estado_republica, ultima_conexion, numero_referencia_unico,
        fichas_activas_pagadas, estado_suscripcion
      ]
    );

    if (!result?.lastID) {
      logger.error('❌ No se pudo insertar el usuario en la base de datos.');
      throw new Error('No se pudo crear el usuario.');
    }

    logger.info(`✅ Usuario insertado correctamente con ID: ${result.lastID}`);
    return result.lastID;
  } catch (error) {
    logger.error(`❌ Error al crear usuario: ${error.message}`);
    throw error;
  }
}

/**
 * Buscar usuario por email
 */
export async function findUserByEmail(email) {
  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

  if (user && user.plan) {
    try {
      user.plan = JSON.parse(user.plan);
    } catch (e) {
      logger.warn(`⚠️ Error al parsear plan para usuario ${user.email}: ${e.message}`);
      user.plan = [user.plan];
    }
  }

  // Parsear estado del bot
  if (user && user.user_state) {
    try {
      user.user_state = JSON.parse(user.user_state);
    } catch (e) {
      logger.error('❌ Error al parsear user_state:', email, e);
      user.user_state = {};
    }
  }

  return user;
}

/**
 * Buscar usuario por teléfono
 */
export async function findUserByPhone(phone) {
  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE telefono = ?', [phone]);

  if (user && user.plan) {
    try {
      user.plan = JSON.parse(user.plan);
    } catch (e) {
      logger.warn(`⚠️ Error al parsear plan para usuario ${user.telefono}: ${e.message}`);
      user.plan = [user.plan];
    }
  }

  if (user && user.user_state) {
    try {
      user.user_state = JSON.parse(user.user_state);
    } catch (e) {
      logger.error('❌ Error al parsear user_state:', phone, e);
      user.user_state = {};
    }
  }

  return user;
}

/**
 * Buscar usuario por ID
 */
export async function findUserById(id) {
  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);

  if (user) {
    if (user.plan) {
      try {
        user.plan = JSON.parse(user.plan);
      } catch {
        user.plan = Array.isArray(user.plan) ? user.plan : [user.plan];
      }
    } else {
      user.plan = [];
    }

    // Parsear estado del bot
    if (user.user_state) {
      try {
        user.user_state = JSON.parse(user.user_state);
      } catch {
        user.user_state = {};
      }
    }
    logger.info('📦 Usuario encontrado y parseado:', user);
  }

  return user;
}

/**
 * Actualizar perfil básico
 */
export async function updateUserProfile(userId, { nombre, email, telefono, estado_republica }) {
  const db = await openDb();
  await db.run(
    `UPDATE users SET nombre = ?, email = ?, telefono = ?, estado_republica = ? WHERE id = ?`,
    [nombre, email, telefono || null, estado_republica || null, userId]
  );
}

/**
 * Actualizar estado de conversación
 */
export async function updateUserState(phone, state) {
  const db = await openDb();
  const stateString = JSON.stringify(state);
  await db.run('UPDATE users SET user_state = ? WHERE telefono = ?', [stateString, phone]);
}

/**
 * Actualizar token de confirmación
 */
export async function updateUserConfirmationToken(email, token) {
  const db = await openDb();
  await db.run('UPDATE users SET confirmation_token = ? WHERE email = ?', [token, email]);
}

/**
 * Cambiar rol
 */
export async function updateUserRole(email, newRole) {
  const db = await openDb();
  await db.run('UPDATE users SET role = ? WHERE email = ?', [newRole, email]);
}

/**
 * Cambiar contraseña
 */
export async function updateUserPassword(id, nuevaHash) {
  const db = await openDb();
  await db.run('UPDATE users SET password = ? WHERE id = ?', [nuevaHash, id]);
}

/**
 * FUNCIONES NUEVAS: Actualizar campos de rastros-de-esperanza
 */
export async function updateUserSubscription(userId, { estado_suscripcion, fichas_activas_pagadas }) {
  const db = await openDb();
  await db.run(
    `UPDATE users SET estado_suscripcion = ?, fichas_activas_pagadas = ? WHERE id = ?`,
    [estado_suscripcion, fichas_activas_pagadas, userId]
  );
}

export async function updateUserLocation(userId, estado_republica) {
  const db = await openDb();
  await db.run(
    `UPDATE users SET estado_republica = ? WHERE id = ?`,
    [estado_republica, userId]
  );
}

export async function updateUserUltimaConexion(userId, ultima_conexion) {
  const db = await openDb();
  await db.run(
    `UPDATE users SET ultima_conexion = ? WHERE id = ?`,
    [ultima_conexion, userId]
  );
}

export async function updateUserNumeroReferencia(userId, numero_referencia_unico) {
  const db = await openDb();
  await db.run(
    `UPDATE users SET numero_referencia_unico = ? WHERE id = ?`,
    [numero_referencia_unico, userId]
  );
}
