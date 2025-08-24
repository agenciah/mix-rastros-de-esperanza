import express from 'express';
// Se elimina la importación de 'obtenerUsuariosParaFacturacionServicio' de usuariosController.js
import { obtenerUsuariosParaAdmin, actualizarUsuario } from '../controllers/admin/usuariosController.js';
import { obtenerDashboardAdmin } from '../controllers/admin/adminController.js';
import {
  // Renombrada getFacturas a getFacturasYaEmitidas en el controlador
  getFacturasYaEmitidas,
  postFactura,
  getFacturasPorUsuario,
  putFactura,
  deleteFactura,
  // Importamos la nueva función para obtener usuarios pendientes de facturar
  getUsuariosParaFacturar,
  getFacturasRecientesController
} from '../controllers/admin/facturasServicioController.js';
import { obtenerEstadisticas } from '../controllers/admin/estadisticasController.js';
import { loginAdmin } from '../controllers/admin/loginAdminController.js';
import { authenticateAdminToken } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Login simulado
router.post('/login', loginAdmin);

// Rutas admin
router.get('/usuarios', authenticateAdminToken, obtenerUsuariosParaAdmin);
router.put('/usuarios/:id', authenticateAdminToken, actualizarUsuario);
router.get('/dashboard', authenticateAdminToken, obtenerDashboardAdmin);

// Rutas facturas servicio
// Esta ruta ahora usa la función renombrada 'getFacturasYaEmitidas' para obtener todas las facturas emitidas históricamente.
router.get('/facturas-servicio', authenticateAdminToken, getFacturasYaEmitidas);
router.post('/facturas-servicio', authenticateAdminToken, postFactura);
router.get('/facturas-servicio/usuario/:user_id', authenticateAdminToken, getFacturasPorUsuario);
router.put('/facturas-servicio/:id', authenticateAdminToken, putFactura);
router.delete('/facturas-servicio/:id', authenticateAdminToken, deleteFactura);
router.get('/facturas-servicio/recientes', authenticateAdminToken, getFacturasRecientesController);

// --- CAMBIO CLAVE AQUÍ ---
// Esta ruta ahora usa la función 'getUsuariosParaFacturar' que implementamos
// con la lógica de la base de datos para obtener los usuarios pendientes de este mes.
router.get('/usuarios/para-servicio', authenticateAdminToken, getUsuariosParaFacturar);

// --- NUEVA RUTA para las estadísticas ---
router.get('/estadisticas', authenticateAdminToken, obtenerEstadisticas);


export default router;