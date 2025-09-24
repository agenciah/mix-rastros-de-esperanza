// backend/controllers/fichas/fichasController.js

import { query, pool } from '../../db/users/initDb.js'; // ✅ Corregido: Importamos 'pool'
import logger from '../../utils/logger.js';
import { findMatchesForFicha } from './matchingService.js';
import { getFichaCompletaById, getAllPublicFichas, countActiveFichasByUserId } from '../../db/queries/fichasAndHallazgosQueries.js';
import { getFichasCompletasByUserId } from '../../db/queries/fichasQueries.js';

/**
 * @fileoverview Controlador para la gestión de Fichas de Desaparición.
 * Permite a los usuarios crear, actualizar, eliminar y consultar fichas.
 */

// --- Funciones del CRUD de Fichas ---

/**
 * Crea una nueva ficha de desaparición, incluyendo sus rasgos y vestimenta,
 * y busca automáticamente coincidencias con hallazgos (Versión PostgreSQL).
 */
export const createFichaDesaparicion = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_desaparicion, ubicacion_desaparicion, id_tipo_lugar_desaparicion,
            foto_perfil, edad_estimada, genero, estatura, complexion, peso,
            rasgos_fisicos, vestimenta,
        } = req.body;

        const id_usuario_creador = req.user.id;

        // ✅ INICIA CORRECCIÓN: Convertimos los campos numéricos vacíos a null
        // Si el valor es un string vacío (''), lo cambiamos a null; si no, lo dejamos como está.
        const edad_estimada_db = edad_estimada === '' ? null : edad_estimada;
        const estatura_db = estatura === '' ? null : estatura;
        const peso_db = peso === '' ? null : peso;
        // ✅ FIN CORRECCIÓN

        // 1. Insertar la ubicación y obtener el ID devuelto
        const u = ubicacion_desaparicion;
        const ubicacionResult = await client.query(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_ubicacion`,
            [u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal]
        );
        const id_ubicacion_desaparicion = ubicacionResult.rows[0].id_ubicacion;

        // 2. Insertar la ficha principal y obtener el ID devuelto
        const fichaResult = await client.query(
            `INSERT INTO fichas_desaparicion (
                id_usuario_creador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                fecha_desaparicion, id_ubicacion_desaparicion, id_tipo_lugar_desaparicion,
                foto_perfil, edad_estimada, genero, estatura, complexion, peso
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id_ficha`,
            [
                id_usuario_creador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                fecha_desaparicion, id_ubicacion_desaparicion, id_tipo_lugar_desaparicion,
                foto_perfil,
                // ✅ Usamos las nuevas variables saneadas
                edad_estimada_db, genero, estatura_db, complexion, peso_db
            ]
        );
        const idFicha = fichaResult.rows[0].id_ficha;

        // ... (el resto de la función para insertar rasgos, vestimenta, buscar matches, etc., sigue igual)
        // 3. Insertar rasgos físicos
        if (rasgos_fisicos && rasgos_fisicos.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(rasgo =>
                client.query(
                    `INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle)
                     VALUES ($1, $2, $3, $4)`,
                    [idFicha, rasgo.id_parte_cuerpo, rasgo.tipo_rasgo, rasgo.descripcion_detalle]
                )
            );
            await Promise.all(rasgosPromises);
        }

        // 4. Insertar vestimenta
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                client.query(
                    `INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [idFicha, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
                )
            );
            await Promise.all(vestimentaPromises);
        }

        // 5. Búsqueda de coincidencias
        const matches = await findMatchesForFicha(req, {
            id_ficha: idFicha,
            ...req.body
        });

        // 6. Si todo fue exitoso, guardamos los cambios
        await client.query('COMMIT');

        // 7. Responder al cliente
        res.status(201).json({
            success: true,
            message: `Ficha creada con éxito. ${matches.length > 0 ? `Se encontraron ${matches.length} posibles coincidencias.` : 'No se encontraron coincidencias inmediatas.'}`,
            id_ficha: idFicha,
            matches,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al crear ficha (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear ficha' });
    } finally {
        client.release();
    }
};

/**
 * Actualiza una ficha existente, verificando la propiedad del usuario (Versión PostgreSQL).
 */
export const actualizarFicha = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const id_usuario_creador = req.user.id;

        const {
            ubicacion_desaparicion,
            rasgos_fisicos,
            vestimenta,
            id_ficha,
            tipo_lugar,
            nombre_usuario,
            email_usuario,
            ...fichaPrincipal // Contiene edad_estimada, estatura, peso, etc.
        } = req.body;

        // ✅ INICIA CORRECCIÓN: Limpiamos los datos numéricos antes de usarlos
        if (fichaPrincipal.edad_estimada === '') fichaPrincipal.edad_estimada = null;
        if (fichaPrincipal.estatura === '') fichaPrincipal.estatura = null;
        if (fichaPrincipal.peso === '') fichaPrincipal.peso = null;
        // ✅ FIN CORRECCIÓN

        // 1. Verifica la propiedad de la ficha
        const fichaResult = await client.query(
            `SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = $1 AND id_usuario_creador = $2`,
            [id, id_usuario_creador]
        );

        if (fichaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada o no autorizado' });
        }
        const ficha = fichaResult.rows[0];

        // 2. Actualiza la tabla principal 'fichas_desaparicion'
        if (Object.keys(fichaPrincipal).length > 0) {
            const fichaFields = Object.keys(fichaPrincipal);
            const fichaValues = Object.values(fichaPrincipal);
            const fichaSetClause = fichaFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            await client.query(
                `UPDATE fichas_desaparicion SET ${fichaSetClause} WHERE id_ficha = $${fichaFields.length + 1}`,
                [...fichaValues, id]
            );
        }

        // 3. Actualiza la ubicación
        if (ubicacion_desaparicion && Object.keys(ubicacion_desaparicion).length > 0) {
            const ubicacionFields = Object.keys(ubicacion_desaparicion);
            const ubicacionValues = Object.values(ubicacion_desaparicion);
            const ubicacionSetClause = ubicacionFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            await client.query(
                `UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = $${ubicacionFields.length + 1}`,
                [...ubicacionValues, ficha.id_ubicacion_desaparicion]
            );
        }

        // 4. Reemplaza rasgos y vestimenta
        await client.query(`DELETE FROM ficha_rasgos_fisicos WHERE id_ficha = $1`, [id]);
        if (rasgos_fisicos && rasgos_fisicos.length > 0) {
            const promises = rasgos_fisicos.map(rasgo =>
                client.query(`INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES ($1, $2, $3, $4)`,
                    [id, rasgo.id_parte_cuerpo, rasgo.tipo_rasgo, rasgo.descripcion_detalle])
            );
            await Promise.all(promises);
        }

        await client.query(`DELETE FROM ficha_vestimenta WHERE id_ficha = $1`, [id]);
        if (vestimenta && vestimenta.length > 0) {
            const promises = vestimenta.map(prenda =>
                client.query(`INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`,
                    [id, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial])
            );
            await Promise.all(promises);
        }

        await client.query('COMMIT');
        
        const fichaActualizada = await getFichaCompletaById(id);
        if (fichaActualizada) {
            await findMatchesForFicha(req, fichaActualizada);
        }
        
        res.json({ success: true, message: 'Ficha actualizada correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al actualizar ficha: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar la ficha.' });
    } finally {
        client.release();
    }
};

