import { useEffect, useState } from 'react';
import apiAdmin from '@/lib/axiosAdmin';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

// No necesitamos esta función si el backend ya envía el semáforo
// const getSemaforoColor = (fechaTicket) => {
//   const fecha = new Date(fechaTicket);
//   const ahora = new Date();
//   const diferenciaHoras = (ahora - fecha) / 1000 / 60 / 60;

//   if (diferenciaHoras <= 12) return 'bg-green-500';
//   if (diferenciaHoras <= 24) return 'bg-yellow-500';
//   return 'bg-red-500';
// };

export default function FacturasTicketsAdmin() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await apiAdmin.get('/tickets');
        setTickets(res.data);
      } catch (error) {
        console.error('Error al cargar tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleCheckboxChange = async (gastoId, nuevoValor) => {
    console.log('Checkbox cambiado:', gastoId, nuevoValor);
    try {
      await apiAdmin.put(`/gastos/${gastoId}/facturado`, {
        yaFacturado: nuevoValor,
      });

      // Actualizar el estado local para reflejar el cambio inmediatamente
      setTickets(prev =>
        prev.map(t => {
          if (t.id === gastoId) {
            return {
              ...t,
              ya_facturado: nuevoValor,
              fecha_facturado: nuevoValor ? new Date().toISOString() : null,
              // Nota: el semáforo se basa en fecha_creacion, no cambia al facturar
            };
          }
          return t;
        })
      );
    } catch (error) {
      console.error('Error al actualizar ya_facturado:', error);
    }
  };

  // Separamos los tickets en dos listas para mostrarlos en secciones distintas
  const pendingTickets = tickets.filter(ticket => !ticket.ya_facturado);
  const processedTickets = tickets.filter(ticket => ticket.ya_facturado);

  if (loading) return <p className="p-4">Cargando tickets...</p>;

  // Función auxiliar para obtener la clase de color del semáforo
  const getSemaforoClass = (semaforo) => {
    switch (semaforo) {
      case 'verde': return 'bg-green-500';
      case 'amarillo': return 'bg-yellow-500';
      case 'rojo': return 'bg-red-500';
      default: return 'bg-gray-300'; // Color por defecto si no hay semáforo
    }
  };

  const renderTicketTable = (ticketList, isProcessed = false) => (
    <table className="min-w-full border text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th>Semáforo</th>
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>Email</th>
          <th>Monto</th>
          <th>Comercio</th>
          <th>Datos fiscales</th>
          <th>Detalles OCR</th>
          <th>Foto</th>
          <th>¿Ya facturado?</th>
          {isProcessed && <th>Fecha Facturado</th>} {/* Nueva columna para tickets facturados */}
        </tr>
      </thead>
      <tbody>
        {ticketList.map((ticket) => (
          <tr 
            key={ticket.id} 
            className={`border-t text-center ${isProcessed ? 'bg-gray-50 text-gray-500' : ''}`} // Estilo para tickets facturados
          >
            <td>
              <div
                className={`w-4 h-4 rounded-full mx-auto ${getSemaforoClass(ticket.semaforo)}`}
              />
            </td>
            <td>{ticket.nombre_usuario}</td> {/* Usar nombre_usuario del backend */}
            <td>{ticket.telefono}</td>
            <td>{ticket.email}</td>
            <td>${ticket.monto}</td>
            <td>{ticket.descripcion}</td> {/* Asumo que 'descripcion' es el comercio */}
            <td>
              <Dialog>
                <DialogTrigger>
                  <Button variant="outline" size="sm">Ver</Button>
                </DialogTrigger>
                <DialogContent>
                  <div className="space-y-2 text-sm text-left">
                    <div><strong>Razón social:</strong> {ticket.datos_fiscales?.razon_social || 'N/A'}</div>
                    <div><strong>RFC:</strong> {ticket.datos_fiscales?.rfc || 'N/A'}</div>
                    <div><strong>Código postal:</strong> {ticket.datos_fiscales?.cp || 'N/A'}</div>
                    <div><strong>Email fiscal:</strong> {ticket.datos_fiscales?.email_fiscal || 'N/A'}</div>
                    <div><strong>Uso de CFDI:</strong> {ticket.datos_fiscales?.uso_cfdi || 'N/A'}</div>
                  </div>
                </DialogContent>
              </Dialog>
            </td>
            <td>
              <Dialog>
                <DialogTrigger>
                  <Button variant="outline" size="sm">Ver</Button>
                </DialogTrigger>
                <DialogContent>
                  <pre className="text-left whitespace-pre-wrap">
                    {ticket.ocr_completo || 'Sin OCR'} {/* Usar ocr_completo del backend */}
                  </pre>
                </DialogContent>
              </Dialog>
            </td>
            <td>
              {ticket.imagen_url ? (
                <a
                  href={ticket.imagen_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Ver imagen
                </a>
              ) : (
                'No disponible'
              )}
            </td>
            <td className="text-center">
              <div className="flex justify-center">
                <Checkbox
                  id={`checkbox-${ticket.id}`}
                  checked={!!ticket.ya_facturado}
                  onCheckedChange={(value) =>
                    handleCheckboxChange(ticket.id, Boolean(value))
                  }
                />
              </div>
            </td>
            {isProcessed && (
              <td>
                {ticket.fecha_facturado ? format(new Date(ticket.fecha_facturado), 'dd/MM/yyyy HH:mm') : 'N/A'}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Tickets Pendientes de Facturar</h2>
      {pendingTickets.length > 0 ? (
        <div className="overflow-auto mb-8">
          {renderTicketTable(pendingTickets)}
        </div>
      ) : (
        <p className="p-4 text-gray-600">No hay tickets pendientes de facturar.</p>
      )}

      <hr className="my-8" /> {/* Separador visual */}

      <h2 className="text-xl font-semibold mb-4 mt-8">Tickets Ya Facturados</h2>
      {processedTickets.length > 0 ? (
        <div className="overflow-auto">
          {renderTicketTable(processedTickets, true)} {/* Pasar 'true' para indicar que son procesados */}
        </div>
      ) : (
        <p className="p-4 text-gray-600">No hay tickets facturados aún.</p>
      )}
    </div>
  );
}
