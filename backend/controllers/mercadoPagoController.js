import dotenv from 'dotenv';
dotenv.config();
// 📁 controllers/mercadoPagoController.js
import axios from 'axios';

const ACCESS_TOKEN = process.env.MP_TEST_ACCESS_TOKEN; // TEST token

export async function crearSuscripcion(req, res) {
  try {
    const { email, nombre } = req.body;

    const response = await axios.post('https://api.mercadopago.com/preapproval', {
      reason: 'Suscripción mensual plan facturación',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 149,
        currency_id: 'MXN',
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      },
      back_url: 'https://tusitio.com/confirmacion',
      payer_email: email
    }, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });

    return res.json({ init_point: response.data.init_point }); // Enlace a la suscripción
  } catch (error) {
    console.error('Error creando suscripción:', error.response?.data || error.message, error.response?.status);
    return res.status(500).json({ error: 'No se pudo crear la suscripción.' });
  }
}
