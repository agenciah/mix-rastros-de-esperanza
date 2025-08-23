// scripts/createAdmin.js
import { openDb } from "../db/users/initDb.js";
import bcrypt from "bcrypt";

const crearAdmin = async () => {
  const db = await openDb();

  const nombre = "Admin Principal";
  const email = "alejandro.agenciah@gmail.com";
  const password = "Alex1986.";

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.run(
      "INSERT INTO admins (nombre, email, password) VALUES (?, ?, ?)",
      [nombre, email, hashedPassword]
    );
    console.log(`✅ Admin creado: ${email}`);
  } catch (err) {
    console.error("❌ Error al crear admin:", err.message);
  }
};

crearAdmin();
