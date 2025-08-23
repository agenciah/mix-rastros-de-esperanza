// cron/expireTrialsJob.js
import cron from 'node-cron';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { differenceInDays } from 'date-fns';
import logger from '../utils/logger.js';
import { sendExpirationEmail } from '../utils/emailService.js';


async function openDb() {
  return open({
    filename: './db/gastos.db',
    driver: sqlite3.Database
  });
}

export function iniciarExpiracionTrialsJob() {
  // Corre todos los días a las 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('⏰ Ejecutando verificación de expiración de trials...');

    try {
      const db = await openDb();

      const usuarios = await db.all(`
        SELECT id, nombre, email, trial_start_date, plan
        FROM users
        WHERE plan = 'trial'
      `);

      const hoy = new Date();

      for (const user of usuarios) {
        if (!user.trial_start_date) continue;

        const dias = differenceInDays(hoy, new Date(user.trial_start_date));

        if (dias >= 15) {
          // Marcar como expirado y desactivar
          await db.run(`
            UPDATE users
            SET plan = 'expirado', activo = 0
            WHERE id = ?
          `, [user.id]);

          logger.info(`🔒 Usuario expirado: ${user.email} (ID ${user.id})`);

          if (user.email) {
            try {
              await sendExpirationEmail(user.email, user.nombre);
              logger.info(`📧 Correo de expiración enviado a ${user.email}`);
            } catch (error) {
              logger.error(`❌ Error al enviar correo a ${user.email}:`, error);
            }
          }

        }
      }
    } catch (err) {
      logger.error('❌ Error al ejecutar expiración de trials:', err);
    }
  });
}
