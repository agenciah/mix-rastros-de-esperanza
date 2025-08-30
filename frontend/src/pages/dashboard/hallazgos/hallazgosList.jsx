// src/pages/dashboard/hallazgos/HallazgosList.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function HallazgosList() {
  const [hallazgos, setHallazgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHallazgos = async () => {
      try {
        const response = await api.get('/api/hallazgos');
        setHallazgos(response.data.data); // Asegúrate de que la API devuelve los datos en `data.data`
        setLoading(false);
      } catch (err) {
        setError("Error al cargar los hallazgos. Inténtalo de nuevo más tarde.");
        setLoading(false);
      }
    };

    fetchHallazgos();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este hallazgo?")) {
      try {
        await api.delete(`/api/hallazgos/${id}`);
        setHallazgos(hallazgos.filter(hallazgo => hallazgo.id_hallazgo !== id));
      } catch (err) {
        setError("Error al eliminar el hallazgo.");
      }
    }
  };

  if (loading) {
    return <div className="text-center p-8">Cargando hallazgos...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Listado de Hallazgos</h1>
        <Button asChild>
          <Link to="/dashboard/hallazgos/crear">Crear Nuevo Hallazgo</Link>
        </Button>
      </div>

      {hallazgos.length === 0 ? (
        <p className="text-center text-gray-500">No se encontraron hallazgos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hallazgos.map((hallazgo) => (
            <Card key={hallazgo.id_hallazgo} className="relative">
              <CardHeader>
                <CardTitle>Hallazgo #{hallazgo.id_hallazgo}</CardTitle>
                <div className="text-sm text-gray-500">
                  <p>Fecha: {new Date(hallazgo.fecha_hallazgo).toLocaleDateString()}</p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{hallazgo.descripcion_general_hallazgo || "Sin descripción."}</p>
                <div className="flex space-x-2">
                  <Button asChild variant="outline" size="sm" className="w-1/2">
                    <Link to={`/dashboard/hallazgos/editar/${hallazgo.id_hallazgo}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                  <Button variant="destructive" size="sm" className="w-1/2" onClick={() => handleDelete(hallazgo.id_hallazgo)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}