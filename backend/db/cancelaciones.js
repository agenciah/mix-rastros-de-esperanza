import { openDb } from './users/initDb.js';
import { format } from 'date-fns';

// Registra la solicitud de cancelación, pero no corta el servicio
export async function registrarCancelacion(userId, motivo) {
  const db = await openDb();
  const fechaSolicitud = format(new Date(), 'yyyy-MM-dd');

  // 1. Guardar solicitud
  await db.run(
    `INSERT INTO cancelaciones (user_id, motivo, fecha_solicitud) VALUES (?, ?, ?)`,
    [userId, motivo, fechaSolicitud]
  );

  // 2. (opcional) marcar que hay una cancelación programada
  // Obtenemos la fecha_fin para saber cuándo vence el servicio
  const estado = await db.get(
    `SELECT fecha_fin FROM estado_servicio WHERE user_id = ?`,
    [userId]
  );

  if (estado?.fecha_fin) {
    await db.run(
      `UPDATE estado_servicio SET cancelacion_programada = ? WHERE user_id = ?`,
      [estado.fecha_fin, userId]
    );
  }

  // NOTA: no se toca la tabla users
}

// Obtiene datos del usuario y su servicio activo
export async function obtenerUsuarioPorId(userId) {
  const db = await openDb();

  const user = await db.get(
    `SELECT 
      u.id,
      u.nombre,
      u.email,
      u.plan,
      u.trial_start_date,
      u.facturacion_tickets,
      es.fecha_inicio,
      es.fecha_fin
    FROM users u
    LEFT JOIN estado_servicio es ON u.id = es.user_id
    WHERE u.id = ?`,
    [userId]
  );

  return user;
}

// Marca al usuario como cancelado y registra la fecha efectiva
export async function marcarUsuarioComoCancelado(userId, fechaFin) {
  const db = await openDb();

  await db.run(
    `UPDATE users
     SET cancelado = 1,
         cancelacion_efectiva = ?
     WHERE id = ?`,
    [fechaFin, userId]
  );
}

export async function revertirCancelacion(userId) {
  const db = await openDb();

  const result1 = await db.run(
    `UPDATE users SET cancelado = 0, cancelacion_efectiva = NULL WHERE id = ?`,
    [userId]
  );

  const result2 = await db.run(
    `UPDATE estado_servicio SET cancelacion_programada = NULL WHERE user_id = ?`,
    [userId]
  );

  return result1.changes > 0 || result2.changes > 0;
}

export async function obtenerCancelacionActiva(userId) {
  const db = await openDb();
  return db.get(`
    SELECT * FROM cancelaciones
    WHERE user_id = ? AND estado = 'pendiente'
    ORDER BY fecha_solicitud DESC
    LIMIT 1
  `, [userId]);
}
