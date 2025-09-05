import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid
} from 'recharts';
import apiAdmin from '../../lib/axiosAdmin';
import { toast } from 'sonner';
import { PLANES } from '../../constants/planes';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#00C49F', '#FF8042'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsuarios: 0,
    totalFichas: 0,
    totalHallazgos: 0,
    totalCoincidencias: 0,
    ingresosConfirmados: 0,
    ingresosPendientes: 0,
    totalCancelaciones: 0,
    usuariosPorPlan: [],
    ingresosConfirmadosPorMes: [],
    ingresosPendientesPorMes: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Llama al nuevo endpoint de estadísticas del admin
        const res = await apiAdmin.get('/estadisticas');
        const {
          totalUsuarios,
          totalFichas,
          totalHallazgos,
          ingresos,
          usuariosPorPlan,
          totalCoincidencias,
          totalCancelaciones
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
          totalUsuarios,
          totalFichas,
          totalHallazgos,
          totalCoincidencias,
          ingresosConfirmados: ingresos.confirmados,
          ingresosPendientes: ingresos.pendientes,
          totalCancelaciones,
          usuariosPorPlan: planesMapeados,
          ingresosConfirmadosPorMes: ingresos.confirmadosPorMes,
          ingresosPendientesPorMes: ingresos.pendientesPorMes,
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
        {/* Total de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboardData.totalUsuarios}</div>
          </CardContent>
        </Card>

        {/* Total de Fichas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fichas de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboardData.totalFichas}</div>
          </CardContent>
        </Card>

        {/* Total de Hallazgos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Hallazgos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboardData.totalHallazgos}</div>
          </CardContent>
        </Card>

        {/* Total de Coincidencias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Coincidencias Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dashboardData.totalCoincidencias}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ingresos Totales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(dashboardData.ingresosConfirmados)}</div>
          </CardContent>
        </Card>

        {/* Ingresos Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(dashboardData.ingresosPendientes)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Ingresos Mensuales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Ingresos Confirmados por Mes</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.ingresosConfirmadosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" name="Ingresos" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Ingresos Pendientes por Mes</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.ingresosPendientesPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" name="Ingresos" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de pastel de usuarios por plan */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Usuarios por Plan</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboardData.usuariosPorPlan} dataKey="value" nameKey="name" outerRadius={100} label>
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
    </div>
  );
}
