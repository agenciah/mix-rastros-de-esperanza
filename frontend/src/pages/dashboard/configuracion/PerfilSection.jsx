
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
   // --- INICIO: Lógica para Donación Dinámica ---
    // 1. Estados para guardar el conteo de fichas y el estado de carga
  const [activeFichasCount, setActiveFichasCount] = useState(0);
  const [loadingFichas, setLoadingFichas] = useState(true);

   // 2. useEffect para buscar el número de fichas activas del usuario
    useEffect(() => {
        const fetchFichaStats = async () => {
            try {
                const response = await api.get('/api/fichas/user-stats');
                setActiveFichasCount(response.data.data.activeFichasCount);
            } catch (error) {
                console.error("Error al obtener estadísticas de fichas:", error);
                // No mostramos un error al usuario, simplemente no se mostrará el monto dinámico
            } finally {
                setLoadingFichas(false);
            }
        };

        fetchFichaStats();
    }, []); // El array vacío asegura que se ejecute solo una vez

    // 3. Lógica para calcular el monto sugerido
    let monto_sugerido = 60; // Monto base para 1 ficha
    if (activeFichasCount > 1) {
        monto_sugerido = 100; // Monto para 2 o más fichas
    }
    // --- FIN: Lógica para Donación Dinámica ---

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
      {/* --- INICIO: Tarjeta de Donación Dinámica Actualizada --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Donaciones para Mantenimiento de la Plataforma "Rastros de Esperanza"</CardTitle>
                    <CardDescription>
                        Para mantener tu ficha activa después del primer mes, te pedimos una donación mensual, durante el tiempo que utilices la plataforma..
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-blue-800">Tu Número de Referencia (úsalo en el concepto del pago):</p>
                        <p className="text-2xl font-bold text-blue-900 tracking-widest">{user?.numero_referencia_unico}</p>
                    </div>

                    {loadingFichas ? (
                        <p>Calculando monto sugerido...</p>
                    ) : (
                        <>
                            <p>Fichas activas actualmente: <strong>{activeFichasCount}</strong></p>
                            <p>Monto de donación: <strong className="text-xl">${monto_sugerido.toFixed(2)} MXN mensuales.</strong></p>
                        </>
                    )}
                    
                    <div className="pt-2">
                        <p><strong>Banco:</strong> [Nombre de tu Banco]</p>
                        <p><strong>CLABE Interbancaria:</strong> [Tu número de CLABE]</p>
                        <p><strong>Número de Tarjeta:</strong> [Tu número de tarjeta para depósitos]</p>
                    </div>
                </CardContent>
            </Card>
             {/* --- FIN: Tarjeta de Donación Dinámica Actualizada --- */}
    </div>

    
  )
}

export default PerfilSection
