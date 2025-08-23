// src/layouts/DashboardLayoutAdmin.jsx
import { Outlet } from "react-router-dom";
import SidebarAdmin from "@/layouts/SidebarAdmin"

export default function DashboardLayoutAdmin() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar lateral */}
      <SidebarAdmin />

      {/* Contenido principal */}
      <main className="ml-64 w-full p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
