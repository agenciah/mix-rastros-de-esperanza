import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js'; // Es una buena práctica añadir logger

const JWT_SECRET = process.env.JWT_ADMIN_SECRET || 'clave_secreta_admin_temporal'; // Usar una clave secreta diferente para admin

export async function loginAdmin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    try {
        const db = openDb(); // Obtiene el pool de PostgreSQL

        // Se usa db.query y placeholder $1
        const adminResult = await db.query(
            'SELECT * FROM admins WHERE email = $1',
            [email]
        );
        
        const admin = adminResult.rows[0];

        if (!admin) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'admin' }, // Añadimos el rol para seguridad
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
        logger.error(`❌ Error en loginAdmin (PostgreSQL): ${error.message}`);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}
