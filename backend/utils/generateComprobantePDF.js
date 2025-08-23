// backend/utils/generateComprobantePDF.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function generateComprobantePDF({
  nombreUsuario,
  plan,
  monto,
  periodo,
  fechaPago,
  correo,
  metodoPago = 'Tarjeta de crédito',
  comprobanteId = 'CMP-' + Date.now(),
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    try {
      // Logo
      const logoPath = path.join(process.cwd(), 'public', 'cover.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 100 });
      }

      // Borde elegante
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(1.5)
        .strokeColor('#0077cc')
        .stroke();

      // Título
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#0077cc')
        .text('Comprobante de Pago', { align: 'center' });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(1.5);

      // Tabla de datos
      const labels = [
        'Comprobante ID',
        'Nombre del cliente',
        'Correo electrónico',
        'Fecha de Pago',
        'Plan contratado',
        'Monto',
        'Periodo de uso',
        'Método de pago',
      ];

      const values = [
        comprobanteId,
        nombreUsuario,
        correo,
        fechaPago.toLocaleDateString(),
        plan,
        `$${monto}`,
        periodo,
        metodoPago,
      ];

      doc.fontSize(11).fillColor('#000000');

      labels.forEach((label, i) => {
        doc.font('Helvetica-Bold').text(`${label}:`, 70, doc.y, { continued: false, width: 200 });
        doc.font('Helvetica').text(values[i], 200, doc.y - 15);
        doc.moveDown(1);
      });

      // Mensaje final
      doc.moveDown(2);
      doc.fontSize(10).fillColor('#444444').text(
        'Gracias por confiar en Simplika.',
        { align: 'center' }
      );

      // Footer
      doc.moveTo(50, 750).lineTo(doc.page.width - 50, 750).strokeColor('#dddddd').stroke();
      doc.fontSize(8).fillColor('#999999').text(
        'Simplika S.A. de C.V. | Este documento es un comprobante de pago digital y no sustituye una factura fiscal.\nContacto: soporte@simplika.lat',
        50,
        760,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
