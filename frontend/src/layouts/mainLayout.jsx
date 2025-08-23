import { Outlet } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"

export default function MainLayout() {
  return (
    <div className="min-h-screen h-screen w-full max-w-full flex flex-col bg-white text-black">
      <header className="p-4 border-b border-gray-300">
        <h1 className="text-xl font-bold">GastosBot</h1>
      </header>
      <main className="flex-grow p-4 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
