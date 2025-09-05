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
    nombre,
    email,
    telefono,
    estado_republica,
    role,
    estado_suscripcion,
    cancelado
  } = req.body;

  try {
    const db = await openDb();

    // Validar que el usuario exista
    const usuarioExistente = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar campos relevantes para el dashboard de admin
    await db.run(
      `UPDATE users SET
        nombre = ?,
        email = ?,
        telefono = ?,
        estado_republica = ?,
        role = ?,
        estado_suscripcion = ?,
        cancelado = ?
      WHERE id = ?`,
      [
        nombre,
        email,
        telefono,
        estado_republica,
        role,
        estado_suscripcion,
        cancelado,
        id
      ]
    );

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
}




