import { generateComprobantePDF } from '../utils/generateComprobantePDF.js';
import { sendPagoConfirmadoEmail } from '../utils/emailService.js';

export async function enviarEmailConComprobante(req, res) {
  try {
    console.log('req.body:', req.body);  
    // Aquí puedes usar datos fijos o extraerlos de req.body para pruebas
    const {
      email,
      nombreUsuario,
      plan,
      monto,
      periodo
    } = req.body;

    const pdfBuffer = await generateComprobantePDF({
      nombreUsuario,
      plan,
      monto,
      periodo,
      fechaPago: new Date(),
    });

    await sendPagoConfirmadoEmail(
      email,
      nombreUsuario,
      plan,
      monto,
      periodo,
      pdfBuffer
    );

    res.json({ mensaje: 'Correo con comprobante enviado correctamente.' });
  } catch (error) {
    console.error('Error al enviar correo con comprobante:', error);
    res.status(500).json({ error: 'Error enviando correo' });
  }
}
