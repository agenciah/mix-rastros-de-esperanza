// RUTA: src/components/landing/Navbar.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png"; // ✅ Ruta del nuevo logo

export default function Navbar() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2">
                    <img src={logo} alt="Logo de Hasta Encontrarte" className="h-12 w-auto" />
                </Link>

                <nav className="hidden md:flex items-center space-x-6 text-gray-900 text-sm">
                    <a href="#como-funciona" className="hover:text-blue-600">Cómo funciona</a>
                    <a href="#faq" className="hover:text-blue-600">Preguntas Frecuentes</a>
                </nav>

                <div className="hidden md:flex items-center space-x-2">
                    <Link to="/login"><Button variant="ghost" className="text-gray-900 hover:text-blue-600">Iniciar sesión</Button></Link>
                    <Link to="/register"><Button className="text-sm">Crear Cuenta Gratis</Button></Link>
                </div>

                <button className="md:hidden text-gray-900" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {menuOpen && (
                <div className="md:hidden bg-white px-4 pb-4 border-t border-gray-200 space-y-4 text-sm">
                    <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">Cómo funciona</a>
                    <a href="#faq" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">Preguntas Frecuentes</a>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">Iniciar sesión</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="block hover:text-blue-600">Crear Cuenta Gratis</Link>
                </div>
            )}
        </header>
    );
}