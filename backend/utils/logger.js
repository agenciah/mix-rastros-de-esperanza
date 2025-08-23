// 📁 utils/logger.js
import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';

// Define niveles y colores personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Define ruta para logs rotativos
const logDir = 'utils/logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// 🚀 Transport rotativo diario comprimido
const transportRotate = new DailyRotateFile({
  dirname: logDir,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '2m',
  maxFiles: '14d'
});

// ✨ Formato legible para consola
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`
  )
);

// ✨ Formato para archivo (sin colores)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ level, message, timestamp }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
  )
);

// 🎯 Crea el logger principal
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format: fileFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    transportRotate
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ],
  exitOnError: false // ✅ El servidor no se cae por errores no manejados
});

export default logger;
