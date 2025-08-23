// test/estadoServicio.test.js
import request from 'supertest';
import app from '../app.js';  // Importa tu app sin arrancar el servidor

describe('GET /api/estado-servicio', () => {
  it('debería responder con status 200 y un objeto con la info del estado', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhbGVqYW5kcm8uYWdlbmNpYWhAZ21haWwuY29tIiwidGVsZWZvbm8iOiI1NTI2Njg5MTg4IiwicGxhbiI6IltcInBsYW5fMjUwX2NoYXRib3RcIl0iLCJpYXQiOjE3NTMzMDgzNzIsImV4cCI6MTc1MzkxMzE3Mn0.2A-x0hBn3EZLIxRWu3vTx7ZCVtZMHs8PZgP30uYf9DQ'; // Debes obtenerlo o mockearlo

    const res = await request(app)
      .get('/api/estado-servicio')
      .set('Authorization', `Bearer ${token}`);  // Pasa el token

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.servicioActivo).toBeDefined();
  });
});
