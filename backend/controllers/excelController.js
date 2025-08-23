// controllers/excelController.js
import ExcelJS from 'exceljs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { parseISO, isValid } from 'date-fns';

async function openDb() {
  return open({ filename: './db/gastos.db', driver: sqlite3.Database });
}

export async function generarExcelGastos(req, res) {
  const userId = req.user.id;
  const { desde, hasta } = req.query;

  const db = await openDb();

  let query = `SELECT * FROM gastos WHERE user_id = ?`;
  const params = [userId];

  if (desde && hasta) {
    query += ` AND fecha BETWEEN ? AND ?`;
    params.push(desde, hasta);
  }

  const gastos = await db.all(query, params);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gastos');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Descripción', key: 'descripcion', width: 30 },
    { header: 'Monto', key: 'monto', width: 15 },
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Es Facturable', key: 'es_facturable', width: 15 },
  ];

  gastos.forEach(gasto => {
    worksheet.addRow({
      id: gasto.id,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      es_facturable: gasto.es_facturable ? 'Sí' : 'No',
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=gastos.xlsx');

  await workbook.xlsx.write(res);
  res.end();
}
