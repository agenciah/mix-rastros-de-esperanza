import express from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { generarExcelGastos } from '../utils/generateExcel.js';

const router = express.Router();

async function openDb() {
  return open({ filename: './db/gastos.db', driver: sqlite3.Database });
}

// Endpoint para descargar gastos en Excel
router.get('/gastos/:userId', async (req, res) => {
  try {
    const db = await openDb();
    const userId = req.params.userId;

    const gastos = await db.all('SELECT * FROM gastos WHERE user_id = ?', [userId]);

    if (!gastos.length) {
      return res.status(404).json({ error: 'No se encontraron gastos para este usuario' });
    }

    const excelBuffer = await generarExcelGastos(gastos);

    res.setHeader('Content-Disposition', 'attachment; filename="gastos.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ error: 'Error generando el archivo Excel' });
  }
});

export default router;
