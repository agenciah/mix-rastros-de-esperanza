import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let dbInstance = null;

// ======================
// 1. Catálogos: Listas de datos
// ======================
const TIPOS_LUGAR = [
  { nombre: "Vía pública", categoria: null },
  { nombre: "Domicilio particular", categoria: null },
  { nombre: "Trabajo", categoria: null },
  { nombre: "Escuela", categoria: null },
  { nombre: "Hospital / Clínica", categoria: null },
  { nombre: "SEMEFO / Servicio Médico Forense", categoria: null },
  { nombre: "Estación de policía", categoria: null },
  { nombre: "Centro de reclusión", categoria: null },
  { nombre: "Refugio / Albergue", categoria: null },
  { nombre: "Centro de transporte (aeropuerto, estación de autobuses)", categoria: null },
  { nombre: "Parque / Área verde", categoria: null },
  { nombre: "Zona rural / Campo", categoria: null },
  { nombre: "Playa / Costa", categoria: null },
  { nombre: "Centro comercial / Plaza", categoria: null },
  { nombre: "Hotel / Motel", categoria: null },
  { nombre: "Bodega / Nave", categoria: null },
  { nombre: "Centro comunitario", categoria: null },
  { nombre: "Iglesia / Templo", categoria: null },
  { nombre: "Carretera / Autopista", categoria: null },
  { nombre: "Terminal marítima / Puerto", categoria: null },
  { nombre: "Otro", categoria: null },
];

const PARTES_CUERPO = [
    { nombre: "Frente", categoria: "Cabeza" },
    { nombre: "Pelo", categoria: "Cabeza" },
    { nombre: "Cejas", categoria: "Cabeza" },
    { nombre: "Ojos", categoria: "Cabeza" },
    { nombre: "Párpados", categoria: "Cabeza" },
    { nombre: "Nariz", categoria: "Cabeza" },
    { nombre: "Tabique nasal", categoria: "Cabeza" },
    { nombre: "Pómulos", categoria: "Cabeza" },
    { nombre: "Orejas", categoria: "Cabeza" },
    { nombre: "Pabellón auricular", categoria: "Cabeza" },
    { nombre: "Mandíbula", categoria: "Cabeza" },
    { nombre: "Mentón", categoria: "Cabeza" },
    { nombre: "Boca", categoria: "Boca" },
    { nombre: "Labios", categoria: "Boca" },
    { nombre: "Dientes", categoria: "Boca" },
    { nombre: "Lengua", categoria: "Boca" },
    { nombre: "Encías", categoria: "Boca" },
    { nombre: "Mejillas", categoria: "Boca" },
    { nombre: "Paladar", categoria: "Boca" },
    { nombre: "Cuello", categoria: "Cuello y Torso" },
    { nombre: "Clavículas", categoria: "Cuello y Torso" },
    { nombre: "Hombros", categoria: "Cuello y Torso" },
    { nombre: "Pecho / Tórax", categoria: "Cuello y Torso" },
    { nombre: "Abdomen", categoria: "Cuello y Torso" },
    { nombre: "Espalda", categoria: "Cuello y Torso" },
    { nombre: "Cintura", categoria: "Cuello y Torso" },
    { nombre: "Ombligo", categoria: "Cuello y Torso" },
    { nombre: "Caderas", categoria: "Cuello y Torso" },
    { nombre: "Brazo", categoria: "Brazos y Manos" },
    { nombre: "Codo", categoria: "Brazos y Manos" },
    { nombre: "Antebrazo", categoria: "Brazos y Manos" },
    { nombre: "Muñeca", categoria: "Brazos y Manos" },
    { nombre: "Mano", categoria: "Brazos y Manos" },
    { nombre: "Palma de la mano", categoria: "Brazos y Manos" },
    { nombre: "Dorso de la mano", categoria: "Brazos y Manos" },
    { nombre: "Dedos de la mano", categoria: "Brazos y Manos" },
    { nombre: "Uñas de la mano", categoria: "Brazos y Manos" },
    { nombre: "brazo derecho", categoria: "Brazos y Manos" },
    { nombre: "brazo izquierdo", categoria: "Brazos y Manos" },
    { nombre: "Pierna", categoria: "Piernas y Pies" },
    { nombre: "Muslo", categoria: "Piernas y Pies" },
    { nombre: "Rodilla", categoria: "Piernas y Pies" },
    { nombre: "Pantorrilla", categoria: "Piernas y Pies" },
    { nombre: "Tobillo", categoria: "Piernas y Pies" },
    { nombre: "Pie", categoria: "Piernas y Pies" },
    { nombre: "Empeine", categoria: "Piernas y Pies" },
    { nombre: "Planta del pie", categoria: "Piernas y Pies" },
    { nombre: "Talón", categoria: "Piernas y Pies" },
    { nombre: "Dedos del pie", categoria: "Piernas y Pies" },
    { nombre: "Uñas del pie", categoria: "Piernas y Pies" },
    { nombre: "Piel", categoria: "Rasgos Generales" },
    { nombre: "Pecas", categoria: "Rasgos Generales" },
    { nombre: "Lunar", categoria: "Rasgos Generales" },
    { nombre: "Mancha de nacimiento", categoria: "Rasgos Generales" },
    { nombre: "Cicatriz", categoria: "Rasgos Generales" },
    { nombre: "Tatuaje", categoria: "Rasgos Generales" },
    { nombre: "Piercing", categoria: "Rasgos Generales" },
    { nombre: "Amputación", categoria: "Rasgos Generales" },
    { nombre: "Prótesis", categoria: "Rasgos Generales" },
    { nombre: "Gafas", categoria: "Rasgos Generales" },
    { nombre: "Bigote", categoria: "Rasgos Generales" },
    { nombre: "Barba", categoria: "Rasgos Generales" },
];

