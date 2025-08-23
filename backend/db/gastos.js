// 📁 /backend/db/gastos.js
/**
 * @fileoverview Funciones para interactuar con la tabla de 'gastos' en la base de datos SQLite.
 * Proporciona métodos para registrar nuevos gastos, utilizados tanto por la plataforma web
 * como por el bot de WhatsApp.
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import logger from '../utils/logger.js';

const dbPromise = open({
    filename: './db/gastos.db',
    driver: sqlite3.Database
});

/**
 * Asegura que la tabla de 'gastos' exista y que contenga las columnas necesarias.
 * Se ejecuta al iniciar la aplicación.
 */
async function ensureGastosTable() {
    const db = await dbPromise;

    await db.exec(`
        CREATE TABLE IF NOT EXISTS gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            descripcion TEXT,
            monto REAL,
            fecha TEXT,
            tipo TEXT,
            tipo_gasto TEXT,
            contenido TEXT,
            imagen_url TEXT,
            es_facturable INTEGER DEFAULT 0,
            ya_facturado BOOLEAN DEFAULT 0,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            raw_ocr_text TEXT,
            forma_pago TEXT,
            categoria TEXT,
            notas TEXT,
            uso_cfdi TEXT
        )
    `);

    const columns = await db.all(`PRAGMA table_info(gastos)`);
    const columnNames = columns.map(col => col.name);

    // Lista de columnas que deben existir en la tabla
    const requiredColumns = [
        { name: 'es_facturable', type: 'INTEGER DEFAULT 0' },
        { name: 'ya_facturado', type: 'BOOLEAN DEFAULT 0' },
        { name: 'forma_pago', type: 'TEXT' },
        { name: 'categoria', type: 'TEXT' },
        { name: 'notas', type: 'TEXT' },
        { name: 'raw_ocr_text', type: 'TEXT' },
        { name: 'uso_cfdi', type: 'TEXT' } // ✅ Campo agregado
    ];

    for (const col of requiredColumns) {
        if (!columnNames.includes(col.name)) {
            const query = `ALTER TABLE gastos ADD COLUMN ${col.name} ${col.type}`;
            await db.exec(query);
            logger.info(`🛠️ Columna añadida a la tabla 'gastos': ${col.name}`);
        }
    }
}

// Aseguramos que la tabla esté lista al iniciar la aplicación.
ensureGastosTable();


/**
 * Registra un nuevo gasto en la base de datos SQLite.
 *
 * @param {string} userId - El ID único del usuario.
 * @param {object} gastoData - Los datos del gasto, que incluyen:
 * @param {string} gastoData.monto - El monto total del gasto.
 * @param {string} gastoData.descripcion - El nombre del establecimiento o concepto.
 * @param {string} gastoData.fecha - La fecha del gasto en formato DD/MM/AAAA.
 * @param {string} [gastoData.imagen_url] - Opcional, URL de la imagen del ticket si el gasto se registró con una foto.
 * @param {string} [gastoData.raw_ocr_text] - Opcional, texto crudo extraído por el OCR.
 * @param {boolean} [gastoData.es_facturable] - Opcional, para marcarlo como facturable.
 * @param {string} [gastoData.forma_pago] - Opcional, forma de pago.
 * @param {string} [gastoData.uso_cfdi] - Opcional, uso del CFDI.
 * @returns {Promise<number>} El ID del nuevo gasto creado.
 */
