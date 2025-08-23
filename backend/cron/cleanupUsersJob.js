import cron from 'node-cron'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import logger from '../utils/logger.js'

async function openDb() {
  return open({
    filename: './db/gastos.db',
    driver: sqlite3.Database
  })
}

export function iniciarLimpiezaUsuariosJob() {
  // Corre cada día a las 4am
  cron.schedule('0 4 * * *', async () => {
    logger.info('🧹 Iniciando limpieza de usuarios cancelados o expirados...')

    try {
      const db = await openDb()

      const usuarios = await db.all(`
        SELECT id, nombre, email, cancelado, cancelacion_efectiva
        FROM users
        WHERE cancelado = 1 AND cancelacion_efectiva IS NOT NULL
      `)

      const hoy = new Date()

      for (const user of usuarios) {
        const fechaCancelacion = new Date(user.cancelacion_efectiva)

        if (hoy >= fechaCancelacion) {
          await db.run(`DELETE FROM users WHERE id = ?`, [user.id])
          logger.info(`🗑️ Usuario eliminado: ${user.email} (ID ${user.id})`)
        }
      }
    } catch (err) {
      logger.error('❌ Error durante limpieza de usuarios:', err)
    }
  })

  console.log('🧹 Cron de limpieza activado (4am cada día)')
}
