import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 py-8 mt-16 border-t border-gray-300">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center md:items-start space-y-6 md:space-y-0">

        {/* Contacto */}
        <div className="text-center md:text-left">
          <h3 className="font-semibold mb-2 text-lg text-gray-900">Contacto</h3>
          <p>
            Correo:{" "}
            <a
              href="mailto:hola@simplika.lat"
              className="text-blue-600 hover:underline"
            >
              hola@simplika.lat
            </a>
          </p>
          {/* Redes sociales: Descomenta y agrega cuando tengas */}
          {/* <div className="mt-2 flex justify-center md:justify-start space-x-4 text-gray-600">
            <a href="#" aria-label="Facebook" className="hover:text-blue-600">FB</a>
            <a href="#" aria-label="Instagram" className="hover:text-pink-600">IG</a>
            <a href="#" aria-label="Twitter" className="hover:text-blue-400">TW</a>
          </div> */}
        </div>

        {/* Enlaces legales */}
        <nav className="flex flex-col space-y-2 text-center md:text-left">
          <Link
            to="/aviso-privacidad"
            className="hover:text-blue-600 transition-colors"
          >
            Aviso de Privacidad
          </Link>
          <Link
            to="/terminos-condiciones"
            className="hover:text-blue-600 transition-colors"
          >
            Términos y Condiciones
          </Link>
          <Link
            to="/contacto"
            className="hover:text-blue-600 transition-colors"
          >
            Contacto
          </Link>
        </nav>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Simplika. Todos los derechos reservados.
      </div>
    </footer>
  );
}
