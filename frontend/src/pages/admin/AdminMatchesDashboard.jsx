// src/components/Admin/AdminMatchesDashboard.jsx
import React, { useState } from 'react';
import useAdminMatches from '../../hooks/useAdminMatches';
import MatchDetailModal from './MatchDetailModal'; // <- Este componente lo crearemos después

const AdminMatchesDashboard = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState(null); // Para el modal de detalle
  const { matches, totalItems, isLoading, error, fetchMatches } = useAdminMatches(page, 10, statusFilter);

  const totalPages = Math.ceil(totalItems / 10);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reiniciar a la página 1 al cambiar el filtro
  };

  const handleRowClick = async (match) => {
    // Aquí podrías cargar los detalles completos del match para el modal
    // Por ahora, solo guardamos el objeto del listado
    // La carga completa se haría dentro del modal usando un nuevo hook si es necesario
    setSelectedMatch(match);
  };

  if (isLoading) {
    return <div>Cargando coincidencias...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Coincidencias de Fichas y Hallazgos</h1>

      <div className="mb-4">
        <label htmlFor="status-filter" className="mr-2">Filtrar por estado:</label>
        <select id="status-filter" value={statusFilter} onChange={handleStatusChange} className="border p-2 rounded">
          <option value="all">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="revisada">Revisadas</option>
          <option value="descartada">Descartadas</option>
        </select>
      </div>

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID Coincidencia</th>
            <th className="py-2 px-4 border-b">Ficha de Búsqueda</th>
            <th className="py-2 px-4 border-b">Hallazgo Reportado</th>
            <th className="py-2 px-4 border-b">Puntaje</th>
            <th className="py-2 px-4 border-b">Criterios</th>
            <th className="py-2 px-4 border-b">Estado</th>
          </tr>
        </thead>
        <tbody>
          {matches.length > 0 ? (
            matches.map((match) => (
              <tr 
                key={match.id_posible_coincidencia} 
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => handleRowClick(match)}
              >
                <td className="py-2 px-4 border-b text-center">{match.id_posible_coincidencia}</td>
                <td className="py-2 px-4 border-b">
                  {match.nombre_ficha} {match.apellido_paterno_ficha} (ID: {match.id_ficha})
                </td>
                <td className="py-2 px-4 border-b">
                  {match.nombre_hallazgo} {match.apellido_paterno_hallazgo} (ID: {match.id_hallazgo})
                </td>
                <td className="py-2 px-4 border-b text-center">{match.puntaje}</td>
                <td className="py-2 px-4 border-b">
                  <ul className="list-disc list-inside">
                    {match.criterios_match.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </td>
                <td className="py-2 px-4 border-b text-center">
                  <span className={`px-2 py-1 rounded text-sm font-semibold
                    ${match.estado_revision === 'pendiente' ? 'bg-yellow-200 text-yellow-800' : ''}
                    ${match.estado_revision === 'revisada' ? 'bg-green-200 text-green-800' : ''}
                    ${match.estado_revision === 'descartada' ? 'bg-red-200 text-red-800' : ''}
                  `}>
                    {match.estado_revision}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-4">No se encontraron coincidencias.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Navegación de la tabla */}
      <div className="flex justify-between items-center mt-4">
        <button 
          onClick={() => setPage(page - 1)} 
          disabled={page === 1}
          className="bg-gray-300 p-2 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>Página {page} de {totalPages}</span>
        <button 
          onClick={() => setPage(page + 1)} 
          disabled={page >= totalPages}
          className="bg-gray-300 p-2 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {selectedMatch && (
        <MatchDetailModal 
          match={selectedMatch} 
          onClose={() => setSelectedMatch(null)}
          onUpdate={fetchMatches} // Para que se recargue la tabla al cerrar el modal
        />
      )}
    </div>
  );
};

export default AdminMatchesDashboard;