const PRENDAS = [
    { tipo: "Camisa", cat: "Prendas superiores" },
    { tipo: "Blusa", cat: "Prendas superiores" },
    { tipo: "Playera", cat: "Prendas superiores" },
    { tipo: "Sudadera", cat: "Prendas superiores" },
    { tipo: "Suéter", cat: "Prendas superiores" },
    { tipo: "Chamarra", cat: "Prendas superiores" },
    { tipo: "Chaleco", cat: "Prendas superiores" },
    { tipo: "Abrigo", cat: "Prendas superiores" },
    { tipo: "Chaqueta", cat: "Prendas superiores" },
    { tipo: "Camisa de vestir", cat: "Prendas superiores" },
    { tipo: "Top", cat: "Prendas superiores" },
    { tipo: "Pantalón", cat: "Prendas inferiores" },
    { tipo: "Pantalón de mezclilla", cat: "Prendas inferiores" },
    { tipo: "Shorts", cat: "Prendas inferiores" },
    { tipo: "Falda", cat: "Prendas inferiores" },
    { tipo: "Vestido", cat: "Prendas inferiores" },
    { tipo: "Jumpsuit", cat: "Prendas inferiores" },
    { tipo: "Leggings", cat: "Prendas inferiores" },
    { tipo: "Zapatos", cat: "Calzado" },
    { tipo: "Tenis", cat: "Calzado" },
    { tipo: "Botas", cat: "Calzado" },
    { tipo: "Sandalias", cat: "Calzado" },
    { tipo: "Zapatillas", cat: "Calzado" },
    { tipo: "Bufanda", cat: "Accesorios" },
    { tipo: "Gorra", cat: "Accesorios" },
    { tipo: "Sombrero", cat: "Accesorios" },
    { tipo: "Lentes de sol", cat: "Accesorios" },
    { tipo: "Cinturón", cat: "Accesorios" },
    { tipo: "Guantes", cat: "Accesorios" },
    { tipo: "Reloj", cat: "Accesorios" },
    { tipo: "Collar", cat: "Accesorios" },
    { tipo: "Pulsera", cat: "Accesorios" },
    { tipo: "Anillo", cat: "Accesorios" },
    { tipo: "Bolsa", cat: "Accesorios" },
    { tipo: "Mochila", cat: "Accesorios" },
    { tipo: "Pañuelo", cat: "Accesorios" },
    { tipo: "Aretes", cat: "Accesorios" },
    { tipo: "Impermeable", cat: "Ropa exterior" },
    { tipo: "Gabardina", cat: "Ropa exterior" },
    { tipo: "Rompevientos", cat: "Ropa exterior" },
    { tipo: "Ropa interior", cat: "Ropa interior" },
    { tipo: "Brasier", cat: "Ropa interior" },
    { tipo: "Calzón", cat: "Ropa interior" },
    { tipo: "Boxer", cat: "Ropa interior" },
    { tipo: "Calcetas", cat: "Ropa interior" },
    { tipo: "Calcetines", cat: "Ropa interior" },
    { tipo: "Traje de baño", cat: "Otros" },
    { tipo: "Uniforme escolar", cat: "Otros" },
    { tipo: "Uniforme laboral", cat: "Otros" },
];

