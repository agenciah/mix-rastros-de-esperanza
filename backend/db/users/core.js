// RUTA: backend/db/users/core.js

/**
 * @fileoverview Funciones principales para la gestión de usuarios en la base de datos,
 * actualizado para rastros-de-esperanza y PostgreSQL.
 */

import { query } from './initDb.js';
import logger from '../../utils/logger.js';

/**
 * Crear un nuevo usuario (Versión PostgreSQL)
 */
export async function createUser({
    nombre, telefono, email, passwordHash, plan = ['trial'],
    confirmationToken, role = 'user', razon_social_servicio = null,
    rfc_servicio = null, cp_fiscal_servicio = null, uso_cfdi_servicio = null,
    email_fiscal_servicio = null, acepto_terminos = false, fecha_aceptacion = null,
    version_terminos = null, estado_republica = null, ultima_conexion = null,
    numero_referencia_unico = null, fichas_activas_pagadas = 0,
    estado_suscripcion = 'inactivo',
}) {
    const trialStartDate = new Date();
    const initialState = JSON.stringify({ flow: null, step: null, data: {} });
    if (!Array.isArray(plan)) plan = [plan];

    logger.info("🛠️ Datos completos recibidos para createUser:", { /* ... tus datos ... */ });

    try {
        // ✅ INICIO DE LA CORRECCIÓN
        const res = await query(
            `INSERT INTO users (
                nombre, telefono, email, password, plan, trial_start_date,
                confirmation_token, role,
                razon_social_servicio, rfc_servicio, cp_fiscal_servicio,
                uso_cfdi_servicio, email_fiscal_servicio,

                estado_cuenta, fecha_desactivacion,

                acepto_terminos, fecha_aceptacion, version_terminos,
                user_state,
                estado_republica, ultima_conexion, numero_referencia_unico,
                fichas_activas_pagadas, estado_suscripcion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            RETURNING id`,
            [
                nombre, telefono, email, passwordHash,
                JSON.stringify(plan),
                trialStartDate,
                confirmationToken, role,
                razon_social_servicio, rfc_servicio, cp_fiscal_servicio,
                uso_cfdi_servicio, email_fiscal_servicio,

                'activo', null, // <-- Valores por defecto para las nuevas columnas

                acepto_terminos, fecha_aceptacion, version_terminos,
                initialState,
                estado_republica, ultima_conexion, numero_referencia_unico,
                fichas_activas_pagadas, estado_suscripcion
            ]
        );
        // ✅ FIN DE LA CORRECCIÓN

        const userId = res.rows[0].id;
        if (!userId) {
            logger.error('❌ No se pudo insertar el usuario en la base de datos.');
            throw new Error('No se pudo crear el usuario.');
        }

        logger.info(`✅ Usuario insertado correctamente con ID: ${userId}`);
        return userId;
    } catch (error) {
        logger.error(`❌ Error al crear usuario: ${error.message}`);
        throw error;
    }
}

/**
 * Buscar usuario por email.
 * ✅ VERSIÓN FINAL: Ahora solo busca usuarios con 'estado_cuenta' activo.
 */
export async function findUserByEmail(email) {
    // Añadimos la condición "AND estado_cuenta = 'activo'" para el login
    const res = await query(`
        SELECT * FROM users
        WHERE email = $1 AND estado_cuenta = 'activo'
    `, [email]);

    const user = res.rows[0];

    // El resto de la lógica para parsear los datos JSON se mantiene igual
    if (user && user.plan) {
        try {
            user.plan = JSON.parse(user.plan);
        } catch (e) {
            logger.warn(`⚠️ Error al parsear plan para usuario ${user.email}: ${e.message}`);
            user.plan = [user.plan];
        }
    }

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
 * Buscar usuario por teléfono (Versión PostgreSQL)
 */
export async function findUserByPhone(phone) {
    const res = await query('SELECT * FROM users WHERE telefono = $1', [phone]); // ✅ Corregido
    const user = res.rows[0];

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
 * Buscar usuario por ID (Versión PostgreSQL)
 */
export async function findUserById(id) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]); // ✅ Corregido
    const user = res.rows[0];

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
 * Actualizar perfil básico (Versión PostgreSQL)
 */
export async function updateUserProfile(userId, { nombre, email, telefono, estado_republica }) {
    await query( // ✅ Corregido
        `UPDATE users SET nombre = $1, email = $2, telefono = $3, estado_republica = $4 WHERE id = $5`,
        [nombre, email, telefono || null, estado_republica || null, userId]
    );
}

/**
 * Actualizar estado de conversación (Versión PostgreSQL)
 */
export async function updateUserState(phone, state) {
    const stateString = JSON.stringify(state);
    await query('UPDATE users SET user_state = $1 WHERE telefono = $2', [stateString, phone]); // ✅ Corregido
}

/**
 * Actualizar token de confirmación (Versión PostgreSQL)
 */
export async function updateUserConfirmationToken(email, token) {
    await query('UPDATE users SET confirmation_token = $1 WHERE email = $2', [token, email]); // ✅ Corregido
}

/**
 * Cambiar rol (Versión PostgreSQL)
 */
export async function updateUserRole(email, newRole) {
    await query('UPDATE users SET role = $1 WHERE email = $2', [newRole, email]); // ✅ Corregido
}

/**
 * Cambiar contraseña (Versión PostgreSQL)
 */
export async function updateUserPassword(id, nuevaHash) {
    await query('UPDATE users SET password = $1 WHERE id = $2', [nuevaHash, id]); // ✅ Corregido
}

/**
 * Actualizar suscripción (Versión PostgreSQL)
 */
export async function updateUserSubscription(userId, { estado_suscripcion, fichas_activas_pagadas }) {
    await query( // ✅ Corregido
        `UPDATE users SET estado_suscripcion = $1, fichas_activas_pagadas = $2 WHERE id = $3`,
        [estado_suscripcion, fichas_activas_pagadas, userId]
    );
}

/**
 * Actualizar ubicación (Versión PostgreSQL)
 */
export async function updateUserLocation(userId, estado_republica) {
    await query( // ✅ Corregido
        `UPDATE users SET estado_republica = $1 WHERE id = $2`,
        [estado_republica, userId]
    );
}

/**
 * Actualizar última conexión (Versión PostgreSQL)
 */
export async function updateUserUltimaConexion(userId, ultima_conexion) {
    await query( // ✅ Corregido
        `UPDATE users SET ultima_conexion = $1 WHERE id = $2`,
        [ultima_conexion, userId]
    );
}

/**
 * Actualizar número de referencia (Versión PostgreSQL)
 */
export async function updateUserNumeroReferencia(userId, numero_referencia_unico) {
    await query( // ✅ Corregido
        `UPDATE users SET numero_referencia_unico = $1 WHERE id = $2`,
        [numero_referencia_unico, userId]
    );
}