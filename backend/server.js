// RUTA: backend/server.js
import http from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import app from './app.js';
import logger from './utils/logger.js';
import { ensureAllTables, insertCatalogos } from './db/users/initDb.js';

// --- Bloque de Inicialización Asíncrona (IIFE) ---
// Este bloque se encarga de preparar la base de datos antes de iniciar el servidor.
(async () => {
    try {
        logger.info('⏳ Inicializando base de datos...');
        await ensureAllTables();
        await insertCatalogos();
        logger.info('✅ Base de datos lista y tablas aseguradas.');
    } catch (err) {
        logger.error(`❌ Error fatal durante la inicialización de la BD: ${err.message}`);
        process.exit(1); // Detiene la app si la BD no puede iniciar.
    }
})();

// --- Lógica Principal del Servidor ---
// Esta parte se queda en el nivel superior para mantener el proceso de Node.js vivo.
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
        } catch (e) { 
            logger.error(`Error procesando mensaje WS: ${e.message}`);
        }
    });
});

// Heroku necesita escuchar en el puerto que él asigna.
const PORT = process.env.PORT;

// Agregamos una validación para asegurar que la variable PORT exista.
if (!PORT) {
    logger.error('❌ La variable de entorno PORT no está definida. Saliendo.');
    process.exit(1);
}

server.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo y escuchando en el puerto ${PORT}`);
});