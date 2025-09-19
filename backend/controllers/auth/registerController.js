import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../../utils/logger.js';
import { sendConfirmationEmail } from '../../utils/emailService.js';
import { sendHEConfirmationEmail } from '../../utils/hastaEncontrarteEmailService.js';
import { findUserByEmail, findUserByPhone, createUser } from '../../db/users/core.js';
import { openDb } from '../../db/users/initDb.js';
import { crearEstadoServicioInicial } from '../../db/estadoServicio.js';

const JWT_CONFIRM_SECRET = process.env.JWT_CONFIRM_SECRET || 'confirm_secret';

// Generar número de referencia único
async function generarNumeroReferenciaUnico() {
  const db = await openDb();
  let numero;
  let exists = true;
  while (exists) {
    numero = Math.floor(100000 + Math.random() * 900000).toString();
    const row = await db.get(`SELECT id FROM users WHERE numero_referencia_unico = ?`, [numero]);
    if (!row) exists = false;
  }
  return numero;
}

export async function registerUser(req, res) {
  console.log(`[BACKEND] Entrando a registerUser() → Datos recibidos:`, req.body);

  const { nombre, email, telefono, password, plan = [], datosFiscales, acepto_terminos, estado_republica } = req.body;

const emailNormalized = email?.trim().toLowerCase();
const telefonoNormalized = telefono?.trim().replace(/\s+/g, '');
const nombreNormalized = nombre?.trim();
const estadoRepublicaNormalized = estado_republica?.trim();

logger.info(`[REGISTER] emailNorm=${emailNormalized} telNorm=${telefonoNormalized} estado=${estadoRepublicaNormalized}`);

  if (!nombre || !email || !telefono || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (!acepto_terminos) {
    return res.status(400).json({ error: 'Debes aceptar los términos y condiciones.' });
  }

  try {
    // Validar duplicidad de usuario
    const existingEmail = await findUserByEmail(emailNormalized);
    if (existingEmail) return res.status(409).json({ error: 'Este correo ya está registrado.' });

    const existingPhone = await findUserByPhone(telefono);
    if (existingPhone) return res.status(409).json({ error: 'Este teléfono ya está registrado.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const confirmationToken = jwt.sign({ email: emailNormalized }, JWT_CONFIRM_SECRET, { expiresIn: '1d' });
    logger.info(`[CONFIRM] token generado len=${confirmationToken.length} prefix=${confirmationToken.slice(0, 12)}… secret=${process.env.JWT_CONFIRM_SECRET ? 'ENV' : 'DEFAULT'}`);

    const planesArray = Array.isArray(plan) && plan.length > 0 ? plan : ['trial'];

    // Campos fiscales del servicio
    let razon_social_servicio = datosFiscales?.razonSocial || null;
    let rfc_servicio = datosFiscales?.rfc || null;
    let cp_fiscal_servicio = datosFiscales?.cp_fiscal || null;
    let uso_cfdi_servicio = datosFiscales?.uso_cfdi || null;
    let email_fiscal_servicio = datosFiscales?.email_fiscal || null;

    const fechaAceptacion = new Date().toISOString().split('T')[0];
    const versionTerminos = '1.0';

    // Generar número de referencia único
    const numero_referencia_unico = await generarNumeroReferenciaUnico();

    // Crear usuario con los campos nuevos
    const userId = await createUser({
      nombre: nombreNormalized,
      telefono: telefonoNormalized,
      email: emailNormalized,
      passwordHash: hashedPassword,
      plan: planesArray,
      confirmationToken,
      razon_social_servicio,
      rfc_servicio,
      cp_fiscal_servicio,
      uso_cfdi_servicio,
      email_fiscal_servicio,
      acepto_terminos,
      fecha_aceptacion: fechaAceptacion,
      version_terminos: versionTerminos,
      estado_republica: estadoRepublicaNormalized || null,
      ultima_conexion: null,
      numero_referencia_unico,
      fichas_activas_pagadas: 0,
      estado_suscripcion: 'inactivo',
      user_state: 'nuevo'
    });

    logger.info(`[EMAIL] enviando confirmación a ${emailNormalized}`);
    // Enviar correo de confirmación
    await sendHEConfirmationEmail(emailNormalized, confirmationToken);
    logger.info(`[EMAIL] confirmación ENVIADA a ${emailNormalized}`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      numero_referencia_unico
    });
  } catch (err) {
    logger.error(`❌ Error en registro: ${err.message}`);
    res.status(500).json({ error: 'Error del servidor.' });
  }
}
