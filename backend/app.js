// RUTA: backend/app.js (VERSIÓN FINAL)
console.log('[APP.JS] - INICIO DEL ARCHIVO');

import express from 'express';
console.log('[APP.JS] - import express OK');

import cors from 'cors';
console.log('[APP.JS] - import cors OK');

import logger from './utils/logger.js';
console.log('[APP.JS] - import logger OK');

import errorHandler from './middleware/errorHandler.js';
console.log('[APP.JS] - import errorHandler OK');

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

console.log('[APP.JS] - Creando instancia de express...');
const app = express();
console.log('[APP.JS] - Instancia de express CREADA');

app.use(cors({
    origin: ['http://localhost:5173', 'https://hastaencontrarte.lat'],
    credentials: true
}));

console.log('[APP.JS] - CORS (temporalmente desactivado) OK'); // <--- ¡NUEVA LÍNEA DE PRUEBA!
console.log('[APP.JS] - Configurando middlewares de express...');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
    logger.info(`→ ${req.method} ${req.originalUrl}`);
    next();
});
console.log('[APP.JS] - Middlewares de express configurados OK');

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

console.log('[APP.JS] - Configurando ruta GET / y errorHandler...');
app.get('/', (_req, res) => {
    res.send('<pre>Hasta Encontrarte API funcionando 🚀</pre>');
});
app.use(errorHandler);
console.log('[APP.JS] - Ruta GET / y errorHandler configurados OK');


console.log('[APP.JS] - FIN DEL ARCHIVO, EXPORTANDO APP...');
export default app;