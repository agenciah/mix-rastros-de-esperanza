// RUTA: backend/lib/firebaseAdmin.js

import admin from 'firebase-admin';

// Lee las credenciales desde las variables de entorno
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplaza los caracteres de escape
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Inicializa la app de Firebase Admin solo si no ha sido inicializada antes
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default admin;