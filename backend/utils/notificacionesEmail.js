import path from 'path'; // Importa `path` para manejar rutas
import transporter from './getTransporter.js';
import { wrapEmailLayout } from './emailLayout.js';

// No necesitas importar `dotenv` aquí si ya se carga en `server.js`
// Pero si este archivo se ejecuta de forma independiente, es una buena práctica.
// import dotenv from 'dotenv';
// dotenv.config();

const from = `"Simplika" <${process.env.EMAIL_USER}>`;

// Resuelve la ruta absoluta del logo para evitar problemas con rutas relativas
const logoPath = path.resolve('public', 'cover.png');

export async function enviarNotificacion(tipo, destinatario, datos = {}) {
  let asunto = '';
  let contenido = '';

  switch (tipo) {
    case 'cambio_datos_personales':
      asunto = 'Se han actualizado tus datos personales';
      contenido = `
        <p>Hola ${datos.nombre || 'usuario'},</p>
        <p>Te informamos que tus datos personales han sido actualizados correctamente.</p>
        <p>Si no reconoces esta acción, por favor contáctanos.</p>
      `;
      break;

    case 'cambio_datos_fiscales':
      asunto = 'Se han actualizado tus datos fiscales';
      contenido = `
        <p>Hola ${datos.nombre || 'usuario'},</p>
        <p>Tus datos fiscales han sido modificados. Asegúrate de que la información esté correcta.</p>
        <p>Si no fuiste tú, contáctanos inmediatamente.</p>
      `;
      break;

    case 'cambio_plan':
      asunto = 'Tu plan ha sido modificado';
      contenido = `
        <p>Hola ${datos.nombre || 'usuario'},</p>
        <p>Has cambiado tu plan a <strong>${datos.nuevoPlan}</strong>.</p>
        <p>Si no realizaste esta acción, por favor repórtalo.</p>
      `;
      break;

    case 'fallo_pago':
      asunto = 'Hubo un problema con tu pago';
      contenido = `
        <p>Hola ${datos.nombre || 'usuario'},</p>
        <p>No pudimos procesar tu pago. Por favor revisa tus datos de pago o intenta nuevamente.</p>
      `;
      break;

    case 'reintento_pago':
      asunto = 'Se ha reintentado tu pago';
      contenido = `
        <p>Hola ${datos.nombre || 'usuario'},</p>
        <p>Se ha realizado un nuevo intento de cobro de tu suscripción.</p>
        <p>${datos.exito ? 'El pago fue exitoso.' : 'El pago volvió a fallar.'}</p>
      `;
      break;

    default:
      throw new Error('Tipo de notificación no soportado');
  }

  try {
    await transporter.sendMail({
      from,
      to: destinatario,
      subject: asunto,
      html: wrapEmailLayout(contenido),
      attachments: [
        {
          filename: 'cover.png',
          // Uso de la ruta absoluta para el logo
          path: logoPath,
          cid: 'logo_simplika', // Debe coincidir con el `cid:` usado en el HTML
        },
      ],
    });

    console.log(`[email] Notificación "${tipo}" enviada a ${destinatario}`);
  } catch (err) {
    console.error(`[email] Error al enviar notificación "${tipo}":`, err);
  }
}
