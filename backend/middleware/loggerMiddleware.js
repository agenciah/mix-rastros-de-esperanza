// RUTA: backend/middleware/loggerMiddleware.js

import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
    logger.info('--- 📥 Nueva Petición Recibida ---');
    logger.info(`[RUTA]: ${req.method} ${req.originalUrl}`);
    
    if (Object.keys(req.params).length > 0) {
        logger.info('[PARAMS]:');
        console.table(req.params);
    }
    if (Object.keys(req.query).length > 0) {
        logger.info('[QUERY]:');
        console.table(req.query);
    }
    if (Object.keys(req.body).length > 0) {
        logger.info('[BODY]:');
        console.table(req.body);
    }
    
    next(); // MUY IMPORTANTE: Pasa a la siguiente función (el controlador)
};