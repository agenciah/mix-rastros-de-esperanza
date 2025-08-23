import {
  obtenerUsuariosPorPlan,
  obtenerTicketsFacturadosVsPendientes,
  obtenerFacturasServicioPendientes,
  obtenerNuevosUsuariosDesde,
  obtenerCancelacionesDesde,
} from '../../db/admin/dashboard.js';
import { getTotalIngresosSuscripciones } from '../../db/admin/estadisticas.js';

/**
 * Obtiene los datos clave para el dashboard de administración.
 * @returns {object} Objeto con todos los datos del dashboard.
 */
export const obtenerDashboardAdmin = async (req, res) => {
  try {
    const fechaUltimos30Dias = new Date();
    fechaUltimos30Dias.setDate(fechaUltimos30Dias.getDate() - 30);
    const fechaISO = fechaUltimos30Dias.toISOString().split('T')[0];

    const [
      usuariosPorPlan,
      ticketsEstado,
      facturasPendientes,
      nuevosUsuarios,
      cancelaciones,
      totalIngresosSuscripciones, // Se agrega la nueva métrica aquí
    ] = await Promise.all([
      obtenerUsuariosPorPlan(),
      obtenerTicketsFacturadosVsPendientes(),
      obtenerFacturasServicioPendientes(),
      obtenerNuevosUsuariosDesde(fechaISO),
      obtenerCancelacionesDesde(fechaISO),
      getTotalIngresosSuscripciones(), // Y se llama aquí
    ]);

    res.json({
      usuariosPorPlan,
      ticketsEstado,
      facturasPendientes,
      nuevosUsuarios,
      cancelaciones,
      totalIngresosSuscripciones, // Se envía en la respuesta
    });
  } catch (error) {
    console.error('❌ Error en dashboard admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
