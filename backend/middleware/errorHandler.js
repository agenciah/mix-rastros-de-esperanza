import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  const message = err.message || 'Ocurrió un error inesperado.';

  logger.error(`${req.method} ${req.url} - ${message}`);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    code: err.code || null
  });
}
