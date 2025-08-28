// ✅ ¡Aquí está el console.log que necesitas!
console.log("Intentando importar las rutas...");
import dotenv from 'dotenv';
dotenv.config();

// ✅ ¡Aquí está el console.log que necesitas!
console.log("Intentando importar las rutas...");
import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import app from './app.js';

// ✅ ¡Aquí está el console.log que necesitas!
console.log("Intentando importar las rutas...");

import authRoutes from './routes/auth.js';
import errorHandler from './middleware/errorHandler.js';
import cancelacionesRoutes from './routes/cancelaciones.js';
import mercadoPagoRoutes from './routes/mercadoPagoRoutes.js';
import excelRoutes from './routes/excel.js';
import paymentRoutes from './routes/payment.js';
import usuariosRoutes from './routes/usuarios.js';
import estadoServicioRoutes from './routes/estadoServicio.js';
import adminRoutes from './routes/admin.js';
import fichasRoutes from './routes/fichasRoutes.js';
import hallazgosRoutes from './routes/hallazgosRoutes.js';
import matchRoutes from './routes/matchRoutes.js';

import { iniciarExpiracionTrialsJob } from './cron/expireTrialsJob.js';
import { iniciarLimpiezaUsuariosJob } from './cron/cleanupUsersJob.js';

// ✅ AHORA: Importación unificada desde el único archivo de inicialización
import { ensureAllTables, insertCatalogos } from './db/users/initDb.js';

async function main() {
    try {
        console.log("🚀 Iniciando backend...");

        // 1️⃣  Inicialización unificada de la base de datos
        console.log("1️⃣  Asegurando todas las tablas...");
        await ensureAllTables();
        console.log("2️⃣  Insertando catálogos...");
        await insertCatalogos();

        // 3️⃣ Iniciamos jobs de background
        console.log("3️⃣ Iniciando jobs...");
        iniciarLimpiezaUsuariosJob();
        iniciarExpiracionTrialsJob();

        // 4️⃣ Middlewares de Express
        console.log("4️⃣ Configurando express...");
        app.use(cors());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.use((req, _res, next) => {
            logger.info(`→ ${req.method} ${req.originalUrl}`);
            next();
        });

        // 5️⃣ Rutas
        app.use('/api/auth', authRoutes);
        app.use('/api/cancelaciones', cancelacionesRoutes);
        app.use('/api/mercadopago', mercadoPagoRoutes);
        app.use('/api/excel', excelRoutes);
        app.use('/api/payment', paymentRoutes);
        app.use('/api/usuarios', usuariosRoutes);
        app.use('/api/estado-servicio', estadoServicioRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/public', express.static('public'));
        app.use('/api/fichas', fichasRoutes);
        app.use('/api/hallazgos', hallazgosRoutes);
        app.use('/api/matches', matchRoutes);

        app.get('/', (_req, res) => {
            res.send('<pre>API de gastos y bot de WhatsApp funcionando 🚀</pre>');
        });

        // 6️⃣ Manejo de errores global
        app.use(errorHandler);

        // 7️⃣ Levantamos el servidor
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