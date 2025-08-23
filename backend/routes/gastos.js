import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { crearGasto, obtenerGastos } from '../controllers/gastosController.js';
import { exportarGastos } from '../controllers/gastosController.js';
import { getFacturablesByUser } from '../controllers/gastosController.js';
import { generarExcelGastos } from '../controllers/excelController.js';
import { eliminarGasto, obtenerResumenGastos, obtenerGastosFacturables, editarGasto } from '../controllers/gastosController.js';

const router = express.Router();

router.post('/', authenticateToken, crearGasto);
router.get('/', authenticateToken, obtenerGastos);
router.get('/exportar', authenticateToken, exportarGastos);
router.get('/exportar/excel', authenticateToken, generarExcelGastos);
router.delete('/:id', authenticateToken, eliminarGasto);
router.get('/resumen', authenticateToken, obtenerResumenGastos)
router.get('/facturables/usuario', authenticateToken, getFacturablesByUser);
router.get('/facturables/general', authenticateToken, obtenerGastosFacturables);
router.put('/:id', authenticateToken, editarGasto);

export default router;
