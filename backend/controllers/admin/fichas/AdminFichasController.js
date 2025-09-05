// 📁 backend/controllers/admin/fichasController.js

import { openDb } from '../../../db/users/initDb.js';
import logger from '../../../utils/logger.js';
import { getFichaCompletaByIdAdmin } from '../../../db/queries/fichasAndHallazgosQueries.js';

// --- Funciones del CRUD de Fichas para Admin ---

/**
 * Obtiene todas las fichas de desaparición con detalles completos y datos del creador.
 * Incluye funcionalidad de búsqueda y paginación.
 */
export const getAllFichasAdmin = async (req, res) => {
  try {
    const db = await openDb();
    const { searchTerm = '', limit = 50, offset = 0 } = req.query;
    const queryTerm = `%${searchTerm.toLowerCase()}%`;

    const fichasSql = `
      SELECT
        fd.id_ficha,
        fd.nombre,
        fd.apellido_paterno,
        fd.fecha_desaparicion,
        fd.estado_ficha,
        fd.estado_pago,
        u.nombre AS nombre_usuario,
        u.email AS email_usuario
      FROM fichas_desaparicion AS fd
      LEFT JOIN users AS u ON fd.id_usuario_creador = u.id
      WHERE LOWER(fd.nombre || ' ' || IFNULL(fd.segundo_nombre, '') || ' ' || fd.apellido_paterno || ' ' || IFNULL(fd.apellido_materno, '')) LIKE LOWER(?)
      ORDER BY fd.fecha_desaparicion DESC
      LIMIT ? OFFSET ?;
    `;
    
    const fichas = await db.all(fichasSql, [queryTerm, limit, offset]);

    res.json({ success: true, data: fichas });
  } catch (error) {
    logger.error(`❌ Error al obtener fichas para admin: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error interno del servidor al obtener fichas.' });
  }
};

/**
 * Obtiene una ficha de desaparición específica por su ID, para el administrador.
 */
export const getFichaByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const fichaCompleta = await getFichaCompletaByIdAdmin(id);

    if (!fichaCompleta) {
      return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
    }
    
    res.json({ success: true, data: fichaCompleta });
  } catch (error) {
    logger.error(`❌ Error al obtener la ficha por ID para admin: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error al obtener la ficha.' });
  }
};

/**
 * Actualiza una ficha existente desde el panel de administrador.
 * No requiere verificación de propiedad.
 */
export const updateFichaAdmin = async (req, res) => {
  const db = await openDb();
  await db.exec('BEGIN TRANSACTION');

  try {
    const { id } = req.params;
    const {
      nombre, segundo_nombre, apellido_paterno, apellido_materno,
      fecha_desaparicion, id_tipo_lugar_desaparicion, foto_perfil,
      estado_ficha, estado_pago, fecha_registro_encontrado,
      ubicacion_desaparicion, rasgos_fisicos, vestimenta,
    } = req.body;

    const ficha = await db.get(`SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ?`, [id]);
    if (!ficha) {
      await db.exec('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
    }

    // 1. Actualiza la ubicación (lógica reutilizada de fichasController)
    if (ubicacion_desaparicion) {
      const ubicacionUpdateData = {};
      for (const key in ubicacion_desaparicion) {
        if (ubicacion_desaparicion[key] !== undefined && ubicacion_desaparicion[key] !== null) {
          ubicacionUpdateData[key] = ubicacion_desaparicion[key];
        }
      }
      if (Object.keys(ubicacionUpdateData).length > 0) {
        const ubicacionSetClause = Object.keys(ubicacionUpdateData).map(key => `${key} = ?`).join(', ');
        const ubicacionValues = Object.values(ubicacionUpdateData);
        await db.run(
          `UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = ?`,
          [...ubicacionValues, ficha.id_ubicacion_desaparicion]
        );
      }
    }

    // 2. Actualiza los campos principales de la ficha
    const fichaUpdateData = {};
    const mainFields = {
      nombre, segundo_nombre, apellido_paterno, apellido_materno,
      fecha_desaparicion, id_tipo_lugar_desaparicion, foto_perfil,
      estado_ficha, estado_pago, fecha_registro_encontrado
    };
    for (const key in mainFields) {
      if (mainFields[key] !== undefined && mainFields[key] !== null) {
        fichaUpdateData[key] = mainFields[key];
      }
    }

    if (Object.keys(fichaUpdateData).length > 0) {
      const fichaSetClause = Object.keys(fichaUpdateData).map(key => `${key} = ?`).join(', ');
      const fichaValues = Object.values(fichaUpdateData);
      await db.run(
        `UPDATE fichas_desaparicion SET ${fichaSetClause} WHERE id_ficha = ?`,
        [...fichaValues, id]
      );
    }

    // 3. Elimina y reinserta rasgos y vestimenta (lógica reutilizada)
    if (rasgos_fisicos) {
      await db.run(`DELETE FROM ficha_rasgos_fisicos WHERE id_ficha = ?`, [id]);
      const rasgosPromises = rasgos_fisicos.map(rasgo =>
        db.run(
          `INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES (?, ?, ?, ?)`,
          [id, rasgo.id_parte_cuerpo, rasgo.tipo_rasgo, rasgo.descripcion_detalle]
        )
      );
      await Promise.all(rasgosPromises);
    }

    if (vestimenta) {
      await db.run(`DELETE FROM ficha_vestimenta WHERE id_ficha = ?`, [id]);
      const vestimentaPromises = vestimenta.map(prenda =>
        db.run(
          `INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES (?, ?, ?, ?, ?)`,
          [id, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
        )
      );
      await Promise.all(vestimentaPromises);
    }
    
    await db.exec('COMMIT');
    res.json({ success: true, message: 'Ficha actualizada correctamente' });

  } catch (error) {
    await db.exec('ROLLBACK');
    logger.error(`❌ Error al actualizar ficha para admin: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar ficha.' });
  }
};

/**
 * Elimina una ficha de desaparición desde el panel de administrador.
 * No requiere verificación de propiedad.
 */
export const deleteFichaAdmin = async (req, res) => {
  const db = await openDb();
  await db.exec('BEGIN TRANSACTION');

  try {
    const { id } = req.params;
    const ficha = await db.get(`SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ?`, [id]);

    if (!ficha) {
      await db.exec('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
    }

    await db.run(`DELETE FROM fichas_desaparicion WHERE id_ficha = ?`, [id]);
    await db.run(`DELETE FROM ubicaciones WHERE id_ubicacion = ?`, [ficha.id_ubicacion_desaparicion]);

    await db.exec('COMMIT');
    res.json({ success: true, message: 'Ficha y registros asociados eliminados correctamente' });
  } catch (error) {
    await db.exec('ROLLBACK');
    logger.error(`❌ Error al eliminar ficha para admin: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar ficha.' });
  }
};