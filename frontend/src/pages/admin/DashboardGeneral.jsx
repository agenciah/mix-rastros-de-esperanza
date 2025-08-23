import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import apiAdmin from '../../lib/axiosAdmin';
import { toast } from 'sonner';
import { PLANES } from '../../constants/planes';
import { format } from 'date-fns';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#00C49F', '#FF8042'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    usuariosPorPlan: [],
    ticketsEstado: { facturados: 0, pendientes: 0 },
    facturasPendientes: [],
    nuevosUsuarios: 0,
    cancelaciones: 0,
    totalIngresosSuscripciones: 0, // Nuevo estado para los ingresos
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Llamamos al nuevo endpoint del dashboard
        const res = await apiAdmin.get('/dashboard');
        const {
          usuariosPorPlan,
          ticketsEstado,
          facturasPendientes,
          nuevosUsuarios,
          cancelaciones,
          totalIngresosSuscripciones, // Se obtiene el nuevo dato de la respuesta
        } = res.data;

        // Mapeamos los nombres de los planes para la gráfica de pastel
        const planesMapeados = usuariosPorPlan.map(item => {
          const planInfo = PLANES.find(plan => plan.id === item.plan);
          return {
            name: planInfo ? planInfo.nombre : 'Plan Desconocido',
            value: item.total
          };
        });

        setDashboardData({
          usuariosPorPlan: planesMapeados,
          ticketsEstado,
          facturasPendientes,
          nuevosUsuarios,
          cancelaciones,
          totalIngresosSuscripciones,
        });
      } catch (error) {
        console.error('Error al obtener los datos del dashboard:', error);
        toast.error('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Cargando dashboard...</div>;
  }

  // Formatear el número a moneda MXN
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administrador</h1>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nueva tarjeta para el total de ingresos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos recurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(dashboardData.totalIngresosSuscripciones)}</div>
          </CardContent>
        </Card>
        {/* --- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nuevos Usuarios (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboardData.nuevosUsuarios}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cancelaciones (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboardData.cancelaciones}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tickets de Facturación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">Facturados</Badge>
              <div className="text-2xl font-bold">{dashboardData.ticketsEstado.facturados}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Pendientes</Badge>
              <div className="text-2xl font-bold">{dashboardData.ticketsEstado.pendientes}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usuarios por Plan</CardTitle>
          </CardHeader>
          <CardContent className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboardData.usuariosPorPlan} dataKey="value" nameKey="name" outerRadius={60} label>
                  {dashboardData.usuariosPorPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Facturas de Servicio Pendientes */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Facturas de servicio pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.facturasPendientes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Emisión
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.facturasPendientes.map((factura) => (
                      <tr key={factura.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{factura.nombre_usuario}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${factura.monto}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(factura.fecha_emision), 'dd/MM/yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay facturas de servicio pendientes.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}