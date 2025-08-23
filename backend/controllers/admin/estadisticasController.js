import {
  getTotalIngresos,
  getIngresosPorMes,
  getNuevosUsuariosPorMes,
  getUsuariosPorPlan,
  getCancelacionesPorMes,
  getTotalCancelaciones,
  getTotalIngresosSuscripciones // Importamos la nueva función
} from '../../db/admin/estadisticas.js';

/**
 * Obtiene todos los datos estadísticos para el componente de Estadísticas.
 */
export async function obtenerEstadisticas(req, res) {
  try {
    const [
      totalIngresos,
      ingresosPorMes,
      nuevosUsuariosPorMes,
      usuariosPorPlan,
      cancelacionesPorMes,
      totalCancelaciones,
      totalIngresosSuscripciones // Agregamos la nueva función al Promise.all
    ] = await Promise.all([
      getTotalIngresos(),
      getIngresosPorMes(),
      getNuevosUsuariosPorMes(),
      getUsuariosPorPlan(),
      getCancelacionesPorMes(),
      getTotalCancelaciones(),
      getTotalIngresosSuscripciones() // La llamamos aquí
    ]);

    res.json({
      totalIngresos,
      ingresosPorMes,
      nuevosUsuariosPorMes,
      usuariosPorPlan,
      cancelacionesPorMes,
      totalCancelaciones,
      totalIngresosSuscripciones // La enviamos en la respuesta
    });
  } catch (error) {
    console.error('❌ Error al obtener las estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
}