import {
  getTotalUsuarios,
  getTotalFichas,
  getTotalHallazgos,
  getTotalIngresosConfirmados,
  getTotalIngresosPendientes,
  getIngresosConfirmadosPorMes,
  getIngresosPendientesPorMes,
  getUsuariosPorPlan,
  getTotalCoincidencias,
  getTotalCancelaciones
} from '../../db/admin/estadisticas.js';

/**
 * Controlador para obtener todas las estadísticas del dashboard de admin.
 */
export async function obtenerEstadisticas(req, res) {
  try {
    const totalUsuarios = await getTotalUsuarios();
    const totalFichas = await getTotalFichas();
    const totalHallazgos = await getTotalHallazgos();
    const ingresosConfirmados = await getTotalIngresosConfirmados();
    const ingresosPendientes = await getTotalIngresosPendientes();
    const ingresosConfirmadosPorMes = await getIngresosConfirmadosPorMes();
    const ingresosPendientesPorMes = await getIngresosPendientesPorMes();
    const usuariosPorPlan = await getUsuariosPorPlan();
    const totalCoincidencias = await getTotalCoincidencias();
    const totalCancelaciones = await getTotalCancelaciones();

    // Devuelve un objeto JSON con todas las métricas
    res.json({
      totalUsuarios,
      totalFichas,
      totalHallazgos,
      ingresos: {
        confirmados: ingresosConfirmados,
        pendientes: ingresosPendientes,
        confirmadosPorMes: ingresosConfirmadosPorMes,
        pendientesPorMes: ingresosPendientesPorMes,
      },
      usuariosPorPlan,
      totalCoincidencias,
      totalCancelaciones
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