// ======================
// 2. Conexión a la base de datos
// ======================
export async function openDb() {
    if (!dbInstance) {
        dbInstance = await open({
            filename: path.join(__dirname, 'gastos.db'),
            driver: sqlite3.Database
        });
    }
    return dbInstance;
}

// --- NUEVA FUNCIÓN AUXILIAR ---
// Esta función se encargará de actualizar los usuarios que no tienen un número de referencia.
async function actualizarUsuariosSinReferencia(db) {
    console.log("🔄 Verificando usuarios sin número de referencia...");
    const usersToUpdate = await db.all('SELECT id FROM users WHERE numero_referencia_unico IS NULL');
    
    if (usersToUpdate.length === 0) {
        console.log("✅ Todos los usuarios ya tienen un número de referencia.");
        return;
    }

    console.log(`⏳ Encontrados ${usersToUpdate.length} usuarios para actualizar.`);
    
    // Función para generar un número único (la movimos aquí para reutilizarla)
    const generarNumeroUnico = async () => {
        let isUnique = false;
        let referenceNumber;
        while (!isUnique) {
            referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();
            const existingUser = await db.get('SELECT id FROM users WHERE numero_referencia_unico = ?', [referenceNumber]);
            if (!existingUser) isUnique = true;
        }
        return referenceNumber;
    };

    for (const user of usersToUpdate) {
        const numeroUnico = await generarNumeroUnico();
        await db.run('UPDATE users SET numero_referencia_unico = ? WHERE id = ?', [numeroUnico, user.id]);
        console.log(`   -> Actualizado usuario ID ${user.id} con referencia ${numeroUnico}`);
    }
    console.log("✅ Actualización de usuarios completada.");
}

// ======================
// 3. Creación y verificación de TODAS las tablas
// ======================
    // Tablas de Usuarios y Se
