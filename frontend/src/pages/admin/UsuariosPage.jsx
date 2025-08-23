import { useState } from 'react'
import apiAdmin from '@/lib/axiosAdmin'
import DatosPersonales from './usuarios/Datospersonales'
import DatosFiscales from './usuarios/DatosFiscales'
import DatosPlan from './usuarios/DatosPlan'

export default function UsuariosPage() {
  const [search, setSearch] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function buscarUsuario() {
    if (!search.trim()) return
    setLoading(true)
    setError(null)

    try {
      const { data } = await apiAdmin.get('/usuarios', {
        params: { q: search }
      })

      if (data.length === 0) {
        setUsuario(null)
        setError('Usuario no encontrado')
      } else {
        setUsuario(data[0])
      }
    } catch (e) {
      setError('Error al buscar usuario')
      setUsuario(null)
    } finally {
      setLoading(false)
    }
  }

  function actualizarUsuarioCampo(campo, valor) {
    setUsuario((prev) => ({ ...prev, [campo]: valor }))
  }

  async function guardarCambios() {
    try {
      const { id, ...camposActualizar } = usuario

      // Convertir objetos complejos a string si es necesario
      const camposProcesados = { ...camposActualizar }

      if (Array.isArray(camposProcesados.plan)) {
        camposProcesados.plan = JSON.stringify(camposProcesados.plan)
      }

      if (typeof camposProcesados.datos_fiscales === 'object') {
        camposProcesados.datos_fiscales = JSON.stringify(camposProcesados.datos_fiscales)
      }

      if (typeof camposProcesados.datos_fiscales_servicio === 'object') {
        camposProcesados.datos_fiscales_servicio = JSON.stringify(camposProcesados.datos_fiscales_servicio)
      }

      await apiAdmin.put(`/admin/usuarios/${id}`, camposProcesados)
      alert('Usuario actualizado correctamente')
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      alert('Error al actualizar usuario')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Administrar Usuarios</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar usuario por nombre, email o teléfono"
          className="input flex-grow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarUsuario()}
        />
        <button
          onClick={buscarUsuario}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {usuario ? (
        <>
          <DatosPersonales usuario={usuario} onChange={actualizarUsuarioCampo} />
          <DatosFiscales usuario={usuario} onChange={actualizarUsuarioCampo} />
          <DatosPlan usuario={usuario} onChange={actualizarUsuarioCampo} />

          <button
            onClick={guardarCambios}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar cambios
          </button>
        </>
      ) : (
        <p>No hay usuario seleccionado</p>
      )}
    </div>
  )
}
