import ExcelJS from 'exceljs';

export async function generarExcelGastos(gastos) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gastos');

  // Definir columnas
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Descripción', key: 'descripcion', width: 30 },
    { header: 'Monto', key: 'monto', width: 15 },
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Facturable', key: 'es_facturable', width: 15 },
  ];

  // Agregar filas
  gastos.forEach(gasto => {
    worksheet.addRow({
      id: gasto.id,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      es_facturable: gasto.es_facturable ? 'Sí' : 'No',
    });
  });

  // Formato opcional para la columna monto
  worksheet.getColumn('monto').numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';

  // Generar buffer de Excel
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
