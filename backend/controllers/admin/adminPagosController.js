import { countActiveFichasByUserId } from '../../db/queries/fichasAndHallazgosQueries.js';
import { findUsersWithExpiredService, revertirPagoValidado, getPagosRecientes } from '../../db/admin/adminQueriesPagos.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene una lista de usuarios con pagos pendientes, enriquecida con el número
 * de fichas activas y el monto de donación sugerido.
 */
export const getPagosPendientes = async (req, res) => {
    try {
        // 1. Obtenemos la lista base de usuarios con servicio vencido
        const usuariosVencidos = await findUsersWithExpiredService();

        // 2. Enriquecemos la lista con datos adicionales
        const usuariosPendientes = [];
        for (const user of usuariosVencidos) {
            // Contamos las fichas activas de cada usuario
            const fichasActivas = await countActiveFichasByUserId(user.id);

            // Calculamos el monto a cobrar (misma lógica que en el front-end)
            let montoACobrar = 50;
            if (fichasActivas > 1) {
                montoACobrar = 100;
            }

            usuariosPendientes.push({
                ...user,
                fichasActivas,
                montoACobrar
            });
        }

        res.json({ success: true, data: usuariosPendientes });

    } catch (error) {
        logger.error(`❌ Error en getPagosPendientes: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener la lista de pagos pendientes.' });
    }
};

export const marcarPago = async (req, res) => {
    const { userId, montoACobrar } = req.body;
    try {
        const result = await marcarPagoComoRecibido(userId, montoACobrar);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar el pago.' });
    }
};

export const obtenerPagosRecientes = async (req, res) => {
    try {
        const pagos = await getPagosRecientes();
        res.json({ success: true, data: pagos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener pagos recientes.' });
    }
};

export const revertirPago = async (req, res) => {
    const { pagoId } = req.body;
    try {
        const result = await revertirPagoValidado(pagoId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al revertir el pago.' });
    }
};