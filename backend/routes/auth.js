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

// RUTA: backend/routes/auth.js

router.get('/confirm', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: 'Token no proporcionado.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_CONFIRM_SECRET || 'confirm_secret');
        const db = await openDb();

        const result = await db.run(
            `UPDATE users SET email_confirmed = 1, confirmation_token = NULL WHERE email = ? AND email_confirmed = 0`,
            [decoded.email]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Token ya utilizado o usuario no encontrado.' });
        }

        // ✅ CORRECCIÓN: En lugar de redirigir, enviamos una respuesta JSON de éxito.
        res.status(200).json({ success: true, message: 'Correo confirmado correctamente.' });

    } catch (err) {
        // ✅ CORRECCIÓN: Enviamos un error JSON.
        res.status(400).json({ success: false, message: 'Token inválido o expirado.' });
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