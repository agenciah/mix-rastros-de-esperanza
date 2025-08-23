import { useEffect, useState } from 'react'
import GastoForm from '../../components/GastoForm'
import { Pencil, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '@/lib/axios'
import { toast } from "sonner";

const Gastos = () => {
  const [gastos, setGastos] = useState([])
  const [editando, setEditando] = useState(null)
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [filtroAnio, setFiltroAnio] = useState('')
  const [filtroMes, setFiltroMes] = useState('')

  const fetchGastos = async () => {
    try {
      const { data } = await api.get('/gastos')
      if (!Array.isArray(data.gastos)) {
        throw new Error('Formato de respuesta inválido')
      }
      setGastos(data.gastos)
    } catch (error) {
      console.error('❌ Error al cargar los gastos:', error.message)
      setGastos([])
      toast.error('No se pudieron cargar los gastos')
    }
  }

  useEffect(() => {
    fetchGastos()
  }, [])

  const handleAgregar = async () => {
    await fetchGastos();      // refrescar lista desde backend
    setEditando(null);
    setMostrandoFormulario(false);
  };


  const handleEditar = (gasto) => {
    setEditando(gasto)
    setMostrandoFormulario(true)
  }

  const handleEliminar = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este gasto?')
    if (!confirmar) return

    try {
      await api.delete(`/gastos/${id}`)
      setGastos(gastos.filter(gasto => gasto.id !== id))
      toast.success('Gasto eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar gasto:', error)
      toast.error('No se pudo eliminar el gasto')
    }
  }

  const handleCancelar = () => {
    setEditando(null)
    setMostrandoFormulario(false)
  }

  // Calcula años dinámicamente
  const years = Array.from(new Set(gastos.map(g => new Date(g.fecha).getFullYear()))).sort()
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const gastosFiltrados = gastos.filter((gasto) => {
    const fecha = new Date(gasto.fecha)
    const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
    const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
    return cumpleAnio && cumpleMes
  })

  const exportarExcel = () => {
    const data = gastosFiltrados.map((g) => ({
      Descripción: g.descripcion,
      Monto: g.monto,
      Fecha: new Date(g.fecha).toLocaleDateString('es-MX'),
      Tipo: g.tipo_gasto,
      Facturado: g.es_facturable ? 'Sí' : 'No',
      FormaPago: g.forma_pago || '',
      Categoría: g.categoria || '',
      Notas: g.notas || ''
    }))

    const hoja = XLSX.utils.json_to_sheet(data)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Gastos')
    XLSX.writeFile(libro, 'gastos.xlsx')
  }

  return (
    <div className="space-y-6">
      {!mostrandoFormulario ? (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center mt-4 mb-2">
            <div>
              <label className="text-sm mr-2">Año:</label>
              <select
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(e.target.value)}
                className="border border-gray-300 px-2 py-1 rounded"
              >
                <option value="">Todos</option>
                {years.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm mr-2">Mes:</label>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="border border-gray-300 px-2 py-1 rounded"
              >
                <option value="">Todos</option>
                {months.map((mes, index) => (
                  <option key={index} value={index + 1}>{mes}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setMostrandoFormulario(true)}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Nuevo gasto
            </button>
            <button
              onClick={exportarExcel}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exportar a Excel
            </button>
          </div>

          {/* Total */}
          <div className="text-right text-lg font-semibold text-gray-800 mb-2">
            Total: ${gastosFiltrados.reduce((acc, g) => acc + Number(g.monto), 0).toFixed(2)}
          </div>

          {/* Tabla */}
          <h2 className="text-xl font-bold">Lista de gastos</h2>
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Descripción</th>
                <th className="border px-4 py-2">Monto</th>
                <th className="border px-4 py-2">Fecha</th>
                <th className="border px-4 py-2">Tipo</th>
                <th className="border px-4 py-2">Facturado</th>
                <th className="border px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">
                    No hay gastos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((gasto) => (
                  <tr key={gasto.id}>
                    <td className="border px-4 py-2">{gasto.descripcion}</td>
                    <td className="border px-4 py-2">${gasto.monto}</td>
                    <td className="border px-4 py-2">{new Date(gasto.fecha).toLocaleDateString('es-MX')}</td>
                    <td className="border px-4 py-2">{gasto.tipo_gasto}</td>
                    <td className="border px-4 py-2 text-center">
                      {gasto.es_facturable ? '✅' : '❌'}
                    </td>
                    <td className="border px-4 py-2 flex items-center gap-2">
                      <button
                        onClick={() => handleEditar(gasto)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Editar"
                        aria-label="Editar gasto"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleEliminar(gasto.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Eliminar"
                        aria-label="Eliminar gasto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">
            {editando ? 'Editar gasto' : 'Registrar nuevo gasto'}
          </h2>
          <GastoForm onSubmitSuccess={handleAgregar} gastoEditado={editando} />
          <button
            onClick={handleCancelar}
            className="mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

export default Gastos
