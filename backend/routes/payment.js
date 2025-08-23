import express from 'express';
import { enviarEmailConComprobante } from '../controllers/paymentController.js';

const router = express.Router();

// Ruta POST para probar el envío de correo con PDF
router.post('/enviar-comprobante', enviarEmailConComprobante);

export default router;
