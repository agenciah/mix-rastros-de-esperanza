// 📁 backend/routes/admin/fichasRoutes.js

import express from 'express';
import {
  getAllFichasAdmin,
  getFichaByIdAdmin,
  updateFichaAdmin,
  deleteFichaAdmin
} from '../../controllers/admin/fichas/AdminFichasController.js';
import { authenticateAdminToken } from '../../middleware/adminAuthMiddleware.js';

const router = express.Router();

router.get('/', authenticateAdminToken, getAllFichasAdmin);
router.get('/:id', authenticateAdminToken, getFichaByIdAdmin);
router.put('/:id', authenticateAdminToken, updateFichaAdmin);
router.delete('/:id', authenticateAdminToken, deleteFichaAdmin);

export default router;