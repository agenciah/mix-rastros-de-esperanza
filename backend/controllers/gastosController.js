// 📁 controllers/gastosController.js
import { getFacturablesByUserId, createGasto, getGastosByUserId, deleteGastoById, updateGastoById } from '../db/gastos.js';
// import { desmarcarGastoComoFacturable, marcarGastoComoFacturable } from '../db/gastos.js'
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

export async function crearGasto(req, res) {
  // --- PASO 1: AÑADE ESTOS LOGS AL INICIO DE LA FUNCIÓN ---
  console.log('--- DENTRO DEL CONTROLADOR crearGasto ---');
  console.log('Datos recibidos en req.body:', req.body);
  console.log('Usuario autenticado (req.user):', req.user);
  if (!req.body || typeof req.body !== 'object') {
    console.error('[crearGasto] req.body está vacío o mal formado:', req.body);
    return res.status(400).json({ error: 'No se enviaron datos en el body.' });
  }

  const {
    descripcion,
    monto,
    fecha,
    tipo,
    tipo_gasto,
    contenido,
    imagen_url,
    forma_pago,
    categoria,
    notas
  } = req.body;

  const user_id = req.user.id;

  if (!descripcion || !monto || !fecha) {
    return res.status(400).json({ error: 'Todos los campos obligatorios no fueron enviados.' });
  }

  try {
    await createGasto({
      user_id,
      descripcion,
      monto,
      fecha,
      tipo: tipo || '',
      tipo_gasto: tipo_gasto || '',
      contenido: contenido || '',
      imagen_url: imagen_url || null,
      forma_pago: forma_pago || '',
      categoria: categoria || '',
      notas: notas || '',
      es_facturable: req.body.es_facturable ? 1 : 0
    });

    res.status(201).json({ message: 'Gasto registrado con éxito.' });
  } catch (err) {
    console.error('Error al crear gasto:', err);
    res.status(500).json({ error: 'Error del servidor al registrar gasto.' });
  }
}

export async function obtenerGastos(req, res) {
  const userId = req.user.id;

  try {
    const gastos = await getGastosByUserId(userId);

    res.status(200).json({ gastos });
  } catch (err) {
    console.error('Error al obtener gastos:', err);
    res.status(500).json({ error: 'Error al obtener los gastos.' });
  }
}

export async function exportarGastos(req, res) {
  const userId = req.user.id;
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ error: 'Parámetros desde y hasta requeridos.' });
  }

  try {
    const gastos = await getGastosByUserId(userId);
    const filtrados = gastos.filter(g =>
      dayjs(g.fecha).isAfter(dayjs(desde)) &&
      dayjs(g.fecha).isBefore(dayjs(hasta))
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Gastos');

    sheet.columns = [
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Tipo Gasto', key: 'tipo_gasto', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 20 }
    ];

    filtrados.forEach(g => sheet.addRow(g));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=gastos.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error al exportar gastos:', err);
    res.status(500).json({ error: 'Error al exportar los gastos.' });
  }
}

export async function getFacturablesByUser(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const gastosFacturables = await getFacturablesByUserId(userId);
    return res.json(gastosFacturables);
  } catch (error) {
    console.error('Error al obtener gastos facturables:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function eliminarGasto(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await deleteGastoById(userId, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado o no autorizado.' });
    }

    res.json({ message: 'Gasto eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar gasto:', err);
    res.status(500).json({ error: 'Error al eliminar gasto.' });
  }
}

export async function obtenerResumenGastos(req, res) {
  try {
    const userId = req.user.id;
    const gastos = await getGastosByUserId(userId);

    const total = gastos.reduce((acc, g) => acc + g.monto, 0);
    const facturados = gastos
      .filter(g => g.es_facturable)
      .reduce((acc, g) => acc + g.monto, 0);
    const noFacturados = total - facturados;

    const haceUnMes = dayjs().subtract(30, 'days');

    const ultimoMes = gastos
      .filter(g => dayjs(g.fecha_creacion).isAfter(haceUnMes))
      .reduce((acc, g) => acc + g.monto, 0);

    const recientes = gastos
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5)
      .map(g => ({
        descripcion: g.descripcion,
        monto: g.monto,
        fecha: dayjs(g.fecha).format('DD MMM YYYY')
      }));

    res.json({ total, facturados, noFacturados, ultimoMes, recientes });
  } catch (error) {
    console.error('Error en obtenerResumenGastos:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de gastos' });
  }
}

export const obtenerGastosFacturables = async (req, res) => {
  try {
    const userId = req.user.id;
    const gastos = await getFacturablesByUserId(userId); // 👈 función correcta
    res.json(gastos);
  } catch (error) {
    console.error('Error al obtener gastos facturables:', error);
    res.status(500).json({ error: 'Error al obtener gastos facturables' });
  }
};

export async function editarGasto(req, res) {
   console.log('Headers recibidos:', req.headers);
  console.log('Body recibido:', req.body);
  const { id } = req.params;
  const userId = req.user.id;
  const datosGasto = req.body;

  try {
    const result = await updateGastoById(userId, id, datosGasto);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado o no autorizado.' });
    }

    res.json({ message: 'Gasto actualizado correctamente.' });
  } catch (err) {
    console.error('Error al actualizar gasto:', err);
    res.status(500).json({ error: 'Error al actualizar gasto.' });
  }
}