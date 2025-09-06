// src/components/layout/SidebarAdmin.jsx
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react"; // Icono opcional
import { useNavigate } from "react-router-dom";
import {toast} from "sonner"; // Asegúrate de tener instalado sonner para notificaciones



const SidebarAdmin = () => {
  const navigate = useNavigate();

  const links = [
    { to: "/admin", label: "Vista General" },
    { to: "/admin/usuarios", label: "Editor de Usuarios" },
    { to: "/admin/fichas", label: "Administrar Fichas" },
    { to: "/admin/hallazgos", label: "Administrar Hallazgos" },
    { to: "/admin/gestion-pagos", label: "Gestión de Pagos" },
    { to: "/admin/configuracion", label: "Configuración" },
    { to: "/admin/historial", label: "Historial de Movimientos" },
    { to: "/admin/matches", label: "Coincidencias" },
  ];

  

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white fixed top-0 left-0 flex flex-col justify-between">
      <div>
        <div className="p-4 font-bold text-xl border-b border-gray-700">
          Admin Rastros de Esperanza
        </div>
        <nav className="mt-4 flex flex-col gap-2 px-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `py-2 px-3 rounded-md ${
                  isActive ? "bg-gray-700 font-semibold" : "hover:bg-gray-800"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => {
            localStorage.removeItem("adminToken");
            toast.success("Sesión cerrada con éxito");
            navigate("/admin/login");
          }}
          className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default SidebarAdmin;
