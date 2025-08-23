import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import app from './app.js';

import authRoutes from './routes/auth.js';
import gastosRoutes from './routes/gastos.js';
import webhookRoutes from './whatsapp/routes/webhookRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import cancelacionesRoutes from './routes/cancelaciones.js';
import mercadoPagoRoutes from './routes/mercadoPagoRoutes.js';
import excelRoutes from './routes/excel.js';
import paymentRoutes from './routes/payment.js';
import usuariosRoutes from './routes/usuarios.js';
import estadoServicioRoutes from './routes/estadoServicio.js';
import adminRoutes from './routes/admin.js';

import { iniciarExpiracionTrialsJob } from './cron/expireTrialsJob.js';
import { iniciarLimpiezaUsuariosJob } from './cron/cleanupUsersJob.js';

import { ensureTableExists } from './db/users/initDb.js';
import { ensureFichasTables } from './db/users/initFichasDb.js';
import { insertCatalogos } from './db/users/insertCatalogos.js';

async function main() {
  try {
    // 1️⃣ Aseguramos que las tablas de usuarios y gastos existan
    await ensureTableExists();

    // 2️⃣ Aseguramos que las tablas de fichas, hallazgos y catálogos existan
    await ensureFichasTables();

    // 3️⃣ Insertamos datos iniciales en los catálogos
    await insertCatalogos();

    // 4️⃣ Iniciamos jobs de background
    iniciarLimpiezaUsuariosJob();
    iniciarExpiracionTrialsJob();

    // 5️⃣ Middlewares de Express
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use((req, _res, next) => {
      logger.info(`→ ${req.method} ${req.originalUrl}`);
      next();
    });

    // 6️⃣ Rutas
    app.use('/api/auth', authRoutes);
    app.use('/api/gastos', gastosRoutes);
    app.use('/webhook', webhookRoutes);
    app.use('/api/cancelaciones', cancelacionesRoutes);
    app.use('/api/mercadopago', mercadoPagoRoutes);
    app.use('/api/excel', excelRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/usuarios', usuariosRoutes);
    app.use('/api/estado-servicio', estadoServicioRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/public', express.static('public'));

    app.get('/', (_req, res) => {
      res.send('<pre>API de gastos y bot de WhatsApp funcionando 🚀</pre>');
    });

    // 7️⃣ Manejo de errores global
    app.use(errorHandler);

    // 8️⃣ Levantamos el servidor
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    logger.error(`❌ Error al iniciar la app: ${err.message}`);
    process.exit(1);
  }
}

main();
