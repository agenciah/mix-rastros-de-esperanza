import { sendCancelacionEmail } from '../utils/emailService.js';
import { sendHECancelacionEmail } from '../utils/hastaEncontrarteEmailService.js';
import { differenceInDays, addDays } from 'date-fns';
import {
  registrarCancelacion,
  obtenerUsuarioPorId,
  marcarUsuarioComoCancelado,
  revertirCancelacion,
} from '../db/cancelaciones.js';
import { programarFechaFinEnEstadoServicio } from '../db/estadoServicio.js';
import logger from '../utils/logger.js'; // Asegúrate de tenerlo configurado correctamente

export async function solicitarCancelacion(req, res) {
  const { motivo } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    logger.warn('Intento de cancelación sin usuario autenticado.');
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 5) {
    logger.warn(`Usuario ${userId} envió un motivo inválido para cancelación.`);
    return res.status(400).json({ error: 'Debes proporcionar un motivo válido (mínimo 5 caracteres).' });
  }

  try {
    logger.info(`🟡 Usuario ${userId} inició solicitud de cancelación.`);

    await registrarCancelacion(userId, motivo.trim());
    logger.info(`✅ Cancelación registrada para el usuario ${userId}.`);

    const fechaFinCalculada = addDays(new Date(), 30);
    await programarFechaFinEnEstadoServicio(userId, fechaFinCalculada);
    logger.info(`🗓️ Fecha fin programada para el usuario ${userId}: ${fechaFinCalculada.toISOString()}`);

    const user = await obtenerUsuarioPorId(userId);

    await marcarUsuarioComoCancelado(userId, fechaFinCalculada);
    logger.info(`⚠️ Usuario ${userId} marcado como cancelado.`);

    const hoy = new Date();
    const diasRestantes = Math.max(0, differenceInDays(fechaFinCalculada, hoy));

    try {
      await sendHECancelacionEmail(
        user.email,
        user.nombre,
        diasRestantes,
        user.plan,
        user.plan === 'facturacion' ? user.facturacion_tickets : null
      );
      logger.info(`📧 Email de cancelación enviado a ${user.email}`);
    } catch (emailError) {
      logger.error(`❌ Error al enviar correo de cancelación a ${user.email}: ${emailError.message}`);
    }

    return res.json({ mensaje: 'Solicitud de cancelación registrada correctamente.' });
  } catch (error) {
    logger.error(`Error en solicitarCancelacion para usuario ${userId}: ${error.message}`);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

export async function cancelarReversion(req, res) {
  try {
    const userId = req.user.id;

    logger.info(`🔄 Usuario ${userId} solicitó revertir cancelación.`);

    const result = await revertirCancelacion(userId);

    if (result) {
      logger.info(`✅ Cancelación revertida exitosamente para el usuario ${userId}.`);
      res.status(200).json({ mensaje: 'Cancelación revertida exitosamente.' });
    } else {
      logger.warn(`⚠️ No se encontró información para revertir para el usuario ${userId}.`);
      res.status(404).json({ error: 'No se encontró información para revertir.' });
    }
  } catch (error) {
    logger.error(`❌ Error al revertir cancelación para usuario ${req.user.id}: ${error.message}`);
    res.status(500).json({ error: 'Error interno al revertir cancelación.' });
  }
}

export async function obtenerCancelacionActivaController(req, res) {
  const userId = req.user?.id;

  if (!userId) {
    logger.warn('Intento de consultar cancelación sin autenticación.');
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  try {
    const cancelacion = await obtenerCancelacionActiva(userId);

    if (!cancelacion) {
      logger.info(`ℹ️ Usuario ${userId} no tiene cancelación activa.`);
      return res.status(404).json({ mensaje: 'No hay cancelación activa.' });
    }

    logger.info(`📄 Cancelación activa encontrada para usuario ${userId}.`);
    return res.json({ cancelacion });
  } catch (error) {
    logger.error(`❌ Error al obtener cancelación activa para usuario ${userId}: ${error.message}`);
    return res.status(500).json({ error: 'Error al obtener cancelación.' });
  }
}
