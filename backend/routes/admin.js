import express from 'express';
// Se elimina la importación de 'obtenerUsuariosParaFacturacionServicio' de usuariosController.js
import { obtenerUsuariosParaAdmin, actualizarUsuario } from '../controllers/admin/usuariosController.js';
import { obtenerDashboardAdmin } from '../controllers/admin/adminController.js';
import { obtenerEstadisticas } from '../controllers/admin/estadisticasController.js';
import { loginAdmin } from '../controllers/admin/loginAdminController.js';
import { authenticateAdminToken } from '../middleware/adminAuthMiddleware.js';
import fichasRoutes from './admin/fichasAdmin.js';
import hallazgosRoutes from './admin/hallazgosAdmin.js';

const router = express.Router();

// Login simulado
router.post('/login', loginAdmin);

// Rutas admin
router.get('/usuarios', authenticateAdminToken, obtenerUsuariosParaAdmin);
router.put('/usuarios/:id', authenticateAdminToken, actualizarUsuario);
router.get('/dashboard', authenticateAdminToken, obtenerDashboardAdmin);

// --- NUEVA RUTA para las estadísticas ---
router.get('/estadisticas', authenticateAdminToken, obtenerEstadisticas);

router.use('/fichas', fichasRoutes);
// 🆕 Monta el nuevo router de hallazgos
router.use('/hallazgos', hallazgosRoutes);

export default router;