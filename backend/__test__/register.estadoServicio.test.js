// backend/tests/register.estadoServicio.test.js
import request from 'supertest';
import app from '../server.js'; // asegúrate de que esta ruta sea correcta
import { openDb } from '../db/users/initDb.js';

let db;

beforeAll(async () => {
  db = await openDb();
});

afterAll(async () => {
  await db.close();
});

describe('Verificar estado_servicio y sus campos', () => {
  test('Debe contener facturas_restantes y proximo_pago', async () => {
    const user = await db.get('SELECT id FROM users ORDER BY id DESC LIMIT 1');

    if (!user) {
      throw new Error('No hay usuarios en la base de datos para probar.');
    }

    const estado = await db.get('SELECT * FROM estado_servicio WHERE user_id = ?', user.id);

    expect(estado).toBeDefined();
    expect(estado).toHaveProperty('facturas_restantes');
    expect(estado).toHaveProperty('proximo_pago');
  });
});
