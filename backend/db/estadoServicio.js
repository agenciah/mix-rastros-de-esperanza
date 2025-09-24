import { query } from './users/initDb.js'

export async function crearEstadoServicioInicial(userId, trialEndDate, proximoPago, facturasRestantes, servicioActivo, cancelacionProgramada = null) {
  try {
    const db = await openDb();
    await db.run(
      `INSERT INTO estado_servicio (
        user_id,
        trial_end_date,
        proximo_pago,
        facturas_restantes,
        servicio_activo,
        cancelacion_programada
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, trialEndDate, proximoPago, facturasRestantes, servicioActivo, cancelacionProgramada]
    );
    console.log('✅ Estado de servicio creado para user_id:', userId);
  } catch (error) {
    console.error('❌ Error insertando estado de servicio:', error);
    throw error; // para que el controlador capture el error
  }
}

export async function obtenerEstadoServicioPorUserId(userId) {
  const db = await openDb()
  const result = await db.get(`SELECT * FROM estado_servicio WHERE user_id = ?`, [userId])
  return result
}

export async function actualizarFacturasRestantes(userId, nuevasRestantes) {
  const db = await openDb()
  await db.run(
    `UPDATE estado_servicio SET facturas_restantes = ? WHERE user_id = ?`,
    [nuevasRestantes, userId]
  )
}

export async function marcarCancelacionProgramada(userId, fechaCancelacion) {
  const db = await openDb()
  await db.run(
    `UPDATE estado_servicio SET cancelacion_programada = ? WHERE user_id = ?`,
    [fechaCancelacion, userId]
  )
}

export async function cambiarEstadoServicio(userId, activo) {
  const db = await openDb()
  await db.run(
    `UPDATE estado_servicio SET servicio_activo = ? WHERE user_id = ?`,
    [activo ? 1 : 0, userId]
  )
}

export async function actualizarProximoPago(userId, nuevaFecha) {
  const db = await openDb()
  await db.run(
    `UPDATE estado_servicio SET proximo_pago = ? WHERE user_id = ?`,
    [nuevaFecha, userId]
  )
}

export async function obtenerUsuariosConCancelacionVencida(hoy) {
  const db = await openDb()
  const rows = await db.all(`
    SELECT user_id FROM estado_servicio 
    WHERE cancelacion_programada IS NOT NULL 
    AND cancelacion_programada <= ? 
    AND servicio_activo = 1
  `, [hoy])
  return rows
}

export async function marcarUsuarioComoEliminado(userId) {
  const db = await openDb()
  await db.run(
    `UPDATE users SET eliminado = 1 WHERE id = ?`,
    [userId]
  )
  await db.run(
    `UPDATE estado_servicio SET servicio_activo = 0 WHERE user_id = ?`,
    [userId]
  )
}

export async function programarFechaFinEnEstadoServicio(userId, fechaFin) {
  const db = await openDb();
  await db.run(
    `UPDATE estado_servicio SET fecha_fin = ? WHERE user_id = ?`,
    [fechaFin.toISOString(), userId]
  );
}

