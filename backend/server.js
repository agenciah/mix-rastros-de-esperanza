// RUTA: backend/server.js (VERSIÓN FINAL, LIMPIA Y CORRECTA)

import http from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

import app from './app.js';
import logger from './utils/logger.js';
import { ensureAllTables, insertCatalogos } from './db/users/initDb.js';

async function main() {
    try {
        // La aplicación ahora confía en que las variables de entorno están inyectadas
        // por la plataforma. Si falta alguna, la conexión a la DB fallará y el
        // error se capturará en el bloque catch.
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