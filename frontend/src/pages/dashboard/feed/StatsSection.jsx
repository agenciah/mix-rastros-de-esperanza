// frontend/src/components/StatsSection.jsx
import React from 'react';

const StatsSection = ({ stats }) => {
  const { globalStats, casosEncontrados, actividadReciente } = stats;

  return (
    <div className="stats-container">
      <h3>Estadísticas de la Plataforma</h3>
      <div className="stats-cards">
        <div className="stat-card">
          <h4>Fichas Publicadas</h4>
          <p>{globalStats.totalFichas}</p>
        </div>
        <div className="stat-card">
          <h4>Hallazgos Reportados</h4>
          <p>{globalStats.totalHallazgos}</p>
        </div>
        <div className="stat-card">
          <h4>Casos Resueltos</h4>
          <p>{globalStats.casosResueltos}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Últimos Casos de Éxito</h3>
        {casosEncontrados.length > 0 ? (
          <ul>
            {casosEncontrados.map((caso) => (
              <li key={caso.id_ficha}>
                Se ha encontrado a **{caso.nombre} {caso.apellido_paterno}**.
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay casos de éxito recientes para mostrar.</p>
        )}
      </div>

      <div className="recent-activity">
        <h3>Actividad Reciente</h3>
        {actividadReciente.length > 0 ? (
          <ul>
            {actividadReciente.map((actividad) => (
              <li key={actividad.id}>
                Nueva ficha publicada: **{actividad.nombre} {actividad.apellido_paterno}**.
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay actividad reciente en la plataforma.</p>
        )}
      </div>
    </div>
  );
};

export default StatsSection;