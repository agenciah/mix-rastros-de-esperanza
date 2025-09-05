// 📁 src/components/admin/hallazgos/HallazgoListado.jsx
import React from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";

const HallazgoListado = ({
  hallazgos,
  loading,
  error,
  onEdit,
  onDelete,
  searchTerm,
  setSearchTerm,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Listado de Hallazgos</h2>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {hallazgos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Hallazgo</th>
                <th className="py-3 px-6 text-left">Fecha</th>
                <th className="py-3 px-6 text-left">Ubicación</th>
                <th className="py-3 px-6 text-left">Usuario</th>
                <th className="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {hallazgos.map((hallazgo) => (
                <tr
                  key={hallazgo.id_hallazgo}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    <div className="font-medium text-gray-800">
                      {hallazgo.nombre} {hallazgo.segundo_nombre} {hallazgo.apellido_paterno}{" "}
                      {hallazgo.apellido_materno}
                    </div>
                    <div className="text-xs text-gray-500">ID: {hallazgo.id_hallazgo}</div>
                  </td>
                  <td className="py-3 px-6 text-left">
                    {new Date(hallazgo.fecha_hallazgo).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {hallazgo.ubicacion_municipio}, {hallazgo.ubicacion_estado}
                  </td>
                  <td className="py-3 px-6 text-left">
                    <div className="font-medium">{hallazgo.nombre_usuario_buscador}</div>
                    <div className="text-xs text-gray-500">{hallazgo.email_usuario_buscador}</div>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <button
                        onClick={() => onEdit(hallazgo)}
                        className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center hover:bg-blue-200 transition-colors"
                        title="Editar Hallazgo"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => onDelete(hallazgo.id_hallazgo)}
                        className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                        title="Eliminar Hallazgo"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No se encontraron hallazgos.
        </div>
      )}
    </div>
  );
};

export default HallazgoListado;