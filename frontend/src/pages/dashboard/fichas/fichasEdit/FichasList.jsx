// src/pages/dashboard/fichas/FichasList.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Edit } from "lucide-react";
import api from "@/lib/axios";


/**
 * Custom hook para obtener todas las fichas del usuario.
 * @returns {object} Un objeto con la lista de fichas, el estado de carga y cualquier error.
 */
function useFetchFichas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFichas = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      
      try {
        // Asume que esta API devuelve una lista de fichas del usuario autenticado
        const res = await api.get("/api/fichas");
        console.log('Lista de fichas obtenida con éxito:', res.data);
        
        // CORRECCIÓN: Accede a la propiedad 'data' de la respuesta para obtener el array
        setData(res.data.data); 

      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || "Error al cargar las fichas.";
        console.log('Error al obtener la lista de fichas:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFichas();
  }, []);

  return { data, loading, error };
}

export default function FichasList() {
  const { data: fichas, loading, error } = useFetchFichas();
  const navigate = useNavigate();

  // Función para manejar la navegación a la página de edición
  const handleEditClick = (id) => {
    navigate(`/dashboard/fichas/editar/${id}`);
  };

  // Muestra un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return <div className="text-center p-8">Cargando fichas...</div>;
  }

  // Muestra un mensaje de error si la carga falla
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Mis Fichas Creadas</h1>
      {fichas.length === 0 ? (
        <Alert>
          <AlertTitle>No hay fichas creadas</AlertTitle>
          <AlertDescription>
            Todavía no has registrado ninguna ficha de persona desaparecida.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {fichas.map((ficha) => (
            <Card key={ficha.id_ficha}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {ficha.nombre} {ficha.apellido_paterno}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleEditClick(ficha.id_ficha)}>
                  <Edit size={16} className="mr-2" /> Editar
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Fecha de desaparición:</strong> {ficha.fecha_desaparicion}</p>
                <p><strong>Estado:</strong> {ficha.estado_ficha}</p>
                <p><strong>Ubicación:</strong> {ficha.ubicacion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
