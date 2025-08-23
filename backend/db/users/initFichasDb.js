// backend/db/initFichasDb.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance;

export async function openDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: path.join(__dirname, "gastos.db"), // usamos la misma DB central
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
}

export async function ensureFichasTables() {
  const db = await openDb();

  // ======================
  // Catálogos y ubicaciones
  // ======================
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ubicaciones (
      id_ubicacion INTEGER PRIMARY KEY AUTOINCREMENT,
      estado TEXT NOT NULL,
      municipio TEXT NOT NULL,
      localidad TEXT,
      calle TEXT,
      referencias TEXT,
      latitud REAL,
      longitud REAL,
      codigo_postal TEXT
    );

    CREATE TABLE IF NOT EXISTS catalogo_tipo_lugar (
      id_tipo_lugar INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_tipo TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS catalogo_partes_cuerpo (
      id_parte_cuerpo INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_parte TEXT NOT NULL UNIQUE,
      categoria_principal TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS catalogo_prendas (
      id_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_prenda TEXT NOT NULL UNIQUE,
      categoria_general TEXT NOT NULL
    );
  `);

  // ======================
  // Fichas de desaparición
  // ======================
  await db.exec(`
    CREATE TABLE IF NOT EXISTS fichas_desaparicion (
      id_ficha INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario_creador INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      segundo_nombre TEXT,
      apellido_paterno TEXT NOT NULL,
      apellido_materno TEXT,
      fecha_desaparicion TEXT NOT NULL,
      id_ubicacion_desaparicion INTEGER,
      id_tipo_lugar_desaparicion INTEGER,
      foto_perfil TEXT,
      estado_ficha TEXT NOT NULL DEFAULT 'activa',
      fecha_registro_encontrado TEXT,
      estado_pago TEXT NOT NULL DEFAULT 'pendiente',
      FOREIGN KEY (id_usuario_creador) REFERENCES usuarios (id_usuario),
      FOREIGN KEY (id_ubicacion_desaparicion) REFERENCES ubicaciones (id_ubicacion),
      FOREIGN KEY (id_tipo_lugar_desaparicion) REFERENCES catalogo_tipo_lugar (id_tipo_lugar)
    );
  `);

  // ======================
  // Hallazgos
  // ======================
  await db.exec(`
    CREATE TABLE IF NOT EXISTS hallazgos (
      id_hallazgo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario_buscador INTEGER NOT NULL,
      id_ubicacion_hallazgo INTEGER,
      id_tipo_lugar_hallazgo INTEGER,
      fecha_hallazgo TEXT NOT NULL,
      descripcion_general_hallazgo TEXT,
      estado_hallazgo TEXT NOT NULL DEFAULT 'encontrado',
      FOREIGN KEY (id_usuario_buscador) REFERENCES usuarios (id_usuario),
      FOREIGN KEY (id_ubicacion_hallazgo) REFERENCES ubicaciones (id_ubicacion),
      FOREIGN KEY (id_tipo_lugar_hallazgo) REFERENCES catalogo_tipo_lugar (id_tipo_lugar)
    );
  `);

  // ======================
  // Coincidencias confirmadas
  // ======================
  await db.exec(`
    CREATE TABLE IF NOT EXISTS coincidencias_confirmadas (
      id_coincidencia INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ficha INTEGER NOT NULL,
      id_hallazgo INTEGER NOT NULL,
      fecha_coincidencia TEXT NOT NULL,
      FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion (id_ficha),
      FOREIGN KEY (id_hallazgo) REFERENCES hallazgos (id_hallazgo)
    );
  `);

  // ======================
  // Relaciones de rasgos físicos y vestimenta
  // ======================
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ficha_rasgos_fisicos (
      id_rasgo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ficha INTEGER NOT NULL,
      id_parte_cuerpo INTEGER NOT NULL,
      tipo_rasgo TEXT NOT NULL,
      descripcion_detalle TEXT,
      FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion (id_ficha),
      FOREIGN KEY (id_parte_cuerpo) REFERENCES catalogo_partes_cuerpo (id_parte_cuerpo)
    );

    CREATE TABLE IF NOT EXISTS ficha_vestimenta (
      id_vestimenta INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ficha INTEGER NOT NULL,
      id_prenda INTEGER,
      color TEXT,
      marca TEXT,
      caracteristica_especial TEXT,
      FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion (id_ficha),
      FOREIGN KEY (id_prenda) REFERENCES catalogo_prendas (id_prenda)
    );

    CREATE TABLE IF NOT EXISTS hallazgo_rasgos_fisicos (
      id_hallazgo_rasgo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_hallazgo INTEGER NOT NULL,
      id_parte_cuerpo INTEGER NOT NULL,
      tipo_rasgo TEXT NOT NULL,
      descripcion_detalle TEXT,
      foto_evidencia TEXT,
      FOREIGN KEY (id_hallazgo) REFERENCES hallazgos (id_hallazgo),
      FOREIGN KEY (id_parte_cuerpo) REFERENCES catalogo_partes_cuerpo (id_parte_cuerpo)
    );

    CREATE TABLE IF NOT EXISTS hallazgo_vestimenta (
      id_hallazgo_vestimenta INTEGER PRIMARY KEY AUTOINCREMENT,
      id_hallazgo INTEGER NOT NULL,
      id_prenda INTEGER,
      color TEXT,
      marca TEXT,
      caracteristica_especial TEXT,
      foto_evidencia TEXT,
      FOREIGN KEY (id_hallazgo) REFERENCES hallazgos (id_hallazgo),
      FOREIGN KEY (id_prenda) REFERENCES catalogo_prendas (id_prenda)
    );
  `);

  console.log("✔️ Tablas de fichas y hallazgos verificadas/creadas correctamente");
}
