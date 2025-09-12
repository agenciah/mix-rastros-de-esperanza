import dotenv from 'dotenv';
dotenv.config();

console.log("Intentando importar las rutas...");
import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import app from './app.js';
import jwt from 'jsonwebtoken';

// 🆕 Importamos los módulos de 'http' y 'ws'
import http from 'http';
// 🛠️ CORRECCIÓN: Usamos la importación con nombre para 'WebSocketServer'.
import { WebSocketServer } from 'ws';

import authRoutes from './routes/auth.js';
import errorHandler from './middleware/errorHandler.js';
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
            res.send('<pre>API de gastos y bot de WhatsApp funcionando 🚀</pre>');
        });

        // 6️⃣ Manejo de errores global
        app.use(errorHandler);

        // 7️⃣ Levantamos el servidor
        const PORT = process.env.PORT || 3001;
        // En lugar de app.listen(), creamos explícitamente el servidor HTTP.
        const server = http.createServer(app);

        // 🛠️ CORRECCIÓN: Ahora usamos el constructor 'WebSocketServer'.
        const wss = new WebSocketServer({ server });

        // Un Map para guardar la conexión de cada usuario logueado
        // la clave será el userId, el valor será el objeto de conexión (ws)
        const clients = new Map();

        // Función auxiliar para enviar una notificación a un usuario específico
        const sendNotificationToUser = (userId, message) => {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        };

        // Hacemos la función accesible globalmente (o la exportamos/pasamos de una forma más elegante)
        // Para este caso, adjuntarla al objeto 'app' es una forma sencilla de lograrlo.
        app.locals.sendNotificationToUser = sendNotificationToUser;


        wss.on('connection', (ws) => {
            console.log('Cliente de WebSocket conectado');

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    // Cuando un cliente se conecta, debe enviar su token para autenticarse
                    if (data.type === 'auth' && data.token) {
                        jwt.verify(data.token, process.env.JWT_SECRET, (err, decoded) => {
                            if (err) {
                                ws.send(JSON.stringify({ type: 'error', message: 'Token inválido' }));
                                ws.close();
                            } else {
                                const userId = decoded.id;
                                // Asociamos el userId con su conexión de WebSocket
                                clients.set(userId, ws);
                                console.log(`Usuario ${userId} autenticado y asociado a la conexión WebSocket.`);

                                ws.on('close', () => {
                                    clients.delete(userId); // Limpiamos la conexión cuando se desconecta
                                    console.log(`Cliente de WebSocket del usuario ${userId} desconectado.`);
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error procesando mensaje de WebSocket:', error);
                }
            });

            ws.on('error', (error) => console.error('Error en el websocket:', error));
        });


        server.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`Server running on port ${PORT}`);
        });

    } catch (err) {
        logger.error(`❌ Error al iniciar la app: ${err.message}`);
        process.exit(1);
    }
}

main();
