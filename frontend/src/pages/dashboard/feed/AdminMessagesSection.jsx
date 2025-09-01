// frontend/src/components/AdminMessagesSection.jsx
import React from 'react';

const AdminMessagesSection = ({ messages }) => {
  return (
    <div className="admin-messages-container">
      <h3>Mensajes del Administrador</h3>
      {messages.length > 0 ? (
        <div className="messages-list">
          {messages.map((message) => (
            <div key={message.id_mensaje} className="message-card">
              <h4>{message.titulo || 'Mensaje Importante'}</h4>
              <p>{message.contenido}</p>
              <small>Publicado el: {new Date(message.fecha_creacion).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay mensajes nuevos del administrador.</p>
      )}
    </div>
  );
};

export default AdminMessagesSection;