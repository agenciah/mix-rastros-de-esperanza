// RUTA: backend/app.js (VERSIÓN DE DEPURACIÓN)

import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

console.log('✅ app.js: Archivo alcanzado.');

// Importación de TODAS tus rutas (COMENTADAS PARA LA PRUEBA)
// import authRoutes from './routes/auth.js';
// import cancelacionesRoutes from './routes/cancelaciones.js';
// import excelRoutes from './routes/excel.js';
// import paymentRoutes from './routes/payment.js';
// import usuariosRoutes from './routes/usuarios.js';
// import estadoServicioRoutes from './routes/estadoServicio.js';
// import adminRoutes from './routes/admin.js';
// import fichasRoutes from './routes/fichasRoutes.js';
// import hallazgosRoutes from './routes/hallazgosRoutes.js';
// import matchRoutes from './routes/matchRoutes.js';
// import feedRoutes from './routes/feedRoutes.js';
// import messagingRoutes from './routes/messagingRoutes.js';
// import notificationsRoutes from './routes/notificationsRoutes.js';

const app = express();
app.use(cors()); // Usamos una configuración simple para la prueba
app.use(express.json());

app.get('/', (_req, res) => {
    res.send('Servidor de depuración funcionando.');
});

app.use(errorHandler);

console.log('✅ app.js: Fin del script sin errores.');

export default app;