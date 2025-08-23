import {
  createFacturaServicio,
  getAllFacturasServicio,
  getFacturasServicioByUser,
  updateFacturaServicio,
  deleteFacturaServicio,
  yaTieneFacturaEnPeriodo,
  getUsuariosPendientesDeFacturar as getUsuariosDB, // Importamos la función de la DB
  getFacturasRecientes
} from '../../db/admin/facturasServicio.js';
import { plans } from '../../shared/planes.js';

// Datos de planes fijos para el cálculo
const planPrecios = plans.reduce((acc, plan) => {
  acc[plan.id] = { subtotal: plan.precio / 1.16 }; // Asumimos que el precio en el JSON ya incluye el IVA
  return acc;
}, {});

// --- NUEVA FUNCIÓN: Obtiene el plan, calcula el IVA y el total ---
// Función auxiliar que ahora usa el objeto de planes dinámico
function getPlanDetails(planString) {
  try {
    const planArray = JSON.parse(planString);
    const planName = planArray[0];

    // Buscamos el plan en nuestro nuevo objeto
    if (planPrecios[planName]) {
      const subtotal = planPrecios[planName].subtotal;
      const iva = subtotal * 0.16;
      const total = subtotal + iva;
      return { subtotal, iva, total };
    }
    return { subtotal: 0, iva: 0, total: 0 };
  } catch (error) {
    console.error('Error al parsear el plan:', error);
    return { subtotal: 0, iva: 0, total: 0 };
  }
}

// --- ACTUALIZACIÓN: Obtener usuarios que tienen que ser facturados este mes ---
export async function getUsuariosParaFacturar(req, res) {
  try {
    const usuarios = await getUsuariosDB();

    // Procesamos cada usuario para añadir los detalles de la factura
    const usuariosConDetalles = usuarios.map(user => {
      const planDetalles = getPlanDetails(user.plan);
      // Creamos un objeto con solo la información necesaria
      return {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        plan: user.plan,
        razon_social: user.razon_social_servicio,
        rfc: user.rfc_servicio,
        uso_cfdi: user.uso_cfdi_servicio,
        cp_fiscal: user.cp_fiscal_servicio,
        email_fiscal: user.email_fiscal_servicio,
        subtotal: planDetalles.subtotal,
        iva: planDetalles.iva,
        total: planDetalles.total,
        // Aquí podrías añadir el periodo de pago si lo tienes en otra tabla
        // Ejemplo: periodo: 'Julio 2025'
      };
    });

    res.json(usuariosConDetalles);
  } catch (error) {
    console.error('Error al obtener usuarios pendientes de facturar:', error);
    res.status(500).json({ error: 'Error al obtener usuarios pendientes de facturar' });
  }
}

// Obtener todas las facturas emitidas por Simplika (renombrada para mayor claridad)
export async function getFacturasYaEmitidas(req, res) {
  try {
    const facturas = await getAllFacturasServicio();
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas del servicio:', error);
    res.status(500).json({ error: 'Error al obtener facturas del servicio' });
  }
}

// --- ACTUALIZACIÓN: Crear una nueva factura emitida por Simplika ---
export async function postFactura(req, res) {
  try {
    const { user_id, descripcion, monto, periodo } = req.body;
    
    const fecha_emision = new Date().toISOString().split('T')[0];
    
    const fecha_pago = null;
    const metodo_pago = 'Pendiente';
    const estatus = 'Pendiente';

    const nueva = await createFacturaServicio({
      user_id,
      descripcion,
      monto,
      periodo, // 🎉 Se agrega el periodo aquí
      fecha_emision,
      fecha_pago,
      metodo_pago,
      estatus,
    });
    
    res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear factura del servicio:', error);
    res.status(500).json({ error: 'Error al crear factura del servicio' });
  }
}

// Obtener facturas de un usuario específico
export async function getFacturasPorUsuario(req, res) {
  try {
    const { user_id } = req.params;
    const facturas = await getFacturasServicioByUser(user_id);
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener facturas del usuario' });
  }
}

// Editar una factura específica
export async function putFactura(req, res) {
  try {
    const { id } = req.params;
    const actualizaciones = req.body;
    const resultado = await updateFacturaServicio(id, actualizaciones);
    res.json(resultado);
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ error: 'Error al actualizar factura' });
  }
}

// Eliminar una factura
export async function deleteFactura(req, res) {
  try {
    const { id } = req.params;
    const resultado = await deleteFacturaServicio(id);
    res.json(resultado);
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.status(500).json({ error: 'Error al eliminar factura' });
  }
}

// --- NUEVO ENDPOINT para obtener las facturas recientes ---
export async function getFacturasRecientesController(req, res) {
  try {
    const facturas = await getFacturasRecientes();
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas recientes:', error);
    res.status(500).json({ error: 'Error al obtener facturas recientes' });
  }
}