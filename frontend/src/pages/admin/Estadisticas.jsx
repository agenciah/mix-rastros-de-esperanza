import React, { useEffect, useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend
} from 'recharts';
import apiAdmin from '../../lib/axiosAdmin';
import { toast } from 'sonner';
import { PLANES } from '../../constants/planes';

// Colores para las gráficas
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#00C49F', '#FF8042'];

export default function Estadisticas() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalIngresos: 0,
    ingresosPorMes: [],
    nuevosUsuariosPorMes: [],
    usuariosPorPlan: [],
    cancelacionesPorMes: [],
    totalCancelaciones: 0,
    totalIngresosSuscripciones: 0,
  });

  // useEffect para cargar los datos cuando el componente se monte
  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        setLoading(true);
        // Llamamos al nuevo endpoint de estadísticas del backend
        const res = await apiAdmin.get('/estadisticas');
        const {
          totalIngresos,
          ingresosPorMes,
          nuevosUsuariosPorMes,
          usuariosPorPlan,
          cancelacionesPorMes,
          totalCancelaciones,
          totalIngresosSuscripciones
        } = res.data;

        // Mapeamos los planes para usar los nombres de la constante PLANES
        const planesMapeados = usuariosPorPlan.map(item => {
          const planInfo = PLANES.find(plan => plan.id === item.plan);
          return {
            name: planInfo ? planInfo.nombre : 'Plan Desconocido',
            value: item.total
          };
        });

        // Actualizamos el estado con los datos reales
        setData({
          totalIngresos,
          ingresosPorMes: ingresosPorMes.map(item => ({
            mes: item.mes,
            total: item.total
          })),
          nuevosUsuariosPorMes: nuevosUsuariosPorMes.map(item => ({
            mes: item.mes,
            usuarios: item.total
          })),
          usuariosPorPlan: planesMapeados,
          cancelacionesPorMes: cancelacionesPorMes.map(item => ({
            mes: item.mes,
            cancelaciones: item.total
          })),
          totalCancelaciones,
          totalIngresosSuscripciones,
        });
      } catch (error) {
        console.error('Error al obtener las estadísticas:', error);
        toast.error('No se pudieron cargar los datos de las estadísticas.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  if (loading) {
    return <div className="p-6 text-center">Cargando estadísticas...</div>;
  }

  // Formatear el número a moneda MXN
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  };

  return (
    <Tabs defaultValue="usuarios" className="w-full p-4">
      <TabsList>
        <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        <TabsTrigger value="facturacion">Facturación</TabsTrigger>
      </TabsList>

      <TabsContent value="usuarios">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardContent className="h-64 pt-6">
              <h2 className="text-lg font-semibold mb-2">Usuarios registrados por mes</h2>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.nuevosUsuariosPorMes}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="usuarios" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="h-64 pt-6">
              <h2 className="text-lg font-semibold mb-2">Distribución de planes</h2>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.usuariosPorPlan} dataKey="value" nameKey="name" outerRadius={80} label>
                    {data.usuariosPorPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">Resumen de usuarios</h2>
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <p className="text-4xl font-bold">{data.totalCancelaciones}</p>
                  <p className="text-sm text-gray-500">Total de bajas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardContent className="h-64 pt-6">
              <h2 className="text-lg font-semibold mb-2">Usuarios dados de baja por mes</h2>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.cancelacionesPorMes}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cancelaciones" stroke="#ff7f50" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="facturacion">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">Ingresos recurrentes (Suscripciones)</h2>
              <p className="text-4xl font-bold">{formatCurrency(data.totalIngresosSuscripciones)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="h-64 pt-6">
              <h2 className="text-lg font-semibold mb-2">Monto de facturas de servicio por mes</h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ingresosPorMes}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
