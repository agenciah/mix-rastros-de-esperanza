import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

import * as perfilController from '../controllers/usuarios/perfilController.js';
import { forgotPassword, resetPassword } from '../controllers/auth/forgotPasswordController.js'

import { query } from '../db/users/initDb.js';

const router = express.Router();

router.get('/planes', authenticateToken, perfilController.obtenerPlanes);
router.get('/:id', authenticateToken, perfilController.obtenerUsuarioPorId);
router.put('/actualizar-planes', authenticateToken, perfilController.actualizarPlanes);
router.put('/perfil', authenticateToken, perfilController.actualizarPerfil);

router.post('/password/forgot', forgotPassword)
router.post('/password/reset', resetPassword)

// Debug endpoints, solo para desarrollo:
router.get('/debug/usuarios', async (req, res) => {
  const db = await openDb();
  const users = await db.all('SELECT id, nombre, email, telefono FROM users');
  res.json(users);
});

router.get('/debug/fiscales-servicio-noauth', async (req, res) => {
  const db = await openDb();
  const rows = await db.all(`
    SELECT id, nombre, email, 
      razon_social_servicio, rfc_servicio, cp_fiscal_servicio,
      uso_cfdi_servicio, email_fiscal_servicio
    FROM users
  `);
  res.json(rows);
});

export default router;
