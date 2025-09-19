// RUTA: src/components/landing/ComoFunciona.jsx

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const pasos = [
    {
        titulo: "Registra tu Ficha",
        pasos: [
            "Crea una cuenta de forma gratuita y segura.",
            "Llena la ficha de búsqueda con todos los detalles que recuerdes.",
            "Publica la ficha para que forme parte de la base de datos nacional."
        ],
    },
    {
        titulo: "Centraliza y Busca",
        pasos: [
            "Nuestra plataforma cruza tu información con reportes de hospitales, albergues y otros usuarios.",
            "Usa nuestro buscador para explorar fichas y hallazgos por nombre, lugar o características.",
            "Cualquier persona puede reportar un hallazgo de forma anónima o registrada."
        ],
    },
    {
        titulo: "Recibe Notificaciones",
        pasos: [
            "Nuestro sistema de coincidencias trabaja 24/7.",
            "Si un nuevo hallazgo tiene similitudes con tu ficha, recibirás una notificación.",
            "Contacta de forma segura a quien reportó el hallazgo a través de nuestra plataforma."
        ],
    },
];

export default function ComoFunciona() {
    return (
        <section id="como-funciona" className="w-full bg-white py-16 px-4">
            <div className="max-w-6xl mx-auto text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Cómo Funciona Hasta Encontrarte?</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Centralizamos la información para potenciar la búsqueda. Familias, voluntarios y organizaciones, todos colaborando en un solo lugar.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {pasos.map((bloque, index) => (
                    <motion.div key={index} /* ... (animaciones) ... */ className="bg-gray-50 rounded-xl shadow p-6 text-left">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">{bloque.titulo}</h3>
                        <ul className="space-y-3">
                            {bloque.pasos.map((p, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}