import { openDb } from "../users/initDb.js";

// AÑADE ESTA NUEVA FUNCIÓN A TUS QUERIES

/**
 * Encuentra usuarios cuyo servicio ha expirado.
 * @returns {Promise<Array<object>>} - Array de usuarios con servicio vencido.
 */
export const findUsersWithExpiredService = async () => {
    const db = await openDb();
    // Usamos la función date('now') de SQLite para obtener la fecha actual.
    const sql = `
        SELECT
            u.id,
            u.nombre,
            u.telefono,
            u.numero_referencia_unico,
            es.fecha_fin
        FROM users AS u
        JOIN estado_servicio AS es ON u.id = es.user_id
        WHERE es.fecha_fin < date('now');
    `;
    try {
        const users = await db.all(sql);
        return users;
    } catch (error) {
        logger.error(`❌ Error al encontrar usuarios con servicio expirado: ${error.message}`);
        throw error;
    }
};

/**
 * Registra un pago y actualiza la suscripción del usuario.
 * @param {number} userId - ID del usuario que pagó.
 * @param {number} monto - Monto del pago.
 * @returns {Promise<object>} - El resultado de la inserción.
 */
export const marcarPagoComoRecibido = async (userId, monto) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');
    try {
        // 1. Inserta el registro del pago para el historial
        const pagoResult = await db.run(
            `INSERT INTO pagos (id_ficha, monto, estado_pago, fecha_pago, metodo_pago) 
             VALUES (?, ?, 'completado', date('now'), 'manual')`,
            // NOTA: Asumimos un pago por usuario, por lo que id_ficha puede ser el id del usuario
            // o necesitaríamos buscar la ficha activa del usuario. Por simplicidad, usamos userId.
            [userId, monto] 
        );

        // 2. Actualiza la fecha de fin de servicio del usuario a un mes en el futuro
        await db.run(
            `UPDATE estado_servicio SET fecha_fin = date('now', '+1 month') WHERE user_id = ?`,
            [userId]
        );

        await db.exec('COMMIT');
        return { success: true, pagoId: pagoResult.lastID };

    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al marcar pago para usuario ${userId}: ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene los pagos que han sido validados en las últimas 24 horas.
 * @returns {Promise<Array<object>>} - Lista de pagos recientes.
 */
export const getPagosRecientes = async () => {
    const db = await openDb();
    const sql = `
        SELECT p.id_pago, p.fecha_pago, p.monto, u.id as userId, u.nombre
        FROM pagos p
        JOIN users u ON p.id_ficha = u.id -- Ajustar si la relación es diferente
        WHERE p.metodo_pago = 'manual' AND p.fecha_pago >= date('now', '-1 day')
        ORDER BY p.fecha_pago DESC;
    `;
    try {
        return await db.all(sql);
    } catch (error) {
        logger.error(`❌ Error al obtener pagos recientes: ${error.message}`);
        throw error;
    }
};

/**
 * Revierte un pago validado: elimina el registro y retrocede la suscripción.
 * @param {number} pagoId - ID del pago a revertir.
 * @returns {Promise<object>} - El resultado de la operación.
 */
export const revertirPagoValidado = async (pagoId) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');
    try {
        // Obtenemos el userId antes de borrar el pago
        const pago = await db.get('SELECT id_ficha FROM pagos WHERE id_pago = ?', [pagoId]);
        if (!pago) throw new Error('Pago no encontrado');
        const userId = pago.id_ficha;

        // 1. Elimina el registro del pago
        await db.run('DELETE FROM pagos WHERE id_pago = ?', [pagoId]);

        // 2. Retrocede la fecha de fin de servicio para que vuelva a aparecer como pendiente
        await db.run(
            `UPDATE estado_servicio SET fecha_fin = date('now', '-1 month') WHERE user_id = ?`,
            [userId]
        );
        
        await db.exec('COMMIT');
        return { success: true };

    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al revertir el pago ${pagoId}: ${error.message}`);
        throw error;
    }
};
