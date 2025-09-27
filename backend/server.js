// RUTA: backend/server.js (VERSIÓN FINAL)
import http from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

import app from './app.js';
import logger from './utils/logger.js';
import { ensureAllTables, insertCatalogos } from './db/users/initDb.js';

async function main() {

    try {
        // ✅ --- INICIO: BLOQUE DE VERIFICACIÓN DE VARIABLES ---
        console.log('--- Verificando variables de entorno al arrancar ---');
        const criticalVars = ['DATABASE_URL', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'JWT_SECRET'];
        let missingVar = false;
        criticalVars.forEach(v => {
            if (!process.env[v]) {
                console.error(`❌ Variable de entorno crítica FALTANTE: ${v}`);
                missingVar = true;
            } else {
                console.log(`✔️ Variable encontrada: ${v}`);
            }
        });
        console.log('----------------------------------------------------');
        if (missingVar) {
            throw new Error('Faltan variables de entorno críticas. El servidor no puede arrancar.');
        }
        await ensureAllTables();
        await insertCatalogos();

        const server = http.createServer(app);
        const wss = new WebSocketServer({ server });

        const clients = new Map();
        const sendNotificationToUser = (userId, message) => {
            const client = clients.get(userId);
            if (client && client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(message));
            }
        };
        app.locals.sendNotificationToUser = sendNotificationToUser;

        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'auth' && data.token) {
                        jwt.verify(data.token, process.env.JWT_SECRET, (err, decoded) => {
                            if (!err) {
                                clients.set(decoded.id, ws);
                                ws.on('close', () => clients.delete(decoded.id));
                            }
                        });
                    }
                } catch (e) { console.error('Error procesando mensaje WS:', e); }
            });
        });

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en el puerto ${PORT}`);
        });

    } catch (err) {
        logger.error(`❌ Error fatal al iniciar la app: ${err.message}`);
        process.exit(1);
    }
}

main();