// RUTA: src/components/landing/Faq.jsx

import { useState } from 'react';

// --- Tus Datos ---
const preguntas = [
    {
        q: "¿'Hasta Encontrarte' tiene algún costo?",
        a: "No. La plataforma no tiene costo. Sin embargo genera gastos mes a mes, por lo que buscamos mantenerla a través de donaciones que cubren los costos del servidor y el mantenimiento."
    },
    {
        q: "¿Mi información personal es segura?",
        a: "Sí. La seguridad de los familiares es nuestra máxima prioridad. La comunicación entre usuarios (ej. para verificar una coincidencia) se realiza a través de nuestro sistema de mensajería interno para proteger tu identidad y datos de contacto como teléfono o dirección."
    },
    {
        q: "¿Esta plataforma reemplaza a las autoridades?",
        a: "No, en lo absoluto. Somos una herramienta ciudadana complementaria. Siempre recomendamos realizar la denuncia oficial ante las autoridades correspondientes. Nuestro objetivo es unificar y visibilizar la información que a menudo queda fuera de los registros oficiales."
    },
    {
        q: "¿Puedo ayudar si no estoy buscando a nadie?",
        a: "¡Sí! Tu ayuda es invaluable. Puedes registrarte y reportar hallazgos de personas no identificadas que veas en hospitales, albergues o en situación de calle. Cada reporte es una nueva esperanza para una familia."
    }
];

// --- El Componente ---
export default function FAQSection() {
    // Estado para saber qué pregunta está abierta. 'null' significa que todas están cerradas.
    const [activeIndex, setActiveIndex] = useState(null);

    // Función para abrir/cerrar una pregunta
    const handleToggle = (index) => {
        // Si la pregunta clickeada ya está abierta, la cerramos (null). Si no, la abrimos.
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div id='faq' className="bg-white py-12 sm:py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Preguntas Frecuentes
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Respuestas a las dudas más comunes sobre nuestra labor.
                    </p>
                </div>
                <div className="mt-10">
                    <dl className="space-y-4">
                        {preguntas.map((pregunta, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-1">
                                <dt>
                                    <button
                                        onClick={() => handleToggle(index)}
                                        className="flex w-full items-start justify-between text-left text-gray-900 p-4"
                                    >
                                        <span className="font-semibold">{pregunta.q}</span>
                                        <span className="ml-6 flex h-7 items-center">
                                            {/* Cambia el ícono de '+' a '-' si la pregunta está abierta */}
                                            <svg className={`h-6 w-6 transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </span>
                                    </button>
                                </dt>
                                <dd className={`overflow-hidden transition-all duration-500 ease-in-out ${activeIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                                    <div className="p-4 pt-0">
                                        <p className="text-base text-gray-600">{pregunta.a}</p>
                                    </div>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}