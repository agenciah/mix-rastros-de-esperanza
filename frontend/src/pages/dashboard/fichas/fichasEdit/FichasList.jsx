// src/pages/dashboard/fichas/FichasList.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Edit, Trash2 } from "lucide-react"; // Importamos el ícono de la papelera
import api from "@/lib/axios";

// --- Importaciones para el modal de confirmación ---
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


/**
 * Custom hook para obtener todas las fichas del usuario.
 * Se ha mejorado para permitir la recarga de datos.
 * @returns {object} Un objeto con la lista de fichas, el estado de carga y cualquier error.
 */
function useFetchFichas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(Date.now()); // Estado para forzar la recarga

  const refetch = () => {
    setLastFetch(Date.now());
  };

  useEffect(() => {
    const fetchFichas = async () => {
      setLoading(true);
      setError(null);
      setData([]);

      try {
        const res = await api.get("/api/fichas");
        console.log('Lista de fichas obtenida con éxito:', res.data);
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
  }, [lastFetch]); // El efecto se ejecuta cuando lastFetch cambia

  return { data, loading, error, refetch };
}

export default function FichasList() {
  const { data: fichas, loading, error, refetch } = useFetchFichas();
  const navigate = useNavigate();

  // --- Nuevos estados para el modal de confirmación ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState(null);

  // Función para manejar la navegación a la página de edición
  const handleEditClick = (id) => {
    navigate(`/dashboard/fichas/editar/${id}`);
  };

  // --- Nueva función para manejar la eliminación de la ficha ---
  const handleDeleteClick = (ficha) => {
    // 1. Guarda la ficha a eliminar en el estado
    setFichaToDelete(ficha);
    // 2. Muestra el modal de confirmación
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!fichaToDelete) return;

    try {
      // 3. Envía la solicitud DELETE al backend
      await api.delete(`/api/fichas/${fichaToDelete.id_ficha}`);
      
      // 4. Recarga la lista de fichas después de una eliminación exitosa
      refetch();

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error al eliminar la ficha.";
      console.log('Error al eliminar la ficha:', errorMessage);
      // Aquí podrías mostrar un toast o una alerta de error al usuario
      alert(errorMessage);
    } finally {
      // 5. Oculta el modal y limpia el estado de la ficha a eliminar
      setShowConfirm(false);
      setFichaToDelete(null);
    }
  };


  if (loading) {
    return <div className="text-center p-8">Cargando fichas...</div>;
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(ficha.id_ficha)}>
                    <Edit size={16} className="mr-2" /> Editar
                  </Button>
                  {/* --- Nuevo botón para eliminar --- */}
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(ficha)}>
                    <Trash2 size={16} className="mr-2" /> Eliminar
                  </Button>
                </div>
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
      
      {/* --- Modal de confirmación --- */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la ficha de la persona 
              "{fichaToDelete?.nombre} {fichaToDelete?.apellido_paterno}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Sí, eliminar ficha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}