export async function ensureAllTables() {
    const db = await openDb();

    // ---------------rvicios
    // ---------------
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

    // --- LÓGICA UNIFICADA PARA AÑADIR COLUMNAS ---
    const columnsToAdd = [
        { name: 'estado_republica', type: 'TEXT' },
        { name: 'ultima_conexion', type: 'TEXT' },
        { name: 'numero_referencia_unico', type: 'TEXT' },
        { name: 'fichas_activas_pagadas', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'estado_suscripcion', type: "TEXT NOT NULL DEFAULT 'inactivo'" },
        { name: 'reset_token', type: 'TEXT' },
        { name: 'reset_token_expiration', type: 'TEXT' },
        { name: 'acepto_terminos', type: 'BOOLEAN NOT NULL DEFAULT 0' },
        { name: 'fecha_aceptacion', type: 'TEXT' },
        { name: 'version_terminos', type: 'TEXT' },
        { name: 'user_state', type: 'TEXT' },
        { name: 'simplika_referral_code', type: 'TEXT' },
        { name: 'simplika_referral_status', type: "TEXT NOT NULL DEFAULT 'inactivo'" }
    ];

    const existingColumns = await db.all(`PRAGMA table_info(users);`);
    const existingColumnNames = existingColumns.map(col => col.name);

    for (const col of columnsToAdd) {
        if (!existingColumnNames.includes(col.name)) {
            console.log(`➕ Agregando columna '${col.name}' a la tabla users...`);
            await db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
        }
    }
    
    // --- LLAMADA A LA FUNCIÓN DE ACTUALIZACIÓN ---
    // Esto asegura que los usuarios ya existentes reciban su número de referencia.
    await actualizarUsuariosSinReferencia(db);

    // --- CREACIÓN DE ÍNDICES ÚNICOS ---
    // Esta es la forma segura de garantizar la unicidad en columnas existentes.
    await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_numero_referencia_unico
        ON users(numero_referencia_unico);
    `);
    await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_simplika_referral_code
        ON users(simplika_referral_code);
    `);

    // --- AQUÍ CONTINÚA EL RESTO DE TUS CREATE TABLE ---

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

    // ---------------
    // Tablas de Fichas y Hallazgos
    // ---------------
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
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS catalogo_tipo_lugar (
        id_tipo_lugar INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_tipo TEXT NOT NULL UNIQUE
      );
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS catalogo_partes_cuerpo (
        id_parte_cuerpo INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_parte TEXT NOT NULL UNIQUE,
        categoria_principal TEXT NOT NULL
      );
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS catalogo_prendas (
        id_prenda INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo_prenda TEXT NOT NULL UNIQUE,
        categoria_general TEXT NOT NULL
      );
    `);
    
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
        FOREIGN KEY (id_usuario_creador) REFERENCES users (id),
        FOREIGN KEY (id_ubicacion_desaparicion) REFERENCES ubicaciones (id_ubicacion),
        FOREIGN KEY (id_tipo_lugar_desaparicion) REFERENCES catalogo_tipo_lugar (id_tipo_lugar)
      );
    `);

    // Tabla para las características de la FICHA (la persona desaparecida)
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
    `);

    // Esta tabla es para la vestimenta de la FICHA (la persona desaparecida)
    await db.exec(`
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
    `);
    
    // Tabla para los hallazgos (lo que se encontró)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS hallazgos (
        id_hallazgo INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario_buscador INTEGER NOT NULL,
        id_ubicacion_hallazgo INTEGER,
        id_tipo_lugar_hallazgo INTEGER,
        nombre TEXT NOT NULL,
        segundo_nombre TEXT,
        apellido_paterno TEXT NOT NULL,
        apellido_materno TEXT,
        fecha_hallazgo TEXT NOT NULL,
        descripcion_general_hallazgo TEXT,
        estado_hallazgo TEXT NOT NULL DEFAULT 'encontrado',
        FOREIGN KEY (id_usuario_buscador) REFERENCES users (id),
        FOREIGN KEY (id_ubicacion_hallazgo) REFERENCES ubicaciones (id_ubicacion),
        FOREIGN KEY (id_tipo_lugar_hallazgo) REFERENCES catalogo_tipo_lugar (id_tipo_lugar)
      );
    `);
    
    // TABLA FALTANTE: Rasgos físicos del hallazgo. Esta es la que resuelve el error.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS hallazgo_caracteristicas (
        id_hallazgo_caracteristica INTEGER PRIMARY KEY AUTOINCREMENT,
        id_hallazgo INTEGER NOT NULL,
        id_parte_cuerpo INTEGER,
        id_prenda INTEGER,
        tipo_caracteristica TEXT,
        descripcion TEXT,
        FOREIGN KEY (id_hallazgo) REFERENCES hallazgos (id_hallazgo) ON DELETE CASCADE,
        FOREIGN KEY (id_parte_cuerpo) REFERENCES catalogo_partes_cuerpo (id_parte_cuerpo),
        FOREIGN KEY (id_prenda) REFERENCES catalogo_prendas (id_prenda)
      );
    `);

    // TABLA YA EXISTENTE: Vestimenta del hallazgo
    await db.exec(`
      CREATE TABLE IF NOT EXISTS hallazgo_vestimenta (
        id_hallazgo_vestimenta INTEGER PRIMARY KEY AUTOINCREMENT,
        id_hallazgo INTEGER NOT NULL,
        id_prenda INTEGER,
        color TEXT,
        marca TEXT,
        caracteristica_especial TEXT,
        FOREIGN KEY (id_hallazgo) REFERENCES hallazgos (id_hallazgo),
        FOREIGN KEY (id_prenda) REFERENCES catalogo_prendas (id_prenda)
      );
    `);

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

    await db.exec(`
    CREATE TABLE IF NOT EXISTS posibles_coincidencias (
      id_posible_coincidencia INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ficha INTEGER NOT NULL,
      id_hallazgo INTEGER NOT NULL,
      puntaje INTEGER NOT NULL,
      criterios_match TEXT,
      fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
      estado_revision TEXT NOT NULL DEFAULT 'pendiente',
      comentarios_admin TEXT,
      FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion (id_ficha),
      FOREIGN KEY (id_hallazgo) REFERENCES hallazgos (id_hallazgo)
    );
