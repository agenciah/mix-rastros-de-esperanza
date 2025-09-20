// RUTA: backend/app.js

import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Importación de TODAS tus rutas
import authRoutes from './routes/auth.js';
import cancelacionesRoutes from './routes/cancelaciones.js';
import excelRoutes from './routes/excel.js';
import paymentRoutes from './routes/payment.js';
import usuariosRoutes from './routes/usuarios.js';
import estadoServicioRoutes from './routes/estadoServicio.js';
import adminRoutes from './routes/admin.js';
import fichasRoutes from './routes/fichasRoutes.js';
import hallazgosRoutes from './routes/hallazgosRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import messagingRoutes from './routes/messagingRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';

const app = express();

// ✅ Configuración de CORS para producción y desarrollo
const corsOptions = {
    origin: [
        'http://localhost:5173',      // Tu frontend en local
        'https://hastaencontrarte.lat' // Tu dominio de producción
    ],
    credentials: true,
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging para cada request (después de CORS)
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
app.use('/api/admin', adminRoutes);
app.use('/public', express.static('public'));
app.use('/api/fichas', fichasRoutes);
app.use('/api/hallazgos', hallazgosRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/', (_req, res) => {
    res.send('<pre>Hasta Encontrarte API funcionando 🚀</pre>');
});

// Manejo global de errores (debe ir al final)
app.use(errorHandler);

export default app;