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
import { postAdminMessage,getMessagesForAdmin, editAdminMessage, setAdminMessageStatus } from '../controllers/admin/adminMessagesController.js';
import { getReports, getReportedConversation } from '../controllers/admin/adminReportsController.js';
import { resolveReport, moderateUser } from '../controllers/admin/adminActionsController.js';
import { openDb } from '../db/users/initDb.js';

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

// POST /api/admin/mensajes - Crear un nuevo mensaje para el feed de usuarios
router.post('/mensajes', authenticateAdminToken, postAdminMessage);
// GET /api/admin/mensajes - Obtener la lista de todos los mensajes para el admin
router.get('/mensajes', authenticateAdminToken, getMessagesForAdmin);
// PUT /api/admin/mensajes/:id - Editar un mensaje
router.put('/mensajes/:id', authenticateAdminToken, editAdminMessage);
// PUT /api/admin/mensajes/:id/estado - Archivar o reactivar un mensaje
router.put('/mensajes/:id/estado', authenticateAdminToken, setAdminMessageStatus);

// --- RUTAS PARA GESTIÓN DE REPORTES ---
// ✅ CORRECCIÓN: La ruta ahora es '/reportes' en plural y en español
router.get('/reportes', authenticateAdminToken, getReports);

// ✅ CORRECCIÓN: La ruta para ver una conversación ahora usa '/conversations/' para evitar conflictos
router.get('/conversations/:conversationId', authenticateAdminToken, getReportedConversation);

// ✅ RUTA TEMPORAL DE LIMPIEZA (Adaptada para PostgreSQL)
router.get('/limpieza-total-usuarios', async (req, res) => {
    // Esta es nuestra clave secreta. Cámbiala si quieres.
    const secretKey = req.query.secret;
    if (secretKey !== 'MI_CLAVE_SUPER_SECRETA_123') {
        return res.status(403).send('Acceso denegado. Clave secreta incorrecta.');
    }

    try {
        const db = openDb();
        // Ejecutamos el comando para borrar TODOS los usuarios.
        await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE'); // TRUNCATE es más eficiente en PG
        res.status(200).send('✅ ¡Éxito! La tabla de usuarios ha sido limpiada y reiniciada.');
        
    } catch (error) {
        console.error('Error durante la limpieza de usuarios:', error);
        res.status(500).send(`Error al limpiar la base de datos: ${error.message}`);
    }
});

// --- RUTAS PARA ACCIONES DE MODERACIÓN ---
// ✅ CORRECCIÓN: El método HTTP para actualizar un estado debe ser PUT, no POST
router.put('/reports/:reportId/resolve', authenticateAdminToken, resolveReport);
router.put('/users/:userId/moderate', authenticateAdminToken, moderateUser);
export default router;