export async function createGasto(userId, gastoData) {
    const db = await dbPromise;
    const fecha_creacion = new Date().toISOString();

    logger.info(`[db/gastos] 💾 Intentando crear un nuevo gasto para el usuario ${userId}...`);
    logger.debug(`[db/gastos] Datos recibidos: ${JSON.stringify(gastoData)}`);

    try {
        const result = await db.run(
            `INSERT INTO gastos (
                user_id, descripcion, monto, fecha, tipo, tipo_gasto,
                es_facturable, imagen_url, fecha_creacion, forma_pago, categoria, notas,
                raw_ocr_text, uso_cfdi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                gastoData.descripcion, // ✅ Se usa la propiedad correcta del objeto
                parseFloat(gastoData.monto), // ✅ Se usa la propiedad correcta
                gastoData.fecha, // ✅ Se usa la propiedad correcta
                'gasto',
                'no_categorizado',
                gastoData.es_facturable ? 1 : 0, // ✅ Se usa la propiedad correcta
                gastoData.imagen_url || null, // ✅ Se usa la propiedad correcta
                fecha_creacion,
                gastoData.forma_pago || 'desconocida', // ✅ Se usa la propiedad correcta
                'sin_categoria',
                null,
                gastoData.raw_ocr_text || null, // ✅ Se usa la propiedad correcta
                gastoData.uso_cfdi || null // ✅ Se usa la propiedad correcta
            ]
        );

        logger.info(`[db/gastos] ✅ Gasto creado exitosamente con ID: ${result.lastID}`);
        return result.lastID;
    } catch (error) {
        logger.error(`[db/gastos] ❌ Fallo en la función createGasto:`, error);
        throw error;
    }
}

// Contar cuántos gastos ha registrado el usuario
export async function countUserGastos(userId) {
    await ensureGastosTable();
    const db = await dbPromise;
    const result = await db.get(`SELECT COUNT(*) AS total FROM gastos WHERE user_id = ?`, [userId]);
    return result?.total || 0;
}

// Obtener todos los gastos de un usuario (opcional, útil para reportes)
export async function getGastosByUserId(user_id) {
    const db = await dbPromise;
    return db.all(
        `SELECT * FROM gastos WHERE user_id = ? ORDER BY fecha DESC`,
        [user_id]
    );
}

// Marcar un gasto como facturable (es_facturable = 1)
export async function marcarGastoComoFacturable(gastoId) {
    await ensureGastosTable();
    const db = await dbPromise;
    await db.run(
        `UPDATE gastos SET es_facturable = 1 WHERE id = ?`,
        [gastoId]
    );
}

// Desmarcar un gasto como facturable (es_facturable = 0)
export async function desmarcarGastoComoFacturable(gastoId) {
    await ensureGastosTable();
    const db = await dbPromise;
    await db.run(
        `UPDATE gastos SET es_facturable = 0 WHERE id = ?`,
        [gastoId]
    );
}

export async function getFacturablesByUserId(userId) {
    await ensureGastosTable();
    const db = await dbPromise;
    return db.all(
        `SELECT * FROM gastos WHERE user_id = ? AND es_facturable = 1 ORDER BY fecha_creacion DESC`,
        [userId]
    );
}

export async function countFacturablesLast30Days(user_id) {
    const db = await dbPromise;
    return db.get(
        `SELECT COUNT(*) AS total
         FROM gastos
         WHERE user_id = ?
           AND es_facturable = 1
           AND fecha_creacion >= datetime('now', '-30 days')`,
        [user_id]
    );
}


export async function deleteGastoById(userId, gastoId) {
    const db = await dbPromise;
    const result = await db.run(
        `DELETE FROM gastos WHERE id = ? AND user_id = ?`,
        [gastoId, userId]
    );
    return result;
}

export async function updateGastoById(userId, gastoId, data) {
    const db = await dbPromise;

    const {
        descripcion,
        monto,
        fecha,
        es_facturable = false,
        ya_facturado = false,
        forma_pago = '',
        categoria = '',
        notas = ''
    } = data;

    const result = await db.run(
        `UPDATE gastos
         SET descripcion = ?, monto = ?, fecha = ?, es_facturable = ?, ya_facturado = ?, forma_pago = ?, categoria = ?, notas = ?
         WHERE id = ? AND user_id = ?`,
        [descripcion, monto, fecha, es_facturable ? 1 : 0, ya_facturado ? 1 : 0, forma_pago, categoria, notas, gastoId, userId]
    );

    return result;
}

export async function getGastosFacturablesConUsuario() {
    const db = await openDb();
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000)).toISOString();

    console.log('Fecha actual (ISO):', now.toISOString());
    console.log('Hace 48 horas (ISO):', fortyEightHoursAgo);

    const sqlQuery = `
        SELECT 
            gastos.id,
            gastos.descripcion,
            gastos.monto,
            gastos.fecha,
            gastos.raw_ocr_text, 
            gastos.forma_pago,
            gastos.imagen_url,
            gastos.es_facturable,
            gastos.ya_facturado,
            gastos.fecha_facturado,
            gastos.fecha_creacion,
            users.nombre AS nombre_usuario,
            users.telefono,
            users.email,
            users.rfc_servicio AS rfc,
            users.razon_social_servicio AS razon_social,
            users.uso_cfdi_servicio AS uso_cfdi,
            users.cp_fiscal_servicio AS cp,
            users.email_fiscal_servicio AS email_fiscal
        FROM gastos
        JOIN users ON gastos.user_id = users.id
        WHERE 
            gastos.es_facturable = 1 AND
            (
                gastos.ya_facturado = 0 OR 
                (gastos.ya_facturado = 1 AND DATETIME(gastos.fecha_facturado) >= DATETIME(?))
            )
        ORDER BY gastos.fecha_creacion ASC
    `;

    console.log('Consulta SQL a ejecutar:', sqlQuery);
    console.log('Parámetros de la consulta:', [fortyEightHoursAgo]);

    const rows = await db.all(sqlQuery, [fortyEightHoursAgo]);

    console.log('Tickets encontrados por la consulta:', rows.length);
    rows.forEach(row => console.log(`Ticket ID: ${row.id}, ya_facturado: ${row.ya_facturado}, fecha_facturado: ${row.fecha_facturado}, es_facturable: ${row.es_facturable}`));

    return rows.map(row => ({
        ...row,
        datos_fiscales: {
            razon_social: row.razon_social,
            rfc: row.rfc,
            uso_cfdi: row.uso_cfdi,
            cp: row.cp,
            email_fiscal: row.email_fiscal
        }
    }));
}


export async function actualizarYaFacturado(id, yaFacturado) {
    const db = await openDb();
    if (yaFacturado) {
        await db.run(
            'UPDATE gastos SET ya_facturado = 1, fecha_facturado = ? WHERE id = ?',
            [new Date().toISOString(), id]
        );
    } else {
        await db.run(
            'UPDATE gastos SET ya_facturado = 0, fecha_facturado = NULL WHERE id = ?',
            [id]
        );
    }
    console.log(`✅ Gasto ${id} actualizado a ya_facturado=${yaFacturado ? 1 : 0}`);
}

