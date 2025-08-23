// scripts/testComprobantePago.js

import { generateComprobantePDF } from '../utils/generateComprobantePDF.js';
import { sendPagoConfirmadoEmail } from '../utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config(); // Asegúrate de tener .env cargado

async function main() {
  // Datos simulados
  const nombreUsuario = 'Alejandro Jiménez';
  const correo = 'alejandro.agenciah@gmail.com'; // cámbialo a uno real
  const plan = 'Plan Facturación 25 tickets';
  const monto = 250;
  const periodo = 'Agosto 2025 - Septiembre 2025';
  const fechaPago = new Date();

  try {
    console.log('🧾 Generando PDF...');
    const pdfBuffer = await generateComprobantePDF({
      nombreUsuario,
      plan,
      monto,
      periodo,
      fechaPago,
    });

    console.log('📧 Enviando correo con comprobante PDF...');
    await sendPagoConfirmadoEmail(
      correo,
      nombreUsuario,
      plan,
      monto,
      periodo,
      pdfBuffer
    );

    console.log('✅ Comprobante enviado con éxito');
  } catch (error) {
    console.error('❌ Error al enviar comprobante de pago:', error);
  }
}

main();
