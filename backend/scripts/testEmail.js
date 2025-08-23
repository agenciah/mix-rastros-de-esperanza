import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: `"Simplika" <${process.env.EMAIL_USER}>`,
      to: 'alejandro-1986-jf@hotmail.com', // cámbialo por uno real
      subject: '🚀 Test de envío SMTP Zoho',
      html: '<p>Este es un correo de prueba desde el backend de Simplika.</p>',
    });

    console.log('✅ Correo enviado:', info.messageId);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

test();
