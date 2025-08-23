import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { openDb } from '../../db/users/initDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_temporal';

export async function loginAdmin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    const db = await openDb();

    const admin = await db.get(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );

    if (!admin) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Error en loginAdmin:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
