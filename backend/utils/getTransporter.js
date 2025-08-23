import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables del .env (por si aún no se ha hecho en otro archivo)
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // convierte string a boolean
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default transporter;