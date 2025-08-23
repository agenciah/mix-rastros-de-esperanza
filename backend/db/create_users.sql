-- ===================================
-- Drop tablas si existen
-- ===================================
DROP TABLE IF EXISTS estado_servicio;
DROP TABLE IF EXISTS facturas_servicio;
DROP TABLE IF EXISTS cancelaciones;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS fichas_desaparicion;
DROP TABLE IF EXISTS hallazgos;
DROP TABLE IF EXISTS coincidencias_confirmadas;
DROP TABLE IF EXISTS ficha_rasgos_fisicos;
DROP TABLE IF EXISTS ficha_vestimenta;
DROP TABLE IF EXISTS hallazgo_rasgos_fisicos;
DROP TABLE IF EXISTS hallazgo_vestimenta;
DROP TABLE IF EXISTS ubicaciones;
DROP TABLE IF EXISTS catalogo_tipo_lugar;
DROP TABLE IF EXISTS catalogo_partes_cuerpo;
DROP TABLE IF EXISTS catalogo_prendas;

-- ===================================
-- Tabla de usuarios
-- ===================================
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  plan TEXT DEFAULT '["trial"]',
  trial_start_date TEXT,

  -- Términos y condiciones
  acepto_terminos BOOLEAN NOT NULL DEFAULT 0,
  fecha_aceptacion TEXT,
  version_terminos TEXT,

  -- Datos fiscales para tickets
  razon_social_tickets TEXT,
  rfc_tickets TEXT,
  uso_cfdi_tickets TEXT,
  cp_fiscal_tickets TEXT,
  email_fiscal_tickets TEXT,

  -- Datos fiscales para servicios
  razon_social_servicio TEXT,
  rfc_servicio TEXT,
  uso_cfdi_servicio TEXT,
  cp_fiscal_servicio TEXT,
  email_fiscal_servicio TEXT,

  email_confirmed INTEGER DEFAULT 0,
  confirmation_token TEXT,
  reset_token TEXT,
  reset_token_expiration TEXT,

  role TEXT DEFAULT 'user',
  cancelado INTEGER DEFAULT 0,
  cancelacion_efectiva TEXT,

  -- Nuevos campos Rastros de Esperanza
  estado_republica TEXT,
  ultima_conexion TEXT,
  numero_referencia_unico TEXT UNIQUE,
  fichas_activas_pagadas INTEGER NOT NULL DEFAULT 0,
  estado_suscripcion TEXT NOT NULL DEFAULT 'inactivo',

  user_state TEXT
);

-- ===================================
-- Tabla estado_servicio
-- ===================================
CREATE TABLE estado_servicio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  trial_end_date TEXT,
  proximo_pago TEXT,
  facturas_restantes INTEGER DEFAULT 0,
  servicio_activo INTEGER DEFAULT 1,
  cancelacion_programada TEXT,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===================================
-- Tabla facturas_servicio
-- ===================================
CREATE TABLE facturas_servicio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  fecha_emision TEXT NOT NULL DEFAULT (datetime('now')),
  monto INTEGER,
  periodo TEXT,
  descripcion TEXT,
  fecha_pago TEXT,
  metodo_pago TEXT,
  estatus TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===================================
-- Tabla cancelaciones
-- ===================================
CREATE TABLE cancelaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  motivo TEXT,
  fecha_solicitud TEXT,
  estado TEXT DEFAULT 'pendiente',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===================================
-- Tabla admins
-- ===================================
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- ===================================
-- Tablas de fichas y hallazgos (initFichasDb)
-- ===================================
CREATE TABLE ubicaciones (
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

CREATE TABLE catalogo_tipo_lugar (
  id_tipo_lugar INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_tipo TEXT NOT NULL UNIQUE
);

CREATE TABLE catalogo_partes_cuerpo (
  id_parte_cuerpo INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_parte TEXT NOT NULL UNIQUE,
  categoria_principal TEXT NOT NULL
);

CREATE TABLE catalogo_prendas (
  id_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_prenda TEXT NOT NULL UNIQUE,
  categoria_general TEXT NOT NULL
);

CREATE TABLE fichas_desaparicion (
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
  FOREIGN KEY (id_usuario_creador) REFERENCES users(id),
  FOREIGN KEY (id_ubicacion_desaparicion) REFERENCES ubicaciones(id_ubicacion),
  FOREIGN KEY (id_tipo_lugar_desaparicion) REFERENCES catalogo_tipo_lugar(id_tipo_lugar)
);

CREATE TABLE hallazgos (
  id_hallazgo INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario_buscador INTEGER NOT NULL,
  id_ubicacion_hallazgo INTEGER,
  id_tipo_lugar_hallazgo INTEGER,
  fecha_hallazgo TEXT NOT NULL,
  descripcion_general_hallazgo TEXT,
  estado_hallazgo TEXT NOT NULL DEFAULT 'encontrado',
  FOREIGN KEY (id_usuario_buscador) REFERENCES users(id),
  FOREIGN KEY (id_ubicacion_hallazgo) REFERENCES ubicaciones(id_ubicacion),
  FOREIGN KEY (id_tipo_lugar_hallazgo) REFERENCES catalogo_tipo_lugar(id_tipo_lugar)
);

CREATE TABLE coincidencias_confirmadas (
  id_coincidencia INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ficha INTEGER NOT NULL,
  id_hallazgo INTEGER NOT NULL,
  fecha_coincidencia TEXT NOT NULL,
  FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion(id_ficha),
  FOREIGN KEY (id_hallazgo) REFERENCES hallazgos(id_hallazgo)
);

CREATE TABLE ficha_rasgos_fisicos (
  id_rasgo INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ficha INTEGER NOT NULL,
  id_parte_cuerpo INTEGER NOT NULL,
  tipo_rasgo TEXT NOT NULL,
  descripcion_detalle TEXT,
  FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion(id_ficha),
  FOREIGN KEY (id_parte_cuerpo) REFERENCES catalogo_partes_cuerpo(id_parte_cuerpo)
);

CREATE TABLE ficha_vestimenta (
  id_vestimenta INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ficha INTEGER NOT NULL,
  id_prenda INTEGER,
  color TEXT,
  marca TEXT,
  caracteristica_especial TEXT,
  FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion(id_ficha),
  FOREIGN KEY (id_prenda) REFERENCES catalogo_prendas(id_prenda)
);

CREATE TABLE hallazgo_rasgos_fisicos (
  id_hallazgo_rasgo INTEGER PRIMARY KEY AUTOINCREMENT,
  id_hallazgo INTEGER NOT NULL,
  id_parte_cuerpo INTEGER NOT NULL,
  tipo_rasgo TEXT NOT NULL,
  descripcion_detalle TEXT,
  foto_evidencia TEXT,
  FOREIGN KEY (id_hallazgo) REFERENCES hallazgos(id_hallazgo),
  FOREIGN KEY (id_parte_cuerpo) REFERENCES catalogo_partes_cuerpo(id_parte_cuerpo)
);

CREATE TABLE hallazgo_vestimenta (
  id_hallazgo_vestimenta INTEGER PRIMARY KEY AUTOINCREMENT,
  id_hallazgo INTEGER NOT NULL,
  id_prenda INTEGER,
  color TEXT,
  marca TEXT,
  caracteristica_especial TEXT,
  foto_evidencia TEXT,
  FOREIGN KEY (id_hallazgo) REFERENCES hallazgos(id_hallazgo),
  FOREIGN KEY (id_prenda) REFERENCES catalogo_prendas(id_prenda)
);
