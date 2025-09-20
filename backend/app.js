// app.js
import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';

import authRoutes from './routes/auth.js';
import cancelacionesRoutes from './routes/cancelaciones.js';
import excelRoutes from './routes/excel.js';
import paymentRoutes from './routes/payment.js';
import usuariosRoutes from './routes/usuarios.js';
import estadoServicioRoutes from './routes/estadoServicio.js';

import errorHandler from './middleware/errorHandler.js';

const app = express();


// ✅ CORRECCIÓN: Configuración de CORS para producción y desarrollo
const corsOptions = {
    origin: [
        'http://localhost:5173', // Tu frontend en local
        'https://hastaencontrarte.lat' // Tu dominio de producción
    ],
    credentials: true, // Permite que se envíen cookies o tokens de autorización
};
app.use(cors(corsOptions));
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging básico para cada request
app.use((req, _res, next) => {
  logger.info(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cancelaciones', cancelacionesRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/estado-servicio', estadoServicioRoutes);

// Ruta raíz
app.get('/', (_req, res) => {
  res.send('<pre>API de gastos y bot de WhatsApp funcionando 🚀</pre>');
});

// Manejo global de errores
app.use(errorHandler);

// Exportamos la app para usar en server.js y también para pruebas
export default app;
