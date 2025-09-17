// backend/controllers/fichas/fichasController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { findMatchesForFicha } from './matchingService.js';
import { getFichaCompletaById, getAllPublicFichas, countActiveFichasByUserId } from '../../db/queries/fichasAndHallazgosQueries.js';

/**
 * @fileoverview Controlador para la gestión de Fichas de Desaparición.
 * Permite a los usuarios crear, actualizar, eliminar y consultar fichas.
 */

// --- Funciones del CRUD de Fichas ---

/**
 * Crea una nueva ficha de desaparición, incluyendo sus rasgos y vestimenta,
 * y busca automáticamente coincidencias con hallazgos.
 */
export const createFichaDesaparicion = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const {
            nombre,
            segundo_nombre,
            apellido_paterno,
            apellido_materno,
            fecha_desaparicion,
            ubicacion_desaparicion,
            id_tipo_lugar_desaparicion,
            foto_perfil,
            // Nuevos campos
            edad_estimada,
            genero,
            estatura,
            complexion,
            peso,
            // Fin de nuevos campos
            rasgos_fisicos,
            vestimenta,
        } = req.body;

        const id_usuario_creador = req.user.id;

        // 1. Insertar la ubicación
        const ubicacionResult = await db.run(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ubicacion_desaparicion.estado,
                ubicacion_desaparicion.municipio,
                ubicacion_desaparicion.localidad,
                ubicacion_desaparicion.calle,
                ubicacion_desaparicion.referencias,
                ubicacion_desaparicion.latitud,
                ubicacion_desaparicion.longitud,
                ubicacion_desaparicion.codigo_postal,
            ]
        );

        const id_ubicacion_desaparicion = ubicacionResult.lastID;

        // 2. Insertar la ficha principal con los nuevos campos
        const fichaResult = await db.run(
            `INSERT INTO fichas_desaparicion (
                id_usuario_creador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                fecha_desaparicion, id_ubicacion_desaparicion, id_tipo_lugar_desaparicion,
                foto_perfil, edad_estimada, genero, estatura, complexion, peso
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_usuario_creador,
                nombre,
                segundo_nombre,
                apellido_paterno,
                apellido_materno,
                fecha_desaparicion,
                id_ubicacion_desaparicion,
                id_tipo_lugar_desaparicion,
                foto_perfil,
                edad_estimada,
                genero,
                estatura,
                complexion,
                peso,
            ]
        );

        const idFicha = fichaResult.lastID;

        // 3. Insertar rasgos físicos
        if (rasgos_fisicos && rasgos_fisicos.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(rasgo =>
                db.run(
                    `INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle)
                     VALUES (?, ?, ?, ?)`,
                    [idFicha, rasgo.id_parte_cuerpo, rasgo.tipo_rasgo, rasgo.descripcion_detalle]
                )
            );
            await Promise.all(rasgosPromises);
        }

        // 4. Insertar vestimenta
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(
                    `INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial)
                     VALUES (?, ?, ?, ?, ?)`,
                    [idFicha, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
                )
            );
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');

        // 5. Búsqueda de coincidencias
        const matches = await findMatchesForFicha(req, {
            id_ficha: idFicha,
            edad_estimada,
            genero,
            estatura,
            complexion,
            peso,
            ubicacion_desaparicion,
            rasgos_fisicos,
            vestimenta,
        });

        // 6. Responder al cliente
        if (matches && matches.length > 0) {
            res.status(201).json({
                success: true,
                message: 'Ficha creada con éxito. Se encontraron posibles coincidencias.',
                id_ficha: idFicha,
                matches,
            });
        } else {
            res.status(201).json({
                success: true,
                message: 'Ficha creada con éxito. No se encontraron coincidencias inmediatas.',
                id_ficha: idFicha,
            });
        }
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al crear ficha: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear ficha' });
    }
};

/**
 * Actualiza una ficha existente, verificando la propiedad del usuario. VERSIÓN FINAL.
 */
export const actualizarFicha = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const id_usuario_creador = req.user.id;

        // ✅ LA SOLUCIÓN: Desestructuramos para separar y limpiar los datos del body.
        const {
            ubicacion_desaparicion,
            rasgos_fisicos,
            vestimenta,
            // Ignoramos explícitamente los campos de solo lectura o IDs que no deben actualizarse aquí
            id_ficha,
            tipo_lugar,
            nombre_usuario,
            email_usuario,
            ...fichaPrincipal // El resto (nombre, foto_perfil, etc.) queda en este objeto
        } = req.body;

        // 1. Verifica la propiedad de la ficha
        const ficha = await db.get(
            `SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ? AND id_usuario_creador = ?`,
            [id, id_usuario_creador]
        );

        if (!ficha) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada o no autorizado' });
        }

        // 2. Actualiza la tabla principal 'fichas_desaparicion' con los datos limpios
        if (Object.keys(fichaPrincipal).length > 0) {
            const fichaSetClause = Object.keys(fichaPrincipal).map(key => `${key} = ?`).join(', ');
            await db.run(
                `UPDATE fichas_desaparicion SET ${fichaSetClause} WHERE id_ficha = ?`,
                [...Object.values(fichaPrincipal), id]
            );
        }

        // 3. Actualiza la ubicación
        if (ubicacion_desaparicion && Object.keys(ubicacion_desaparicion).length > 0) {
            const ubicacionSetClause = Object.keys(ubicacion_desaparicion).map(key => `${key} = ?`).join(', ');
            await db.run(
                `UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = ?`,
                [...Object.values(ubicacion_desaparicion), ficha.id_ubicacion_desaparicion]
            );
        }

        // 4. Reemplaza rasgos y vestimenta
        await db.run(`DELETE FROM ficha_rasgos_fisicos WHERE id_ficha = ?`, [id]);
        if (rasgos_fisicos && rasgos_fisicos.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(rasgo =>
                db.run(`INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES (?, ?, ?, ?)`,
                    [id, rasgo.id_parte_cuerpo, rasgo.tipo_rasgo, rasgo.descripcion_detalle])
            );
            await Promise.all(rasgosPromises);
        }

        await db.run(`DELETE FROM ficha_vestimenta WHERE id_ficha = ?`, [id]);
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(`INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES (?, ?, ?, ?, ?)`,
                    [id, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial])
            );
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');
        
        // Opcional: Re-ejecutar búsqueda de coincidencias
        const fichaActualizada = await getFichaCompletaById(id);
        if (fichaActualizada) {
             await findMatchesForFicha(fichaActualizada);
        }
       
        res.json({ success: true, message: 'Ficha actualizada correctamente' });
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al actualizar ficha: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar la ficha.' });
    }
};

/**
 * Obtiene todas las fichas de desaparición con todos sus detalles.
 * VERSIÓN AUTOCONTENIDA Y ROBUSTA.
 */
export const getAllFichas = async (req, res) => {
    try {
        const db = await openDb();
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        // 1. Obtenemos los datos principales de TODAS las fichas, con paginación
        const fichasPrincipalesSql = `
            SELECT 
                fd.*, -- Traemos todos los campos de la ficha, incluyendo foto, edad, etc.
                u.estado, u.municipio,
                ctl.nombre_tipo AS tipo_lugar
            FROM fichas_desaparicion AS fd
            LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
            ORDER BY fd.fecha_desaparicion DESC
            LIMIT ? OFFSET ?;
        `;
        const fichasPrincipales = await db.all(fichasPrincipalesSql, [limit, offset]);

        if (fichasPrincipales.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 2. Obtenemos TODOS los rasgos y vestimenta en dos consultas masivas
        const todosLosRasgos = await db.all(`SELECT * FROM ficha_rasgos_fisicos`);
        const todaLaVestimenta = await db.all(`SELECT * FROM ficha_vestimenta`);

        // 3. Unimos todo en JavaScript. Esto es mucho más rápido y seguro.
        const fichasCompletas = fichasPrincipales.map(ficha => {
            // Filtramos los rasgos que pertenecen a esta ficha
            const rasgos_fisicos = todosLosRasgos.filter(r => r.id_ficha === ficha.id_ficha);
            // Filtramos la vestimenta que pertenece a esta ficha
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
 * Obtiene una ficha de desaparición específica por su ID. VERSIÓN FINAL Y COMPLETA.
 */
export const getFichaById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await openDb();

        // 1. Consulta principal (sin cambios, ya era completa)
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
            WHERE fd.id_ficha = ?;
        `;
        const ficha = await db.get(fichaSql, [id]);

        if (!ficha) {
            return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
        }

        // ✅ 2. CORRECCIÓN: Se añaden los JOINs para traer los nombres de los catálogos
        const rasgosSql = `
            SELECT frf.*, cpc.nombre_parte 
            FROM ficha_rasgos_fisicos AS frf
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
            WHERE frf.id_ficha = ?;
        `;
        const vestimentaSql = `
            SELECT fv.*, cp.tipo_prenda
            FROM ficha_vestimenta AS fv
            LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
            WHERE fv.id_ficha = ?;
        `;

        const [rasgos_fisicos, vestimenta] = await Promise.all([
            db.all(rasgosSql, [id]),
            db.all(vestimentaSql, [id])
        ]);

        // 3. Formateo y respuesta
        const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfFicha } = ficha;
        const fichaCompleta = {
            ...restOfFicha,
            ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, codigo_postal },
            rasgos_fisicos: rasgos_fisicos || [],
            vestimenta: vestimenta || []
        };
        
        res.json({ success: true, data: fichaCompleta });

    } catch (error) {
        logger.error(`❌ Error al obtener la ficha por ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener la ficha.' });
    }
};

/**
 * Elimina la ficha de desaparición y los registros asociados. VERSIÓN AUTOCONTENIDA.
 */
export const deleteFichaDesaparicion = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const id_usuario_creador = req.user.id;

        // 1. Verifica la propiedad y obtiene el ID de la ubicación
        const ficha = await db.get(
            `SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ? AND id_usuario_creador = ?`,
            [id, id_usuario_creador]
        );

        if (!ficha) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada o no autorizado para eliminar.' });
        }

        // 2. Elimina la ficha (rasgos y vestimenta se borran en cascada si la BD está configurada así)
        await db.run(`DELETE FROM fichas_desaparicion WHERE id_ficha = ?`, [id]);
        
        // 3. Elimina la ubicación, que no se borra en cascada
        await db.run(`DELETE FROM ubicaciones WHERE id_ubicacion = ?`, [ficha.id_ubicacion_desaparicion]);

        await db.exec('COMMIT');
        res.json({ success: true, message: 'Ficha eliminada correctamente.' });

    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al eliminar ficha: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar la ficha.' });
    }
};

/**
 * Busca fichas de desaparición por un término de búsqueda en múltiples campos. VERSIÓN COMPLETA.
 */
export const searchFichas = async (req, res) => {
    try {
        const db = await openDb();
        const { searchTerm = '', limit = 20, offset = 0 } = req.query;
        const sqlTerm = `%${searchTerm.toLowerCase()}%`;

        // Esta consulta busca el término en todos los campos relevantes
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
                LOWER(fd.nombre) LIKE ? OR
                LOWER(fd.apellido_paterno) LIKE ? OR
                LOWER(fd.genero) LIKE ? OR
                LOWER(u.estado) LIKE ? OR
                LOWER(u.municipio) LIKE ? OR
                LOWER(frf.descripcion_detalle) LIKE ? OR
                LOWER(cpc.nombre_parte) LIKE ? OR
                LOWER(fv.color) LIKE ? OR
                LOWER(fv.marca) LIKE ? OR
                LOWER(cp.tipo_prenda) LIKE ? OR
                LOWER(ctl.nombre_tipo) LIKE ?
            )
            ORDER BY fd.fecha_desaparicion DESC
            LIMIT ? OFFSET ?;
        `;
        
        // Creamos un array con el término de búsqueda para cada '?' en la consulta
        const params = Array(11).fill(sqlTerm).concat([limit, offset]);

        const fichas = await db.all(fichasSql, params);
        
        res.json({ success: true, data: fichas });

    } catch (error) {
        logger.error(`❌ Error al buscar fichas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de fichas.' });
    }
};

/**
 * Obtiene el catálogo de tipos de lugar.
 */
export const obtenerCatalogoTiposLugar = async (req, res) => {
    try {
        const db = await openDb();
        const tipos = await db.all(`SELECT * FROM catalogo_tipo_lugar`);
        res.json({ success: true, catalogo_tipo_lugar: tipos });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de tipos de lugar: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene el catálogo de partes del cuerpo.
 */
export const obtenerCatalogoPartesCuerpo = async (req, res) => {
    try {
        const db = await openDb();
        const partes = await db.all(`SELECT * FROM catalogo_partes_cuerpo`);
        const partesNormalizadas = partes.map(p => ({
            id: p.id_parte_cuerpo,
            nombre: p.nombre_parte,
            categoria: p.categoria_principal
        }));
        res.json({ success: true, catalogo_partes_cuerpo: partesNormalizadas });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de partes del cuerpo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};


/**
 * Obtiene el catálogo de prendas.
 */
export const obtenerCatalogoPrendas = async (req, res) => {
    try {
        const db = await openDb();
        const prendas = await db.all(`SELECT * FROM catalogo_prendas`);
        res.json({ success: true, catalogo_prendas: prendas });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de prendas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene las fichas públicas para el feed principal de forma paginada.
 * No requiere autenticación.
 */
export const getPublicFichasFeed = async (req, res) => {
    try {
        // Obtenemos limit y offset de la URL, con valores por defecto
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