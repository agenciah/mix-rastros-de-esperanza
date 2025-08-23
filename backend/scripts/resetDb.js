// backend/scripts/resetDb.js
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

async function resetDatabase() {
  const db = await open({
    filename: './db/gastos.db', // asegúrate que sea la oficial
    driver: sqlite3.Database,
  });

  // Crea tablas con todos los campos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      plan TEXT DEFAULT '["trial"]',
      trial_start_date TEXT,
      tickets_facturados INTEGER DEFAULT 0,
      facturacion_tickets INTEGER DEFAULT 0,
      gastos_registrados INTEGER DEFAULT 0,
      razon_social_tickets TEXT,
      rfc_tickets TEXT,
      uso_cfdi_tickets TEXT,
      email_fiscal_tickets TEXT,
      cp_fiscal_tickets TEXT,
      razon_social_servicio TEXT,
      rfc_servicio TEXT,
      uso_cfdi_servicio TEXT,
      email_fiscal_servicio TEXT,
      cp_fiscal_servicio TEXT,
      email_confirmed INTEGER DEFAULT 0,
      confirmation_token TEXT,
      role TEXT DEFAULT 'user',
      cancelado INTEGER DEFAULT 0
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS estado_servicio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      trial_end_date TEXT,
      proximo_pago TEXT,
      facturas_restantes INTEGER DEFAULT 0,
      servicio_activo INTEGER DEFAULT 1,
      cancelacion_programada TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cancelaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      motivo TEXT,
      fecha_solicitud TEXT,
      estado TEXT DEFAULT 'pendiente',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha TEXT NOT NULL,
      tipo TEXT,
      tipo_gasto TEXT,
      contenido TEXT,
      imagen_url TEXT,
      es_facturable INTEGER DEFAULT 0,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
      forma_pago TEXT,
      categoria TEXT,
      notas TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Limpia todas las tablas
  await db.run('DELETE FROM cancelaciones');
  await db.run('DELETE FROM estado_servicio');
  await db.run('DELETE FROM gastos');
  await db.run('DELETE FROM users');

  // Reinicia secuencias AUTOINCREMENT
  await db.run('DELETE FROM sqlite_sequence WHERE name = "users"');
  await db.run('DELETE FROM sqlite_sequence WHERE name = "cancelaciones"');
  await db.run('DELETE FROM sqlite_sequence WHERE name = "estado_servicio"');
  await db.run('DELETE FROM sqlite_sequence WHERE name = "gastos"');

  console.log('🧹 Base de datos reiniciada completamente (tablas y IDs).');
}

resetDatabase().catch(err => {
  console.error('❌ Error al reiniciar la base de datos:', err);
});
