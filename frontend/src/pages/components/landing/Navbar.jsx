import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoSimplika from "./images/cover.png";

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={logoSimplika} alt="Simplika logo" className="h-14 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-gray-900 text-sm">
          <a href="#como-funciona" className="hover:text-blue-600">Cómo funciona</a>
          <a href="#faq" className="hover:text-blue-600">FAQ</a>
        </nav>

        {/* Acciones escritorio */}
        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate("/seleccionar-plan")}
            className="text-gray-900 hover:text-blue-600"
          >
            Conoce más y elige tu plan
          </Button>
          <Link to="/login">
            <Button variant="ghost" className="text-gray-900 hover:text-blue-600">Iniciar sesión</Button>
          </Link>
          <Link to="/register">
            <Button className="text-sm">Registrarse</Button>
          </Link>
        </div>

        {/* Botón Hamburguesa */}
        <button
          className="md:hidden text-gray-900"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white px-4 pb-4 border-t border-gray-200 space-y-4 text-sm">
          <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">
            Cómo funciona
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">
            FAQ
          </a>
          <button
            onClick={() => {
              navigate("/seleccionar-plan");
              setMenuOpen(false);
            }}
            className="w-full text-left text-gray-900 hover:text-blue-600"
          >
            Conoce más y elige tu plan
          </button>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">
            Iniciar sesión
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">
            Registrarse
          </Link>
        </div>
      )}
    </header>
  );
}
