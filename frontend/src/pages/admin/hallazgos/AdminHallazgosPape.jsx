// 📁 src/pages/admin/AdminHallazgosPage.jsx

import React, { useState, useEffect } from "react";
import apiAdmin from "../../../lib/axiosAdmin";
import { toast } from "sonner";
import HallazgoListado from "./HallazgoListado";
import HallazgoFormulario from "./HallazgoFormulario";

const AdminHallazgosPage = () => {
  const [hallazgos, setHallazgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHallazgo, setSelectedHallazgo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHallazgos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiAdmin.get(`/hallazgos`, {
        params: { searchTerm },
      });
      setHallazgos(response.data.data);
      console.log("🟢 Hallazgos obtenidos:", response.data.data);
    } catch (err) {
      console.error("❌ Error al obtener hallazgos:", err);
      setError("Error al cargar los hallazgos.");
      toast.error("Error al cargar los hallazgos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHallazgos();
  }, [searchTerm]);

  const handleEdit = (hallazgo) => {
    setSelectedHallazgo(hallazgo);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este hallazgo?")) {
      return;
    }
    try {
      await apiAdmin.delete(`/hallazgos/${id}`);
      toast.success("Hallazgo eliminado con éxito.");
      fetchHallazgos(); // Recargar la lista después de eliminar
    } catch (err) {
      console.error("❌ Error al eliminar hallazgo:", err);
      toast.error("Error al eliminar el hallazgo.");
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    setSelectedHallazgo(null);
    fetchHallazgos(); // Recargar la lista después de guardar
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedHallazgo(null);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Administrar Hallazgos</h1>
      {isEditing ? (
        <HallazgoFormulario
          hallazgo={selectedHallazgo}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <HallazgoListado
          hallazgos={hallazgos}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}
    </div>
  );
};

export default AdminHallazgosPage;