/**
 * Obtiene todas las fichas de desaparición con sus detalles (Versión PostgreSQL).
 */
export const getAllFichas = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const fichasPrincipalesSql = `
            SELECT
                fd.*,
                u.estado, u.municipio,
                ctl.nombre_tipo AS tipo_lugar
            FROM fichas_desaparicion AS fd
            LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
            ORDER BY fd.fecha_desaparicion DESC
            LIMIT $1 OFFSET $2;
        `;
        const fichasPrincipalesResult = await query(fichasPrincipalesSql, [limit, offset]); // ✅ Corregido
        const fichasPrincipales = fichasPrincipalesResult.rows;

        if (fichasPrincipales.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const todosLosRasgosResult = await query(`SELECT * FROM ficha_rasgos_fisicos`); // ✅ Corregido
        const todaLaVestimentaResult = await query(`SELECT * FROM ficha_vestimenta`); // ✅ Corregido
        const todosLosRasgos = todosLosRasgosResult.rows;
        const todaLaVestimenta = todaLaVestimentaResult.rows;

        const fichasCompletas = fichasPrincipales.map(ficha => {
            const rasgos_fisicos = todosLosRasgos.filter(r => r.id_ficha === ficha.id_ficha);
            const vestimenta = todaLaVestimenta.filter(v => v.id_ficha === ficha.id_ficha);

            return {
                ...ficha,
                rasgos_fisicos,
                vestimenta
            };
        });

        res.json({ success: true, data: fichasCompletas });

    } catch (error) {
        logger.error(`❌ Error al obtener todas las fichas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener las fichas.' });
    }
};

/**
 * Obtiene una ficha de desaparición específica por su ID (Versión PostgreSQL).
 */
export const getFichaById = async (req, res) => {
    try {
        const { id } = req.params;

        const fichaSql = `
            SELECT
                fd.*,
                u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.codigo_postal,
                ctl.nombre_tipo AS tipo_lugar,
                creator.nombre as nombre_usuario,
                creator.email as email_usuario
            FROM fichas_desaparicion AS fd
            LEFT JOIN users AS creator ON fd.id_usuario_creador = creator.id
            LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
            WHERE fd.id_ficha = $1;
        `;
        const rasgosSql = `
            SELECT frf.*, cpc.nombre_parte
            FROM ficha_rasgos_fisicos AS frf
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
            WHERE frf.id_ficha = $1;
        `;
        const vestimentaSql = `
            SELECT fv.*, cp.tipo_prenda
            FROM ficha_vestimenta AS fv
            LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
            WHERE fv.id_ficha = $1;
        `;

        const [fichaResult, rasgosResult, vestimentaResult] = await Promise.all([
            query(fichaSql, [id]),      // ✅ Corregido
            query(rasgosSql, [id]),     // ✅ Corregido
            query(vestimentaSql, [id])  // ✅ Corregido
        ]);

        if (fichaResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
        }

        const ficha = fichaResult.rows[0];
        const rasgos_fisicos = rasgosResult.rows;
        const vestimenta = vestimentaResult.rows;

        const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfFicha } = ficha;
        const fichaCompleta = {
            ...restOfFicha,
            ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, codigo_postal },
            rasgos_fisicos: rasgos_fisicos || [],
            vestimenta: vestimenta || []
        };

        res.json({ success: true, data: fichaCompleta });

    } catch (error) {
        logger.error(`❌ Error al obtener la ficha por ID (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener la ficha.' });
    }
};

/**
 * Elimina la ficha de desaparición y los registros asociados (Versión PostgreSQL).
 */
export const deleteFichaDesaparicion = async (req, res) => {
    const client = await pool.connect(); // ✅ Corregido
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const id_usuario_creador = req.user.id;

        const fichaResult = await client.query(
            `SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = $1 AND id_usuario_creador = $2`,
            [id, id_usuario_creador]
        );
        const ficha = fichaResult.rows[0];

        if (!ficha) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada o no autorizado para eliminar.' });
        }

        await client.query(`DELETE FROM fichas_desaparicion WHERE id_ficha = $1`, [id]);
        await client.query(`DELETE FROM ubicaciones WHERE id_ubicacion = $1`, [ficha.id_ubicacion_desaparicion]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Ficha eliminada correctamente.' });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al eliminar ficha (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar la ficha.' });
    } finally {
        client.release();
    }
};

