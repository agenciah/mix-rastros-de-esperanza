// frontend/src/components/MatchesSection.js
import React from 'react';

const MatchesSection = ({ matches }) => {
    // Aquí puedes separar las coincidencias por score (ej. > 80% son "alta prioridad")
    const highPriorityMatches = matches.filter(match => match.score > 80);
    const otherMatches = matches.filter(match => match.score <= 80);

    return (
        <div className="matches-container">
            <h3>Coincidencias de Alta Prioridad</h3>
            {highPriorityMatches.length > 0 ? (
                highPriorityMatches.map(match => (
                    <div key={match.id_hallazgo} className="match-card">
                        <h4>{match.nombre} {match.apellido_paterno}</h4>
                        <p>Puntaje de coincidencia: {match.score.toFixed(2)}%</p>
                        {/* Espacio para la foto */}
                        <div className="photo-placeholder">
                             {/* Cuando tengas la URL de la foto, la pones aquí */}
                             {/* <img src={match.foto_url} alt={match.nombre} /> */}
                        </div>
                    </div>
                ))
            ) : (
                <p>No hay coincidencias de alta prioridad en este momento.</p>
            )}

            <h3>Posibles Coincidencias</h3>
            {otherMatches.length > 0 ? (
                otherMatches.map(match => (
                    <div key={match.id_hallazgo} className="match-card">
                        <h4>{match.nombre} {match.apellido_paterno}</h4>
                        <p>Puntaje de coincidencia: {match.score.toFixed(2)}%</p>
                        <div className="photo-placeholder"></div>
                    </div>
                ))
            ) : (
                <p>No hay otras posibles coincidencias.</p>
            )}
        </div>
    );
};

export default MatchesSection;