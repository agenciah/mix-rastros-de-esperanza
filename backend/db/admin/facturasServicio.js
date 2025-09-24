// RUTA: backend/db/admin/facturasServicio.js

import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

export async function createFacturaServicio({
    user_id,
    descripcion,
    monto,
    fecha_emision,
    fecha_pago,
    metodo_pago,
    estatus,
}) {
    
    const sql = `
        INSERT INTO facturas_servicio (
            user_id, descripcion, monto, fecha_emision,
            fecha_pago, metodo_pago, estatus
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
    `;
    try {
        const result = await db.query(sql, [
            user_id, descripcion, monto, fecha_emision,
            fecha_pago, metodo_pago, estatus
        ]);
        return { id: result.rows[0].id };
    } catch (error) {
        logger.error(`❌ Error en createFacturaServicio (PostgreSQL): ${error.message}`);
        throw error;
    }
}

export async function getAllFacturasServicio() {
    
    const sql = `
        SELECT f.*, u.nombre, u.email, u.razon_social_servicio
        FROM facturas_servicio f
        JOIN users u ON f.user_id = u.id
        ORDER BY fecha_emision DESC;
    `;
    try {
        const result = await db.query(sql);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en getAllFacturasServicio (PostgreSQL): ${error.message}`);
        throw error;
    }
}

export async function getFacturasServicioByUser(user_id) {
    
    const sql = `
        SELECT * FROM facturas_servicio
        WHERE user_id = $1
        ORDER BY fecha_emision DESC;
    `;
    try {
        const result = await db.query(sql, [user_id]);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en getFacturasServicioByUser (PostgreSQL): ${error.message}`);
        throw error;
    }
}

export async function updateFacturaServicio(id, fields) {
    
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const query = `UPDATE facturas_servicio SET ${setClause} WHERE id = $${keys.length + 1}`;
    
    try {
        await db.query(query, [...values, id]);
        return { id };
    } catch (error) {
        logger.error(`❌ Error en updateFacturaServicio (PostgreSQL): ${error.message}`);
        throw error;
    }
}

export async function deleteFacturaServicio(id) {
    
    try {
        await db.query(`DELETE FROM facturas_servicio WHERE id = $1`, [id]);
        return { deleted: true };
    } catch (error) {
        logger.error(`❌ Error en deleteFacturaServicio (PostgreSQL): ${error.message}`);
        throw error;
    }
}

export async function yaTieneFacturaEnPeriodo(user_id, periodo) {
    
    const sql = `SELECT id FROM facturas_servicio WHERE user_id = $1 AND periodo = $2;`;
    try {
        const result = await db.query(sql, [user_id, periodo]);
        return result.rowCount > 0;
    } catch (error) {
        logger.error(`❌ Error en yaTieneFacturaEnPeriodo (PostgreSQL): ${error.message}`);
        throw error;
    }
}

export async function getUsuariosPendientesDeFacturar() {
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const periodoActual = `${year}-${month}`;

    // PostgreSQL usa TO_CHAR para formatear fechas en las consultas
    const sql = `
        SELECT u.id, u.nombre, u.email, u.plan,
               u.razon_social_servicio, u.rfc_servicio, u.uso_cfdi_servicio, 
               u.cp_fiscal_servicio, u.email_fiscal_servicio
        FROM users u
        LEFT JOIN facturas_servicio fs ON u.id = fs.user_id 
            AND TO_CHAR(fs.fecha_emision, 'YYYY-MM') = $1
        WHERE
            u.razon_social_servicio IS NOT NULL AND u.razon_social_servicio != '' AND
            u.rfc_servicio IS NOT NULL AND u.rfc_servicio != '' AND
            fs.id IS NULL
        GROUP BY u.id
        ORDER BY u.nombre ASC;
    `;
    try {
        const result = await db.query(sql, [periodoActual]);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en getUsuariosPendientesDeFacturar (PostgreSQL): ${error.message}`);
        throw error;
    }
}

export async function getFacturasRecientes() {
    const db = await openDb();
    // PostgreSQL puede manejar intervalos de tiempo de forma más natural
    const sql = `
        SELECT fs.*, u.nombre, u.email, u.razon_social_servicio
        FROM facturas_servicio fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.fecha_emision >= NOW() - INTERVAL '2 days'
        ORDER BY fs.fecha_emision DESC;
    `;
    try {
        const result = await db.query(sql);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en getFacturasRecientes (PostgreSQL): ${error.message}`);
        throw error;
    }
}
