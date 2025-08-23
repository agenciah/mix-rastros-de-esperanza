import { useEffect, useState } from 'react';
import apiAdmin from '../../lib/axiosAdmin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function FacturasServicioAdmin() {
  // Estado para los usuarios pendientes de facturar
  const [usuarios, setUsuarios] = useState([]);
  // Nuevo estado para las facturas emitidas recientemente
  const [facturasRecientes, setFacturasRecientes] = useState([]);
  // Estado para controlar la carga de ambas tablas
  const [loading, setLoading] = useState(true);

  // useEffect para cargar ambas tablas al iniciar el componente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUsuariosPendientes(),
        fetchFacturasRecientes()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchUsuariosPendientes = async () => {
    try {
      const { data } = await apiAdmin.get('/usuarios/para-servicio');
      setUsuarios(data);
    } catch (err) {
      console.error('Error al cargar usuarios pendientes:', err);
      toast.error('Hubo un error al cargar los usuarios pendientes.');
    }
  };

  // --- NUEVA FUNCIÓN: Fetch de facturas recientes ---
  const fetchFacturasRecientes = async () => {
    try {
      const { data } = await apiAdmin.get('/facturas-servicio/recientes');
      setFacturasRecientes(data);
    } catch (err) {
      console.error('Error al cargar facturas recientes:', err);
      toast.error('Hubo un error al cargar las facturas recientes.');
    }
  };

  // --- FUNCIÓN ACTUALIZADA: Recarga ambas tablas al facturar ---
  const handleFacturar = async (usuario) => {
    try {
      const currentDate = new Date();
      const periodo = currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
      
      const facturaData = {
        user_id: usuario.id,
        descripcion: `Factura del servicio Simplika para el plan ${JSON.parse(usuario.plan)[0]}`,
        monto: usuario.total,
        periodo: periodo,
      };

      await apiAdmin.post('/admin/facturas-servicio', facturaData);
      toast.success('Factura registrada con éxito.');
      
      // Recargamos ambas listas para actualizar la vista
      fetchUsuariosPendientes();
      fetchFacturasRecientes();
      
    } catch (err) {
      console.error('Error al facturar usuario:', err);
      toast.error('No se pudo registrar la factura. Intenta de nuevo.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Cargando usuarios y facturas...</div>;
  }

  return (
    <div className="p-6">
      {/* -------------------- TABLA DE FACTURAS PENDIENTES -------------------- */}
      <h2 className="text-2xl font-bold mb-4">Facturas de Servicio Pendientes</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Periodo</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>IVA</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Datos fiscales</TableHead>
            <TableHead>Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.length > 0 ? (
            usuarios.map(usuario => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.id}</TableCell>
                <TableCell>{usuario.nombre || '—'}</TableCell>
                <TableCell>{usuario.plan ? JSON.parse(usuario.plan)[0] : '—'}</TableCell>
                <TableCell>{new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' })}</TableCell>
                <TableCell>{typeof usuario.subtotal === 'number' ? `$${usuario.subtotal.toFixed(2)}` : '—'}</TableCell>
                <TableCell>{typeof usuario.iva === 'number' ? `$${usuario.iva.toFixed(2)}` : '—'}</TableCell>
                <TableCell>{typeof usuario.total === 'number' ? `$${usuario.total.toFixed(2)}` : '—'}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Datos fiscales</DialogTitle>
                      </DialogHeader>
                      <Card>
                        <CardContent className="space-y-2 p-4 text-sm">
                          <p><strong>Razón social:</strong> {usuario.razon_social || '—'}</p>
                          <p><strong>RFC:</strong> {usuario.rfc || '—'}</p>
                          <p><strong>Uso CFDI:</strong> {usuario.uso_cfdi || '—'}</p>
                          <p><strong>Código postal:</strong> {usuario.cp_fiscal || '—'}</p>
                          <p><strong>Correo facturación:</strong> {usuario.email_fiscal || '—'}</p>
                        </CardContent>
                      </Card>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleFacturar(usuario)} size="sm">
                    Facturar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">No hay usuarios pendientes de facturar este mes.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* -------------------- TABLA DE FACTURAS RECIENTES -------------------- */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Facturas emitidas recientemente</h2>
        <p className="text-sm text-gray-500 mb-2">Se muestran las facturas creadas en los últimos 2 días.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Factura</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Monto Total</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Estatus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturasRecientes.length > 0 ? (
              facturasRecientes.map(factura => (
                <TableRow key={factura.id}>
                  <TableCell>{factura.id}</TableCell>
                  <TableCell>{factura.nombre || factura.user_id}</TableCell>
                  <TableCell>{factura.descripcion}</TableCell>
                  <TableCell>{typeof factura.monto === 'number' ? `$${factura.monto.toFixed(2)}` : '—'}</TableCell>
                  <TableCell>{factura.fecha_emision}</TableCell>
                  <TableCell>{factura.estatus}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No hay facturas recientes.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}