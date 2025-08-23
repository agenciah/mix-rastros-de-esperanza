import dotenv from 'dotenv';
dotenv.config();

import transporter from './getTransporter.js';
import { wrapEmailLayout } from './emailLayout.js';

async function sendTestEmail() {
  try {
    const htmlContent = wrapEmailLayout(`
      <h2>¡Hola, Simplika!</h2>
      <p>Este es un correo de prueba para verificar que la plantilla de email está funcionando correctamente.</p>
      <p>Si ves el logo arriba y este texto abajo con formato, todo está bien 👍</p>
    `);

    const info = await transporter.sendMail({
      from: `"Simplika" <${process.env.EMAIL_USER}>`,
      to: process.env.TEST_EMAIL || 'alejandro.agenciah@gmail.com',
      subject: '📬 Prueba de correo Simplika',
      html: htmlContent,
    });

    console.log('✅ Correo de prueba enviado:', info.messageId);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

sendTestEmail();
