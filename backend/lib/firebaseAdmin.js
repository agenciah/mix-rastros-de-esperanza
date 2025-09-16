// RUTA: backend/lib/firebaseAdmin.js
import 'dotenv/config';
import admin from 'firebase-admin';
import serviceAccount from '../config/serviceAccountKey.json' assert { type: "json" };

// ✅ CORRECCIÓN: Leemos la variable sin el prefijo VITE_
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!storageBucket) {
    console.error("Error: La variable de entorno FIREBASE_STORAGE_BUCKET no está definida en el archivo backend/.env");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: storageBucket 
});

export default admin;