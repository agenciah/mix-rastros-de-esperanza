// backend/routes/auth.js
import express from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { openDb } from '../db/users/initDb.js';

// 🔄 Nuevas rutas a controladores descompuestos
import { registerUser } from '../controllers/auth/registerController.js';
import { loginUser, getFirebaseToken, getProfile } from '../controllers/auth/loginController.js';
import { resendConfirmationEmail } from '../controllers/auth/resendConfirmationController.js';
import { forgotPassword, resetPassword } from '../controllers/auth/forgotPasswordController.js';

import { validarCampos } from '../middleware/validationMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPlan } from '../middleware/planMiddleware.js';

const router = express.Router();

// 🟢 Rutas de autenticación
router.post('/register', [
  body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono').notEmpty().withMessage('Teléfono obligatorio'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  // Nuevas validaciones para los campos añadidos
  body('estado_republica').notEmpty().withMessage('El estado es obligatorio'),
  body('acepto_terminos').isBoolean().custom(value => value === true).withMessage('Debes aceptar los términos y condiciones'),
  validarCampos,
], registerUser);

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña es requerida'),
  validarCampos
], loginUser);

// ✅ 2. AÑADE ESTA RUTA NUEVA
// Esta ruta estará protegida y solo funcionará si se envía un token válido.
router.get('/profile', authenticateToken, getProfile);

// AÑADE ESTA RUTA (usualmente después de las de login/register)
// El frontend la llamará después de que el usuario inicie sesión.
router.get('/firebase-token', authenticateToken, getFirebaseToken);


router.post('/resend-confirmation', [
  body('email').isEmail().withMessage('Email válido requerido'),
  validarCampos
], resendConfirmationEmail);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email inválido'),
  validarCampos
], forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requerido'),
  body('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validarCampos
], resetPassword);

// 🟢 Rutas protegidas y de confirmación
router.get('/bienvenida', authenticateToken, (req, res) => {
  let mensaje = `¡Hola ${req.user.email}!`;
  res.json({ mensaje });
});

router.get('/confirm', async (req, res) => {
  const { token } = req.query;
  const usingSecret = process.env.JWT_CONFIRM_SECRET ? 'ENV' : 'DEFAULT';
  console.log(`[CONFIRM] token len=${token?.length} prefix=${token?.slice(0, 12)}… secret=${usingSecret}`);



  console.log("🔑 Token recibido:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_CONFIRM_SECRET || 'confirm_secret');
    console.log("📧 Email decodificado:", decoded.email);

    const db = await openDb(); // 👈 evita rutas hardcodeadas

    const result = await db.run(
      `UPDATE users SET email_confirmed = 1, confirmation_token = NULL WHERE email = ?`,
      [decoded.email]
    );
    console.log(`[CONFIRM] UPDATE changes=${result.changes}`);

    const row = await db.get(
      `SELECT email, email_confirmed, confirmation_token FROM users WHERE email = ?`,
      [decoded.email]
    );
    console.log(`[CONFIRM] after SELECT:`, row);

     if (result.changes === 0) {
      return res.status(404).send('No se encontró el usuario para confirmar.');
    }

    res.send('✅ Correo confirmado correctamente. Ya puedes iniciar sesión.');
  } catch (err) {
    res.status(400).send('❌ Token inválido o expirado.');
  }
});

router.get('/ruta-protegida', authenticateToken, (req, res) => {
  res.json({ message: 'Ruta protegida accedida correctamente', user: req.user });
});

// Nota: las rutas con `checkPlan` ahora son irrelevantes, pero las mantendremos para no romper nada
router.get('/solo-facturacion', authenticateToken, checkPlan(['facturacion']), (req, res) => {
  res.json({ message: `Hola ${req.user.email}, accediste con plan facturación.` });
});

router.get('/uso-general', authenticateToken, checkPlan(['trial', 'facturacion']), (req, res) => {
  res.json({ message: `Hola ${req.user.email}, accediste con plan válido.` });
});

export default router;