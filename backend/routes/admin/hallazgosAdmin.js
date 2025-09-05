// 📁 backend/routes/admin/hallazgosRoutes.js

import express from 'express';
import {
    getAllHallazgosAdmin,
    getHallazgoByIdAdmin,
    updateHallazgoAdmin,
    deleteHallazgoAdmin,
    createHallazgoAdmin
} from '../../controllers/admin/hallazgos/adminHallazgosController.js';
import { authenticateAdminToken } from '../../middleware/adminAuthMiddleware.js';

const router = express.Router();

router.get('/', authenticateAdminToken, getAllHallazgosAdmin);
router.get('/:id', authenticateAdminToken, getHallazgoByIdAdmin);
router.put('/:id', authenticateAdminToken, updateHallazgoAdmin);
router.delete('/:id', authenticateAdminToken, deleteHallazgoAdmin);
router.post('/', authenticateAdminToken, createHallazgoAdmin); 

export default router;