// routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// 🔄 Nuevas rutas a controladores descompuestos
import { registerUser } from '../controllers/auth/registerController.js';
import { loginUser } from '../controllers/auth/loginController.js';
import { resendConfirmationEmail } from '../controllers/auth/resendConfirmationController.js';
import { forgotPassword, resetPassword } from '../controllers/auth/forgotPasswordController.js';


import { validarCampos } from '../middleware/validationMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPlan } from '../middleware/planMiddleware.js';

const router = express.Router();


// 🟢 Validación de registro
router.get('/bienvenida', authenticateToken, (req, res) => {
  let mensaje = `¡Hola ${req.user.email}!`;

  if (req.user.plan === 'trial') {
    mensaje += ' Estás en periodo de prueba. Explora todo lo que puedes hacer.';
  } else if (req.user.plan === 'facturacion') {
    mensaje += ' Tienes acceso completo al sistema de facturación.';
  }

  res.json({ mensaje });
});

router.post('/register', [
  body('nombre').notEmpty().trim().escape().withMessage('Nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono').notEmpty().trim().escape().withMessage('Teléfono obligatorio'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  validarCampos,
  (req, res, next) => {
    console.log(`
      [BACKEND: routes/auth.js]
      ← Recibida petición POST /register
      → Desde: Register.jsx
      → Enviando a controlador: registerController.js > registerUser()
      → Datos recibidos:`, req.body);
            next(); // MUY IMPORTANTE: seguir con la cadena de middlewares
          }
      ], 
    registerUser
);

// 🟢 Validación de recuperación de contraseña
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Email inválido'),
    validarCampos
  ],
  forgotPassword
);

// 🟢 Validación de restablecimiento de contraseña
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token requerido'),
    body('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validarCampos
  ],
  resetPassword
);

// 🟢 Validación de login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña es requerida'),
  validarCampos
], loginUser);

// 🟢 Validación para reenvío de confirmación
router.post('/resend-confirmation', [
  body('email').isEmail().withMessage('Email válido requerido'),
  validarCampos
], resendConfirmationEmail);

// Ruta de confirmación por token
router.get('/confirm', async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_CONFIRM_SECRET || 'confirm_secret');
    const email = decoded.email;

    const db = await open({ filename: './db/gastos.db', driver: sqlite3.Database });

    await db.run(
      `UPDATE users SET email_confirmed = 1, confirmation_token = NULL WHERE email = ?`,
      [email]
    );

    res.send('✅ Correo confirmado correctamente. Ya puedes iniciar sesión.');
  } catch (err) {
    res.status(400).send('❌ Token inválido o expirado.');
  }
});

// Ruta protegida
router.get('/ruta-protegida', authenticateToken, (req, res) => {
  res.json({ message: 'Ruta protegida accedida correctamente', user: req.user });
});

// Ruta solo para usuarios con plan "facturacion"
router.get('/solo-facturacion', authenticateToken, checkPlan(['facturacion']), (req, res) => {
  res.json({ message: `Hola ${req.user.email}, accediste con plan facturación.` });
});

// Ruta para trial y facturación
router.get('/uso-general', authenticateToken, checkPlan(['trial', 'facturacion']), (req, res) => {
  res.json({ message: `Hola ${req.user.email}, accediste con plan válido.` });
});

export default router;
