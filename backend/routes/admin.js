import express from 'express';
// Se elimina la importación de 'obtenerUsuariosParaFacturacionServicio' de usuariosController.js
import { obtenerUsuariosParaAdmin, actualizarUsuario } from '../controllers/admin/usuariosController.js';
import { obtenerDashboardAdmin } from '../controllers/admin/adminController.js';
import { obtenerEstadisticas } from '../controllers/admin/estadisticasController.js';
import { loginAdmin } from '../controllers/admin/loginAdminController.js';
import { authenticateAdminToken } from '../middleware/adminAuthMiddleware.js';
import fichasRoutes from './admin/fichasAdmin.js';
import hallazgosRoutes from './admin/hallazgosAdmin.js';
import { 
    getRecentMatches, 
    getMatchDetail, 
    updateMatchReviewStatus 
} from '../controllers/admin/adminMatchesController.js';
import { getPagosPendientes, obtenerPagosRecientes, marcarPago, revertirPago } from '../controllers/admin/adminPagosController.js';

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

// =============================
// Rutas para la Sección de Coincidencias
// =============================
router.get('/matches', getRecentMatches);
router.get('/matches/:id_coincidencia', getMatchDetail);
router.put('/matches/:id_coincidencia/review', updateMatchReviewStatus);

// --- RUTAS PARA GESTIÓN DE PAGOS ---
router.get('/pagos-pendientes', authenticateAdminToken, getPagosPendientes);
router.get('/pagos-recientes', authenticateAdminToken, obtenerPagosRecientes);
router.post('/marcar-pago', authenticateAdminToken, marcarPago);
router.post('/revertir-pago', authenticateAdminToken, revertirPago);

export default router;