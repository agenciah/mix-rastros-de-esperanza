// RUTA: backend/scripts/createAdmin.js

import { query } from "../db/users/initDb.js";
import bcrypt from "bcrypt";

const crearAdmin = async () => {
    const nombre = "Admin Principal";
    const email = "alejandro.agenciah@gmail.com";
    const password = "Alex1986."; // Recuerda usar una contraseña segura

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // ✅ Corregido: Se usa 'query' y placeholders de PostgreSQL
        await query(
            "INSERT INTO admins (nombre, email, password) VALUES ($1, $2, $3)",
            [nombre, email, hashedPassword]
        );
        console.log(`✅ Admin creado: ${email}`);
    } catch (err) {
        console.error("❌ Error al crear admin:", err.message);
    }
};

crearAdmin();