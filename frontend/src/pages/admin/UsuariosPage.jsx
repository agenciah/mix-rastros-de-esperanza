/* eslint-disable no-irregular-whitespace */
// 📁 src/pages/adminUsuariosPage.js
import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import apiAdmin from '@/lib/axiosAdmin'
import DatosPersonales from './usuarios/Datospersonales'
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchUsuarios() {
      setLoading(true)
      try {
        const { data } = await apiAdmin.get('/usuarios')
        setUsuarios(data)
      } catch (e) {
        setError('Error al cargar la lista de usuarios')
        toast.error('Error al cargar la lista de usuarios')
      } finally {
        setLoading(false)
      }
    }
    fetchUsuarios()
  }, [])

  function seleccionarUsuario(usuarioId) {
    const usuario = usuarios.find(u => u.id === usuarioId)
    setUsuarioSeleccionado(usuario)
  }

  const usuariosFiltrados = usuarios.filter((user) =>
    user.nombre.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.telefono && user.telefono.includes(search))
  )

  function actualizarUsuarioCampo(campo, valor) {
    setUsuarioSeleccionado((prev) => ({ ...prev, [campo]: valor }))
  }

  async function guardarCambios() {
    if (!usuarioSeleccionado) return

    const {
      id,
      nombre,
      email,
      telefono,
      estado_republica,
      role,
      estado_suscripcion,
      cancelado,
    } = usuarioSeleccionado

    try {
      await apiAdmin.put(`/usuarios/${id}`, {
        nombre,
        email,
        telefono,
        estado_republica,
        role,
        estado_suscripcion,
        cancelado,
      })
      toast.success('Usuario actualizado correctamente')
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      toast.error('Error al actualizar usuario')
    }
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" richColors />
      <h1 className="text-3xl font-bold mb-6">Administrar Usuarios</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar y Filtrar</CardTitle>
          <CardDescription>
            Busca por nombre, email o teléfono para encontrar un usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            {usuariosFiltrados.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Rol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map(user => (
                    <TableRow key={user.id} onClick={() => seleccionarUsuario(user.id)} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>{user.nombre}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.telefono}</TableCell>
                      <TableCell>{user.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500">No se encontraron usuarios.</p>
            )}
          </CardContent>
        </Card>
      )}

      {usuarioSeleccionado && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Editar Usuario</CardTitle>
            <CardDescription>
              Modifica la información del usuario y guarda los cambios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DatosPersonales usuario={usuarioSeleccionado} onChange={actualizarUsuarioCampo} />
            <Button
              onClick={guardarCambios}
              className="w-full mt-4"
            >
              Guardar cambios
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}