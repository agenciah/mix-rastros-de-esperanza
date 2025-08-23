// 📁 routes/mercadoPagoRoutes.js
import express from 'express';
import { crearSuscripcion } from '../controllers/mercadoPagoController.js';

const router = express.Router();

router.post('/suscripcion', crearSuscripcion);

export default router;