/**
 * Busca fichas de desaparición por un término de búsqueda en múltiples campos (Versión PostgreSQL).
 */
export const searchFichas = async (req, res) => {
    try {
        const { searchTerm = '', limit = 20, offset = 0 } = req.query;
        const sqlTerm = `%${searchTerm.toLowerCase()}%`;

        const fichasSql = `
            SELECT DISTINCT
                fd.id_ficha, fd.nombre, fd.apellido_paterno, fd.fecha_desaparicion,
                fd.foto_perfil, fd.genero, fd.edad_estimada, u.estado, u.municipio
            FROM fichas_desaparicion AS fd
            LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
            LEFT JOIN ficha_rasgos_fisicos AS frf ON fd.id_ficha = frf.id_ficha
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN ficha_vestimenta AS fv ON fd.id_ficha = fv.id_ficha
            LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
            LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
            WHERE fd.estado_ficha = 'activa' AND (
                fd.nombre ILIKE $1 OR
                fd.apellido_paterno ILIKE $2 OR
                fd.genero ILIKE $3 OR
                u.estado ILIKE $4 OR
                u.municipio ILIKE $5 OR
                frf.descripcion_detalle ILIKE $6 OR
                cpc.nombre_parte ILIKE $7 OR
                fv.color ILIKE $8 OR
                fv.marca ILIKE $9 OR
                cp.tipo_prenda ILIKE $10 OR
                ctl.nombre_tipo ILIKE $11
            )
            ORDER BY fd.fecha_desaparicion DESC
            LIMIT $12 OFFSET $13;
        `;

        const params = Array(11).fill(sqlTerm).concat([limit, offset]);
        const result = await query(fichasSql, params); // ✅ Corregido

        res.json({ success: true, data: result.rows });

    } catch (error) {
        logger.error(`❌ Error al buscar fichas (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de fichas.' });
    }
};

/**
 * Obtiene el catálogo de tipos de lugar (Versión PostgreSQL).
 */
export const obtenerCatalogoTiposLugar = async (req, res) => {
    try {
        const result = await query(`SELECT * FROM catalogo_tipo_lugar`); // ✅ Corregido
        res.json({ success: true, catalogo_tipo_lugar: result.rows });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de tipos de lugar (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene el catálogo de partes del cuerpo (Versión PostgreSQL).
 */
export const obtenerCatalogoPartesCuerpo = async (req, res) => {
    try {
        const result = await query(`SELECT * FROM catalogo_partes_cuerpo`); // ✅ Corregido
        const partes = result.rows;

        const partesNormalizadas = partes.map(p => ({
            id: p.id_parte_cuerpo,
            nombre: p.nombre_parte,
            categoria: p.categoria_principal
        }));
        res.json({ success: true, catalogo_partes_cuerpo: partesNormalizadas });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de partes del cuerpo (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene el catálogo de prendas (Versión PostgreSQL).
 */
export const obtenerCatalogoPrendas = async (req, res) => {
    try {
        const result = await query(`SELECT * FROM catalogo_prendas`); // ✅ Corregido
        res.json({ success: true, catalogo_prendas: result.rows });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de prendas (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene las fichas públicas para el feed principal de forma paginada.
 */
export const getPublicFichasFeed = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const fichas = await getAllPublicFichas(limit, offset);

        res.json({ success: true, data: fichas });

    } catch (error) {
        logger.error(`❌ Error al obtener el feed de fichas públicas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener las fichas.' });
    }
};

/**
 * Obtiene las estadísticas de fichas para el usuario autenticado.
 */
export const getUserFichaStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const activeFichasCount = await countActiveFichasByUserId(userId);
        res.json({ success: true, data: { activeFichasCount } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas de fichas.' });
    }
};

export const getMisFichas = async (req, res) => {
    try {
        const fichas = await getFichasCompletasByUserId(req.user.id);
        res.json({ success: true, data: fichas });
    } catch (error) {
        logger.error(`❌ Error en getMisFichas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener tus fichas.' });
    }
};