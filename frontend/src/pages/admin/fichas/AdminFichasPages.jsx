/* eslint-disable no-irregular-whitespace */
// 📁 src/pages/adminFichasPage.jsx

import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import apiAdmin from '@/lib/axiosAdmin' // Asumo que ya tienes esta instancia configurada
import FichasListado from '@/pages/admin/fichas/FichasListado'
import FichaFormulario from '@/pages/admin/fichas/FichaFormulario'

// 🆕 Importamos componentes de Shadcn
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminFichasPage() {
  const [fichas, setFichas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null)

  // 📚 Hook para cargar todas las fichas
  useEffect(() => {
    const fetchFichas = async () => {
      setLoading(true)
      try {
        // Usamos el nuevo endpoint para admin con búsqueda
        const { data } = await apiAdmin.get(`/fichas?searchTerm=${search}`)
        setFichas(data.data)
        setError(null)
      } catch (e) {
        console.error("Error al obtener fichas:", e)
        setError('Error al cargar las fichas.')
        toast.error('Error al cargar las fichas.')
      } finally {
        setLoading(false)
      }
    }
    fetchFichas()
  }, [search])

  // 📝 Función para seleccionar una ficha y cargar sus datos completos
  const seleccionarFicha = async (fichaId) => {
    setLoading(true)
    setFichaSeleccionada(null) // Reseteamos la ficha para mostrar el estado de carga
    try {
      const { data } = await apiAdmin.get(`/fichas/${fichaId}`)
      setFichaSeleccionada(data.data)
    } catch (e) {
      console.error("Error al obtener los detalles de la ficha:", e)
      toast.error('Error al cargar los detalles de la ficha.')
    } finally {
      setLoading(false)
    }
  }

  const guardarCambios = async (fichaActualizada) => {
    try {
      await apiAdmin.put(`/fichas/${fichaActualizada.id_ficha}`, fichaActualizada)
      toast.success('Ficha actualizada correctamente.')
      // Actualizamos el listado después de guardar
      const { data } = await apiAdmin.get(`/fichas?searchTerm=${search}`)
      setFichas(data.data)
      setFichaSeleccionada(null) // Opcional: cierra el formulario después de guardar
    } catch (e) {
      console.error("Error al guardar cambios:", e)
      toast.error('Error al guardar los cambios.')
    }
  }

  const eliminarFicha = async (fichaId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta ficha? Esta acción es irreversible.")) {
      return
    }
    try {
      await apiAdmin.delete(`/fichas/${fichaId}`)
      toast.success('Ficha eliminada correctamente.')
      // Filtramos la ficha eliminada del listado
      setFichas(fichas.filter(f => f.id_ficha !== fichaId))
      setFichaSeleccionada(null)
    } catch (e) {
      console.error("Error al eliminar ficha:", e)
      toast.error('Error al eliminar la ficha.')
    }
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" richColors />
      <h1 className="text-3xl font-bold mb-6">Administrar Fichas de Desaparición</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Fichas</CardTitle>
          <CardDescription>
            Busca por nombre o apellido para encontrar una ficha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {fichaSeleccionada ? (
        <FichaFormulario
          ficha={fichaSeleccionada}
          onSave={guardarCambios}
          onCancel={() => setFichaSeleccionada(null)}
          onDelete={eliminarFicha}
        />
      ) : (
        <FichasListado
          fichas={fichas}
          loading={loading}
          error={error}
          onSelectFicha={seleccionarFicha}
        />
      )}
    </div>
  )
}