import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../../db/users/core.js';
import logger from '../../utils/logger.js';
import admin from '../../lib/firebaseAdmin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

export async function loginUser(req, res) {
    const { email, password } = req.body;
    try {
        const user = await findUserByEmail(email);

        if (!user) {
            logger.warn(`⚠️ Intento de login para usuario no encontrado: ${email}`);
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        // ✅ VERIFICACIÓN DE CORREO CONFIRMADO
        if (user.email_confirmed !== 1) {
            logger.warn(`⚠️ Intento de login con correo no confirmado: ${email}`);
            return res.status(403).json({ error: 'Por favor, confirma tu correo electrónico para iniciar sesión.' });
        }

        const tokenPayload = { id: user.id, email: user.email, plan: user.plan, role: user.role };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user });
    } catch (error) {
        logger.error(`❌ Error en login: ${error.message}`);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

export const getProfile = (req, res) => {
    res.json({ success: true, user: req.user });
};

export const getFirebaseToken = async (req, res) => {
    try {
        const uid = req.user.id.toString();
        const firebaseToken = await admin.auth().createCustomToken(uid);
        res.json({ success: true, firebaseToken });
    } catch (error) {
        logger.error(`❌ Error al crear el token de Firebase: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error de autenticación con el servicio.' });
    }
};