`);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pagos (
        id_pago INTEGER PRIMARY KEY AUTOINCREMENT,
        id_ficha INTEGER NOT NULL,
        monto REAL NOT NULL,
        estado_pago TEXT NOT NULL DEFAULT 'pendiente',
        fecha_pago TEXT NOT NULL,
        metodo_pago TEXT,
        referencia_pago TEXT UNIQUE,
        comentarios TEXT,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion (id_ficha) ON DELETE CASCADE
      );
    `);
    
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

    await db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

     await db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'personal',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_message_at TEXT, -- ¡AQUÍ ESTÁ LA COLUMNA!
        FOREIGN KEY (user1_id) REFERENCES users(id),
        FOREIGN KEY (user2_id) REFERENCES users(id)
    );
`);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mensajes (
        id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        id_remitente INTEGER NOT NULL,
        id_destinatario INTEGER NOT NULL,
        id_ficha INTEGER,
        id_coincidencia INTEGER,
        tipo_mensaje TEXT NOT NULL DEFAULT 'chat',
        contenido TEXT NOT NULL,
        fecha_envio TEXT NOT NULL DEFAULT (datetime('now')),
        estado_leido INTEGER DEFAULT 0,
        FOREIGN KEY (id_remitente) REFERENCES users(id),
        FOREIGN KEY (id_destinatario) REFERENCES users(id),
        FOREIGN KEY (id_ficha) REFERENCES fichas_desaparicion(id_ficha),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );`
    );
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mensajes_reporte (
        id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
        id_remitente INTEGER NOT NULL,
        id_destinatario INTEGER,
        tipo_reporte TEXT DEFAULT 'general',
        asunto TEXT,
        contenido TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente',
        fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
        estado_leido INTEGER DEFAULT 0,
        FOREIGN KEY (id_remitente) REFERENCES users(id)
      );`
    );
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mensajes_administrador (
        id_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
        id_admin INTEGER,
        titulo TEXT NOT NULL,
        tipo_mensaje TEXT DEFAULT 'info',
        contenido TEXT NOT NULL,
        fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
        estado_leido INTEGER DEFAULT 0
      );`
    );

// ---------------------------------
// Alteraciones para agregar campos clave a Fichas
// ---------------------------------
const fichaNewColumns = [
    { name: 'edad_estimada', type: 'INTEGER' },
    { name: 'genero', type: 'TEXT' },
    { name: 'estatura', type: 'REAL' },
    { name: 'complexion', type: 'TEXT' },
    { name: 'peso', type: 'REAL' } // Agregado de nuevo
];

