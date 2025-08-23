import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

let dbInstance = null;

export async function openDb() {
    if (!dbInstance) {
        dbInstance = await open({
            filename: './db/gastos.db',
            driver: sqlite3.Database,
        });
    }
    return dbInstance;
}

export async function ensureTableExists() {
    const db = await openDb();

    // 1️⃣ Crear tabla users si no existe
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            telefono TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            plan TEXT DEFAULT '["trial"]',
            trial_start_date TEXT,

            razon_social_servicio TEXT,
            rfc_servicio TEXT,
            uso_cfdi_servicio TEXT,
            email_fiscal_servicio TEXT,
            cp_fiscal_servicio TEXT,

            email_confirmed INTEGER DEFAULT 0,
            confirmation_token TEXT,
            reset_token TEXT,
            reset_token_expiration TEXT,

            role TEXT DEFAULT 'user',
            cancelado INTEGER DEFAULT 0,
            cancelacion_efectiva TEXT,

            acepto_terminos BOOLEAN NOT NULL DEFAULT 0,
            fecha_aceptacion TEXT,
            version_terminos TEXT,

            user_state TEXT,

            estado_republica TEXT,
            ultima_conexion TEXT,
            numero_referencia_unico TEXT,
            fichas_activas_pagadas INTEGER NOT NULL DEFAULT 0,
            estado_suscripcion TEXT NOT NULL DEFAULT 'inactivo'
        );
    `);

    // 2️⃣ Definir columnas nuevas que queremos asegurar
    const newColumns = [
        { name: 'estado_republica', type: 'TEXT' },
        { name: 'ultima_conexion', type: 'TEXT' },
        { name: 'numero_referencia_unico', type: 'TEXT' }, // solo TEXT
        { name: 'fichas_activas_pagadas', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'estado_suscripcion', type: "TEXT NOT NULL DEFAULT 'inactivo'" }
    ];

    // 3️⃣ Revisar columnas existentes
    const existingColumns = await db.all(`PRAGMA table_info(users);`);
    const existingColumnNames = existingColumns.map(col => col.name);

    for (const col of newColumns) {
        if (!existingColumnNames.includes(col.name)) {
            console.log(`➕ Agregando columna '${col.name}' a la tabla users...`);
            await db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
        }
    }

    // 4️⃣ Crear índice único para numero_referencia_unico
    await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_numero_referencia_unico
        ON users(numero_referencia_unico);
    `);

    // 5️⃣ Refrescar lista de columnas para siguientes validaciones
    const refreshedColumns = await db.all(`PRAGMA table_info(users);`);
    const userColNames = refreshedColumns.map(col => col.name);

    // 6️⃣ Agregar columnas adicionales de forma segura
    const safeColumns = [
        { name: 'reset_token', type: 'TEXT' },
        { name: 'reset_token_expiration', type: 'TEXT' },
        { name: 'acepto_terminos', type: 'BOOLEAN NOT NULL DEFAULT 0' },
        { name: 'fecha_aceptacion', type: 'TEXT' },
        { name: 'version_terminos', type: 'TEXT' },
        { name: 'user_state', type: 'TEXT' }
    ];

    for (const col of safeColumns) {
        if (!userColNames.includes(col.name)) {
            console.log(`➕ Agregando columna '${col.name}' a tabla users`);
            await db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
        }
    }

    // 7️⃣ Crear tablas relacionadas
    await db.exec(`
        CREATE TABLE IF NOT EXISTS estado_servicio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            trial_end_date TEXT,
            proximo_pago TEXT,
            servicio_activo INTEGER DEFAULT 1,
            cancelacion_programada TEXT,
            fecha_inicio TEXT,
            fecha_fin TEXT,
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

    await ensureFacturasServicioTable();
    await ensureAdminsTable();
    await ensurePagosTable();
    await ensureMensajesTable();
    await ensureMensajesReporteTable();
    await ensureMensajesAdministradorTable();
}

export async function ensurePagosTable() {
    const db = await openDb();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS pagos (
            id_pago INTEGER PRIMARY KEY AUTOINCREMENT,
            id_ficha INTEGER NOT NULL,                          -- FK a la ficha
            monto REAL NOT NULL,                                -- monto del pago
            estado_pago TEXT NOT NULL DEFAULT 'pendiente',      -- 'pendiente', 'aprobado', 'rechazado'
            fecha_pago TEXT NOT NULL,                           -- fecha del pago
            metodo_pago TEXT,                                   -- tipo de pago (transferencia, tarjeta, etc.)
            referencia_pago TEXT UNIQUE,                        -- referencia única para conciliación
            comentarios TEXT,                                   -- campo opcional para notas internas
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,      -- registro de cuando se creó el pago
            FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion (id_ficha) ON DELETE CASCADE
        );
`);
}

export async function ensureFacturasServicioTable() {
    const db = await openDb();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS facturas_servicio (
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
    `);
}

export async function ensureAdminsTable() {
    const db = await openDb();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `);
}

export async function ensureMensajesTable() {
    const db= await openDb();
    await db.exec(
        `
        CREATE TABLE IF NOT EXISTS mensajes (
            id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
            id_remitente INTEGER NOT NULL,
            id_destinatario INTEGER NOT NULL,
            id_ficha INTEGER, -- si el mensaje está relacionado con una ficha
            id_coincidencia INTEGER, -- opcional, para notificaciones de coincidencias
            tipo_mensaje TEXT NOT NULL DEFAULT 'chat', -- 'chat', 'notificacion', 'coincidencia'
            contenido TEXT NOT NULL,
            fecha_envio TEXT NOT NULL DEFAULT (datetime('now')),
            estado_leido INTEGER DEFAULT 0, -- 0 = no leído, 1 = leído
            FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion(id_ficha)
        );`
    )
}

export async function ensureMensajesReporteTable(){
    const db = await openDb();
    await db.exec(
        `CREATE TABLE IF NOT EXISTS mensajes_reporte (
            id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
            id_remitente INTEGER NOT NULL,
            id_destinatario INTEGER, -- opcional: admin asignado
            tipo_reporte TEXT DEFAULT 'general', -- 'hallazgo', 'sugerencia', 'error', etc.
            asunto TEXT,
            contenido TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'atendido'
            fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
            estado_leido INTEGER DEFAULT 0, -- para saber si el admin ya lo vio
            FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    );`
 );
}

export async function ensureMensajesAdministradorTable() {
    const db = await openDb();
    await db.exec(
        `
        CREATE TABLE IF NOT EXISTS mensajes_administrador (
            id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
            id_admin INTEGER, -- quien envía el mensaje (opcional)
            tipo_mensaje TEXT DEFAULT 'info', -- 'info', 'alerta', 'coincidencia'
            contenido TEXT NOT NULL,
            fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
            estado_leido INTEGER DEFAULT 0 -- permite marcar si un usuario lo vio
        );`
    );
}