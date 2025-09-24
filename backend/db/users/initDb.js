import pg from 'pg';
import logger from '../../utils/logger.js';
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
    { nombre: "cabello", categoria: "Cabeza" },
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
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ✅ AÑADE ESTA NUEVA FUNCIÓN EN SU LUGAR
/**
 * Ejecuta una consulta a la base de datos usando un cliente del pool.
 * Esta función centraliza toda la lógica de consultas.
 * @param {string} text - La consulta SQL con placeholders ($1, $2, etc.).
 * @param {Array} params - Los valores para los placeholders.
 * @returns {Promise<QueryResult>} El resultado de la consulta de node-postgres.
 */
export const query = (text, params) => {
    return pool.query(text, params);
};

// --- Función auxiliar para verificar si una columna ya existe ---
async function columnExists(client, tableName, columnName) {
    const res = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    `, [tableName.toLowerCase(), columnName.toLowerCase()]);
    return res.rowCount > 0;
}

// --- Función auxiliar para actualizar usuarios sin número de referencia ---
async function actualizarUsuariosSinReferencia(client) {
    logger.info("🔄 Verificando usuarios sin número de referencia...");
    const usersToUpdateResult = await client.query('SELECT id FROM users WHERE numero_referencia_unico IS NULL');
    const usersToUpdate = usersToUpdateResult.rows;

    if (usersToUpdate.length === 0) {
        logger.info("✅ Todos los usuarios ya tienen un número de referencia.");
        return;
    }

    logger.info(`⏳ Encontrados ${usersToUpdate.length} usuarios para actualizar.`);

    const generarNumeroUnico = async () => {
        let isUnique = false;
        let referenceNumber;
        while (!isUnique) {
            referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();
            const res = await client.query('SELECT id FROM users WHERE numero_referencia_unico = $1', [referenceNumber]);
            if (res.rowCount === 0) isUnique = true;
        }
        return referenceNumber;
    };

    for (const user of usersToUpdate) {
        const numeroUnico = await generarNumeroUnico();
        await client.query('UPDATE users SET numero_referencia_unico = $1 WHERE id = $2', [numeroUnico, user.id]);
        logger.info(` -> Actualizado usuario ID ${user.id} con referencia ${numeroUnico}`);
    }
    logger.info("✅ Actualización de usuarios sin referencia completada.");
}


// ======================
// 3. Creación y verificación de TODAS las tablas
// ======================
export async function ensureAllTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // --- Tabla de Usuarios ---
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                telefono TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT,
                plan TEXT DEFAULT '["trial"]',
                trial_start_date TIMESTAMPTZ,
                razon_social_servicio TEXT,
                rfc_servicio TEXT,
                uso_cfdi_servicio TEXT,
                email_fiscal_servicio TEXT,
                cp_fiscal_servicio TEXT,
                email_confirmed INTEGER DEFAULT 0,
                confirmation_token TEXT,
                reset_token TEXT,
                reset_token_expiration TIMESTAMPTZ,
                role TEXT DEFAULT 'user',
                cancelado INTEGER DEFAULT 0,
                cancelacion_efectiva TIMESTAMPTZ,
                acepto_terminos BOOLEAN NOT NULL DEFAULT false,
                fecha_aceptacion DATE,
                version_terminos TEXT,
                user_state TEXT,
                estado_republica TEXT,
                ultima_conexion TIMESTAMPTZ,
                numero_referencia_unico TEXT,
                fichas_activas_pagadas INTEGER NOT NULL DEFAULT 0,
                estado_suscripcion TEXT NOT NULL DEFAULT 'inactivo',
                simplika_referral_code TEXT,
                simplika_referral_status TEXT NOT NULL DEFAULT 'inactivo'
            );
        `);
        await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_numero_referencia_unico ON users(numero_referencia_unico);');
        await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_simplika_referral_code ON users(simplika_referral_code);');
        await actualizarUsuariosSinReferencia(client);

        // --- Tablas de Servicio y Cancelaciones ---
        await client.query(`
            CREATE TABLE IF NOT EXISTS estado_servicio (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                trial_end_date TIMESTAMPTZ,
                proximo_pago TIMESTAMPTZ,
                servicio_activo BOOLEAN DEFAULT true,
                cancelacion_programada TIMESTAMPTZ,
                fecha_inicio DATE,
                fecha_fin DATE
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS cancelaciones (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                motivo TEXT,
                fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
                estado TEXT DEFAULT 'pendiente'
            );
        `);

        // --- Tablas de Fichas, Hallazgos y Catálogos ---
        await client.query(`CREATE TABLE IF NOT EXISTS ubicaciones (id_ubicacion SERIAL PRIMARY KEY, estado TEXT NOT NULL, municipio TEXT NOT NULL, localidad TEXT, calle TEXT, referencias TEXT, latitud REAL, longitud REAL, codigo_postal TEXT);`);
        await client.query(`CREATE TABLE IF NOT EXISTS catalogo_tipo_lugar (id_tipo_lugar SERIAL PRIMARY KEY, nombre_tipo TEXT NOT NULL UNIQUE);`);
        await client.query(`CREATE TABLE IF NOT EXISTS catalogo_partes_cuerpo (id_parte_cuerpo SERIAL PRIMARY KEY, nombre_parte TEXT NOT NULL UNIQUE, categoria_principal TEXT NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS catalogo_prendas (id_prenda SERIAL PRIMARY KEY, tipo_prenda TEXT NOT NULL UNIQUE, categoria_general TEXT NOT NULL);`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS fichas_desaparicion (
                id_ficha SERIAL PRIMARY KEY,
                id_usuario_creador INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                nombre TEXT NOT NULL, segundo_nombre TEXT, apellido_paterno TEXT NOT NULL, apellido_materno TEXT,
                fecha_desaparicion DATE NOT NULL,
                id_ubicacion_desaparicion INTEGER REFERENCES ubicaciones(id_ubicacion) ON DELETE SET NULL,
                id_tipo_lugar_desaparicion INTEGER REFERENCES catalogo_tipo_lugar(id_tipo_lugar) ON DELETE SET NULL,
                foto_perfil TEXT,
                estado_ficha TEXT NOT NULL DEFAULT 'activa',
                fecha_registro_encontrado TIMESTAMPTZ,
                estado_pago TEXT NOT NULL DEFAULT 'pendiente'
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS ficha_rasgos_fisicos (
                id_rasgo SERIAL PRIMARY KEY,
                id_ficha INTEGER NOT NULL REFERENCES fichas_desaparicion(id_ficha) ON DELETE CASCADE,
                id_parte_cuerpo INTEGER NOT NULL REFERENCES catalogo_partes_cuerpo(id_parte_cuerpo),
                tipo_rasgo TEXT NOT NULL,
                descripcion_detalle TEXT
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS ficha_vestimenta (
                id_vestimenta SERIAL PRIMARY KEY,
                id_ficha INTEGER NOT NULL REFERENCES fichas_desaparicion(id_ficha) ON DELETE CASCADE,
                id_prenda INTEGER REFERENCES catalogo_prendas(id_prenda),
                color TEXT, marca TEXT, caracteristica_especial TEXT
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS hallazgos (
                id_hallazgo SERIAL PRIMARY KEY,
                id_usuario_buscador INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                id_ubicacion_hallazgo INTEGER REFERENCES ubicaciones(id_ubicacion) ON DELETE SET NULL,
                id_tipo_lugar_hallazgo INTEGER REFERENCES catalogo_tipo_lugar(id_tipo_lugar) ON DELETE SET NULL,
                nombre TEXT NOT NULL, segundo_nombre TEXT, apellido_paterno TEXT NOT NULL, apellido_materno TEXT,
                fecha_hallazgo DATE NOT NULL,
                descripcion_general_hallazgo TEXT,
                estado_hallazgo TEXT NOT NULL DEFAULT 'encontrado'
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS hallazgo_caracteristicas (
                id_hallazgo_caracteristica SERIAL PRIMARY KEY,
                id_hallazgo INTEGER NOT NULL REFERENCES hallazgos(id_hallazgo) ON DELETE CASCADE,
                id_parte_cuerpo INTEGER REFERENCES catalogo_partes_cuerpo(id_parte_cuerpo),
                id_prenda INTEGER REFERENCES catalogo_prendas(id_prenda),
                tipo_caracteristica TEXT,
                descripcion TEXT
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS hallazgo_vestimenta (
                id_hallazgo_vestimenta SERIAL PRIMARY KEY,
                id_hallazgo INTEGER NOT NULL REFERENCES hallazgos(id_hallazgo) ON DELETE CASCADE,
                id_prenda INTEGER REFERENCES catalogo_prendas(id_prenda),
                color TEXT, marca TEXT, caracteristica_especial TEXT
            );
        `);
        
        // --- Tablas de Coincidencias, Pagos, etc. ---
        await client.query(`CREATE TABLE IF NOT EXISTS coincidencias_confirmadas (id_coincidencia SERIAL PRIMARY KEY, id_ficha INTEGER NOT NULL REFERENCES fichas_desaparicion(id_ficha), id_hallazgo INTEGER NOT NULL REFERENCES hallazgos(id_hallazgo), fecha_coincidencia TIMESTAMPTZ NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS posibles_coincidencias (id_posible_coincidencia SERIAL PRIMARY KEY, id_ficha INTEGER NOT NULL REFERENCES fichas_desaparicion(id_ficha), id_hallazgo INTEGER NOT NULL REFERENCES hallazgos(id_hallazgo), puntaje INTEGER NOT NULL, criterios_match TEXT, fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(), estado_revision TEXT NOT NULL DEFAULT 'pendiente', comentarios_admin TEXT);`);
        await client.query(`CREATE TABLE IF NOT EXISTS pagos (id_pago SERIAL PRIMARY KEY, id_ficha INTEGER NOT NULL REFERENCES fichas_desaparicion(id_ficha) ON DELETE CASCADE, monto REAL NOT NULL, estado_pago TEXT NOT NULL DEFAULT 'pendiente', fecha_pago DATE NOT NULL, metodo_pago TEXT, referencia_pago TEXT UNIQUE, comentarios TEXT, fecha_creacion TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS facturas_servicio (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(), monto INTEGER, periodo TEXT, descripcion TEXT, fecha_pago TIMESTAMPTZ, metodo_pago TEXT, estatus TEXT);`);
        await client.query(`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, nombre TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL);`);
        await client.query(`CREATE TABLE IF NOT EXISTS conversations (id SERIAL PRIMARY KEY, user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL DEFAULT 'personal', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_message_at TIMESTAMPTZ);`);
        await client.query(`CREATE TABLE IF NOT EXISTS mensajes (id_mensaje SERIAL PRIMARY KEY, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, id_remitente INTEGER NOT NULL REFERENCES users(id), id_destinatario INTEGER NOT NULL REFERENCES users(id), id_ficha INTEGER REFERENCES fichas_desaparicion(id_ficha), id_coincidencia INTEGER, tipo_mensaje TEXT NOT NULL DEFAULT 'chat', contenido TEXT NOT NULL, fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(), estado_leido INTEGER DEFAULT 0);`);
        await client.query(`CREATE TABLE IF NOT EXISTS mensajes_reporte (id_reporte SERIAL PRIMARY KEY, conversation_id INTEGER REFERENCES conversations(id), id_reportador INTEGER NOT NULL REFERENCES users(id), id_reportado INTEGER NOT NULL REFERENCES users(id), motivo TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente', fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS mensajes_administrador (id_mensaje SERIAL PRIMARY KEY, id_admin INTEGER, titulo TEXT NOT NULL, tipo_mensaje TEXT DEFAULT 'info', contenido TEXT NOT NULL, fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(), estado_leido INTEGER DEFAULT 0, estado TEXT DEFAULT 'activo');`);
        await client.query(`CREATE TABLE IF NOT EXISTS notificaciones (id_notificacion SERIAL PRIMARY KEY, id_usuario_destinatario INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, tipo TEXT NOT NULL, contenido TEXT NOT NULL, url_destino TEXT, estado TEXT NOT NULL DEFAULT 'no_leido', fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW());`);

        // --- Lógica para añadir columnas dinámicamente si faltan ---
        const columnsToAdd = {
            fichas_desaparicion: [{ name: 'edad_estimada', type: 'INTEGER' }, { name: 'genero', type: 'TEXT' }, { name: 'estatura', type: 'REAL' }, { name: 'complexion', type: 'TEXT' }, { name: 'peso', type: 'REAL' }],
            hallazgos: [{ name: 'edad_estimada', type: 'INTEGER' }, { name: 'genero', type: 'TEXT' }, { name: 'estatura', type: 'REAL' }, { name: 'complexion', type: 'TEXT' }, { name: 'peso', type: 'REAL' }, { name: 'foto_hallazgo', type: 'TEXT' }]
        };
        for (const tableName in columnsToAdd) {
            for (const col of columnsToAdd[tableName]) {
                if (!(await columnExists(client, tableName, col.name))) {
                    logger.info(`➕ Agregando columna '${col.name}' a la tabla ${tableName}...`);
                    await client.query(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`);
                }
            }
        }
        
        await client.query('COMMIT');
        logger.info("✔️ Todas las tablas verificadas/creadas correctamente en PostgreSQL.");
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error("❌ Error al asegurar las tablas:", e);
        throw e;
    } finally {
        client.release();
    }
}

// ======================
// 4. Inserción de catálogos (Seed)
// ======================
export async function insertCatalogos() {
    // Definimos los catálogos aquí para que sean autocontenidos
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
    { nombre: "cabello", categoria: "Cabeza" },
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
    
    const client = await openDb().connect();
    logger.info("⏳ Iniciando seed de catálogos…");
    try {
        await client.query("BEGIN");

        // Usamos ON CONFLICT DO NOTHING para evitar duplicados de forma eficiente
        for (const tipo of TIPOS_LUGAR) {
            await client.query('INSERT INTO catalogo_tipo_lugar (nombre_tipo) VALUES ($1) ON CONFLICT (nombre_tipo) DO NOTHING', [tipo.nombre]);
        }
        for (const parte of PARTES_CUERPO) {
            await client.query('INSERT INTO catalogo_partes_cuerpo (nombre_parte, categoria_principal) VALUES ($1, $2) ON CONFLICT (nombre_parte) DO NOTHING', [parte.nombre, parte.categoria]);
        }
        for (const prenda of PRENDAS) {
            await client.query('INSERT INTO catalogo_prendas (tipo_prenda, categoria_general) VALUES ($1, $2) ON CONFLICT (tipo_prenda) DO NOTHING', [prenda.tipo, prenda.cat]);
        }

        await client.query("COMMIT");
        logger.info("✅ Seed de catálogos finalizado correctamente.");
    } catch (err) {
        await client.query("ROLLBACK");
        logger.error("💥 Error durante el seed de catálogos:", err);
        throw err;
    } finally {
        client.release();
    }
}

