// frontend/components/dashboard/FeedDashboard.jsx

import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Link } from 'react-router-dom';

// Componentes de tarjetas para Hallazgos y Casos de Éxito
const HallazgoCard = ({ hallazgo }) => (
    <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
        <h4 className="font-semibold text-blue-700">Hallazgo Reportado</h4>
        <p className="text-sm text-gray-600">
            **{hallazgo.nombre} {hallazgo.apellido_paterno}**
        </p>
        <p className="text-xs text-gray-500">
            Fecha: {new Date(hallazgo.fecha).toLocaleDateString()}
        </p>
        {/* Aquí puedes agregar un Link a la página de detalles del hallazgo si existe */}
    </div>
);

const CasoExitoCard = ({ caso }) => (
    <div className="bg-green-100 p-4 rounded-lg shadow-sm">
        <h4 className="font-semibold text-green-700">Caso Resuelto</h4>
        <p className="text-sm text-gray-600">
            **{caso.nombre} {caso.apellido_paterno}**
        </p>
        <p className="text-xs text-gray-500">
            ID: {caso.id_ficha}
        </p>
    </div>
);

const FeedDashboard = () => {
    const { data, loading, error } = useDashboardData();

    if (loading) {
        return <div className="text-center py-8">Cargando datos...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    const { globalStats, casosEncontrados, actividadReciente, mensajesAdministrador } = data;

    return (
        <div className="p-6 space-y-8">
            {/* Sección de Estadísticas Globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-2xl font-bold text-gray-800">{globalStats.totalFichas}</h3>
                    <p className="text-gray-500">Fichas Publicadas</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-2xl font-bold text-gray-800">{globalStats.totalHallazgos}</h3>
                    <p className="text-gray-500">Hallazgos Reportados</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-2xl font-bold text-gray-800">{globalStats.casosResueltos}</h3>
                    <p className="text-gray-500">Casos Resueltos</p>
                </div>
            </div>

            {/* Sección de Actividad Reciente (Últimos Hallazgos) */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Últimos Hallazgos</h2>
                    <Link to="/hallazgos-list" className="text-blue-600 hover:text-blue-800 font-semibold">
                        Ver todos los hallazgos →
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actividadReciente.length > 0 ? (
                        actividadReciente.map((item, index) => (
                            <HallazgoCard key={index} hallazgo={item} />
                        ))
                    ) : (
                        <p className="text-gray-500">No hay hallazgos recientes.</p>
                    )}
                </div>
            </section>

            {/* Sección de Últimos Casos de Éxito */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Casos de Éxito</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {casosEncontrados.length > 0 ? (
                        casosEncontrados.map((caso, index) => (
                            <CasoExitoCard key={index} caso={caso} />
                        ))
                    ) : (
                        <p className="text-gray-500">No hay casos de éxito recientes.</p>
                    )}
                </div>
            </section>
            
            {/* Sección de Mensajes del Administrador */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Mensajes del Administrador</h2>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    {mensajesAdministrador.length > 0 ? (
                        mensajesAdministrador.map((mensaje, index) => (
                            <div key={index} className="border-b last:border-b-0 py-2">
                                <h4 className="font-semibold text-gray-800">{mensaje.titulo}</h4>
                                <p className="text-sm text-gray-600">{mensaje.contenido}</p>
                                <p className="text-xs text-gray-400">
                                    {new Date(mensaje.fecha_creacion).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No hay mensajes nuevos del administrador.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FeedDashboard;