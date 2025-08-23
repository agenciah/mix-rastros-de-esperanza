import { openDb } from '../../db/users/initDb.js'
import { getAllUsuariosAdmin } from '../../db/admin/usuarios.js'

export async function obtenerUsuariosParaAdmin(req, res) {
  try {
    const usuarios = await getAllUsuariosAdmin()
    return res.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function actualizarUsuario(req, res) {
  const { id } = req.params;
  const {
    nombre = '',
    email = '',
    telefono = '',
    plan = '[]',
    razon_social_tickets = '',
    rfc_tickets = '',
    uso_cfdi_tickets = '',
    cp_fiscal_tickets = '',
    email_fiscal_tickets = '',
    razon_social_servicio = '',
    rfc_servicio = '',
    uso_cfdi_servicio = '',
    cp_fiscal_servicio = '',
    email_fiscal_servicio = '',
    tickets_facturados = 0,
    facturacion_tickets = 0,
    gastos_registrados = 0,
    email_confirmed = 0,
    role = 'user',
    cancelado = 0,
    cancelacion_efectiva = ''
  } = req.body;

  // Asegurar que plan sea string JSON
  const planString = typeof plan === 'string' ? plan : JSON.stringify(plan || []);

  try {
    const db = await openDb();

    await db.run(
      `UPDATE users SET
        nombre = ?,
        email = ?,
        telefono = ?,
        plan = ?,
        razon_social_tickets = ?,
        rfc_tickets = ?,
        uso_cfdi_tickets = ?,
        cp_fiscal_tickets = ?,
        email_fiscal_tickets = ?,
        razon_social_servicio = ?,
        rfc_servicio = ?,
        uso_cfdi_servicio = ?,
        cp_fiscal_servicio = ?,
        email_fiscal_servicio = ?,
        tickets_facturados = ?,
        facturacion_tickets = ?,
        gastos_registrados = ?,
        email_confirmed = ?,
        role = ?,
        cancelado = ?,
        cancelacion_efectiva = ?
      WHERE id = ?`,
      [
        nombre,
        email,
        telefono,
        planString,
        razon_social_tickets,
        rfc_tickets,
        uso_cfdi_tickets,
        cp_fiscal_tickets,
        email_fiscal_tickets,
        razon_social_servicio,
        rfc_servicio,
        uso_cfdi_servicio,
        cp_fiscal_servicio,
        email_fiscal_servicio,
        tickets_facturados,
        facturacion_tickets,
        gastos_registrados,
        email_confirmed,
        role,
        cancelado,
        cancelacion_efectiva,
        id
      ]
    );

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
}

import { getUsuariosConDatosServicio } from '../../db/admin/usuarios.js'

export async function obtenerUsuariosParaFacturacionServicio(req, res) {
  try {
    const usuarios = await getUsuariosConDatosServicio()
    return res.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios para servicio:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
