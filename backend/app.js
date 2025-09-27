// RUTA: backend/app.js (VERSIÓN FINAL)

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

// ✅ INICIA CORRECCIÓN: Configuración de CORS más robusta
const whitelist = [
    'http://localhost:5173',
    'https://hastaencontrarte.lat'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin 'origin' (como Postman o apps móviles) o si el origen está en la lista blanca
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos para la llamada de permiso
    allowedHeaders: 'Content-Type,Authorization' // Headers permitidos
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Habilita explícitamente las respuestas de preflight para todas las rutas
// ✅ FIN CORRECCIÓN
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use(errorHandler);

export default app;