import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import LegalLayout from '@/layouts/LegalLayouts'
import { useEffect } from 'react'

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

const ResetPassword = () => {
  const { token } = useParams() // ✅ ahora viene desde la URL directamente
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido o expirado')
      navigate('/login')
    }
  }, [token, navigate])

  const onSubmit = async ({ password }) => {
  try {
    await api.post('/api/auth/reset-password', { token, newPassword: password })  // aquí cambio
    toast.success('Contraseña actualizada. Inicia sesión.')
    navigate('/login')
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al actualizar la contraseña'
    toast.error(msg)
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center">
      <LegalLayout>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-muted p-6 rounded-md w-full max-w-sm space-y-4 shadow">
          <h1 className="text-xl font-bold text-center">Nueva contraseña</h1>

          <div>
            <label className="text-sm">Contraseña</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-sm">Confirmar contraseña</label>
            <Input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full">Actualizar</Button>
        </form>
      </LegalLayout>
    </div>
  )
}

export default ResetPassword