const fichaExistingColumns = await db.all(`PRAGMA table_info(fichas_desaparicion);`);
const fichaExistingColumnNames = fichaExistingColumns.map(col => col.name);

for (const col of fichaNewColumns) {
    if (!fichaExistingColumnNames.includes(col.name)) {
        console.log(`➕ Agregando columna '${col.name}' a la tabla fichas_desaparicion...`);
        await db.exec(`ALTER TABLE fichas_desaparicion ADD COLUMN ${col.name} ${col.type};`);
    }
}

// ---------------------------------
// Alteraciones para agregar campos clave a Hallazgos
// ---------------------------------
const hallazgoNewColumns = [
    { name: 'edad_estimada', type: 'INTEGER' },
    { name: 'genero', type: 'TEXT' },
    { name: 'estatura', type: 'REAL' },
    { name: 'complexion', type: 'TEXT' },
    { name: 'peso', type: 'REAL' } // Agregado de nuevo
];

const hallazgoExistingColumns = await db.all(`PRAGMA table_info(hallazgos);`);
const hallazgoExistingColumnNames = hallazgoExistingColumns.map(col => col.name);

for (const col of hallazgoNewColumns) {
    if (!hallazgoExistingColumnNames.includes(col.name)) {
        console.log(`➕ Agregando columna '${col.name}' a la tabla hallazgos...`);
        await db.exec(`ALTER TABLE hallazgos ADD COLUMN ${col.name} ${col.type};`);
    }
}

    console.log("✔️ Todas las tablas verificadas/creadas correctamente");
}

// ======================
// 4. Inserción de catálogos (Seed)
// ======================
export async function insertCatalogos() {
    const db = await openDb();

    console.log("⏳ Iniciando seed de catálogos…");
    await db.exec("BEGIN");

    try {
        // TIPOS DE LUGAR
        let insTipos = 0;
        for (const tipoObj of TIPOS_LUGAR) {
            const res = await db.run(
                `INSERT OR IGNORE INTO catalogo_tipo_lugar (nombre_tipo) VALUES (?)`,
                tipoObj.nombre
            );
            if (res.changes) insTipos += res.changes;
        }
        console.log(`📍 Tipos de lugar: +${insTipos} insertados, ${TIPOS_LUGAR.length - insTipos} ya existían`);

        // PARTES DEL CUERPO
        let insPartes = 0;
        for (const { nombre, categoria } of PARTES_CUERPO) {
            const res = await db.run(
                `INSERT OR IGNORE INTO catalogo_partes_cuerpo (nombre_parte, categoria_principal) VALUES (?, ?)`,
                nombre,
                categoria
            );
            if (res.changes) insPartes += res.changes;
        }
        console.log(`🧍 Partes del cuerpo: +${insPartes} insertadas, ${PARTES_CUERPO.length - insPartes} ya existían`);

        // PRENDAS
        let insPrendas = 0;
        for (const { tipo, cat } of PRENDAS) {
            const res = await db.run(
                `INSERT OR IGNORE INTO catalogo_prendas (tipo_prenda, categoria_general) VALUES (?, ?)`,
                tipo,
                cat
            );
            if (res.changes) insPrendas += res.changes;
        }
        console.log(`👕 Prendas: +${insPrendas} insertadas, ${PRENDAS.length - insPrendas} ya existían`);

        await db.exec("COMMIT");
        console.log("✅ Seed de catálogos finalizado correctamente.");

        // Obtener todos los registros con IDs para retorno
        const tiposLugar = await db.all(`SELECT * FROM catalogo_tipo_lugar`);
        const partesCuerpo = await db.all(`SELECT * FROM catalogo_partes_cuerpo`);
        const prendas = await db.all(`SELECT * FROM catalogo_prendas`);

        return {
            tiposLugar,
            partesCuerpo,
            prendas,
        };

    } catch (err) {
        console.error("💥 Error durante el seed de catálogos:", err);
        await db.exec("ROLLBACK");
        throw err;
    }
}