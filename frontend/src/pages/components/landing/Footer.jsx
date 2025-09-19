// RUTA: src/components/landing/Footer.jsx

import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-gray-100 text-gray-700 py-8 border-t">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-6 md:space-y-0">
                <div>
                    <h3 className="font-semibold mb-2 text-lg text-gray-900">Contacto</h3>
                    <p>
                        <a href="mailto:contacto@hastaencontrarte.lat" className="text-blue-600 hover:underline">
                            contacto@hastaencontrarte.lat
                        </a>
                    </p>
                </div>
                <nav className="flex flex-col space-y-2">
                    <Link to="/aviso-privacidad" className="hover:text-blue-600">Aviso de Privacidad</Link>
                    <Link to="/terminos-condiciones" className="hover:text-blue-600">Términos y Condiciones</Link>
                </nav>
            </div>
            <div className="mt-6 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Hasta Encontrarte. Todos los derechos reservados.
            </div>
        </footer>
    );
}