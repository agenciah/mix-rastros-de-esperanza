import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'

const schema = z.object({
  nombre: z.string().min(2, 'Debe tener al menos 2 caracteres'),
  email: z.string().email('Correo inválido'),
  telefono: z.string().optional(),
});

const PerfilSection = () => {
  const { user, login } = useAuth()
  const [editando, setEditando] = useState(false)
  const [passwordData, setPasswordData] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  })
  const [cargandoPass, setCargandoPass] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: user?.nombre || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
    },
  })

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const cambiarPassword = async () => {
    const { actual, nueva, confirmar } = passwordData

    if (!actual || !nueva || !confirmar) {
      toast.warning('Completa todos los campos')
      return
    }

    if (nueva !== confirmar) {
      toast.error('La nueva contraseña no coincide')
      return
    }

    try {
      setCargandoPass(true)
      await api.put('/usuarios/cambiar-password', {
        actual,
        nueva,
      })

      toast.success('Contraseña actualizada correctamente')
      setPasswordData({ actual: '', nueva: '', confirmar: '' })
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Contraseña actual incorrecta')
      } else {
        toast.error('Error al actualizar la contraseña')
      }
    } finally {
      setCargandoPass(false)
    }
  }

  const onSubmit = async (data) => {
  try {
    const res = await api.put('/usuarios/perfil', {
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
    })

    login({ ...user, nombre: res.data.usuario.nombre, email: res.data.usuario.email, telefono: res.data.usuario.telefono }, localStorage.getItem('token'))
    toast.success('Datos actualizados correctamente')
    setEditando(false)
  } catch (err) {
    toast.error('Error al actualizar el perfil')
  }
}

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h2 className="text-lg font-semibold">Perfil de usuario</h2>

      {!editando ? (
        <div className="space-y-2">
          <p><strong>Nombre:</strong> {user?.nombre}</p>
          <p><strong>Correo:</strong> {user?.email}</p>
          <p><strong>Telefono:</strong> {user?.telefono}</p>
          <Button variant="outline" onClick={() => setEditando(true)}>
            Editar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm">Nombre</label>
            <Input {...register('nombre')} />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm">Correo</label>
            <Input type="email" {...register('email')}/>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm">Teléfono</label>
            <Input type="text" {...register('telefono')} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Guardar</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="border rounded-md p-4 space-y-4">
        <h3 className="text-md font-semibold">Cambiar contraseña</h3>

        <div className="space-y-2">
          <div>
            <label className="text-sm">Contraseña actual</label>
            <Input
              type="password"
              name="actual"
              value={passwordData.actual}
              onChange={handlePasswordChange}
            />
          </div>
          <div>
            <label className="text-sm">Nueva contraseña</label>
            <Input
              type="password"
              name="nueva"
              value={passwordData.nueva}
              onChange={handlePasswordChange}
            />
          </div>
          <div>
            <label className="text-sm">Confirmar nueva contraseña</label>
            <Input
              type="password"
              name="confirmar"
              value={passwordData.confirmar}
              onChange={handlePasswordChange}
            />
          </div>
          <Button onClick={cambiarPassword} disabled={cargandoPass}>
            {cargandoPass ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PerfilSection
