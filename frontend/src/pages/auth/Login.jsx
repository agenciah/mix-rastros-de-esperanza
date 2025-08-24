import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import api from '@/lib/axios'
import LegalLayout from '@/layouts/LegalLayouts'

const schema = z.object({
  email: z.string().email({ message: 'Correo inválido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
})

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
      ...data,
      email: data.email.trim().toLowerCase()
    }
      const res = await api.post('api/auth/login', payload)
      const { user, token } = res.data

      

      login(user, token) // Actualiza contexto y localStorage
      console.log("token: ", token)
      toast.success('Bienvenido, sesión iniciada')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciales inválidas'
      toast.error(msg)
      console.error("Error en login:", err.response || err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LegalLayout>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-muted p-6 rounded-md w-full max-w-sm space-y-4 shadow">
          <h1 className="text-xl font-bold text-center">Iniciar sesión</h1>

          <div>
            <label className="text-sm">Correo electrónico</label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm">Contraseña</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                Regístrate aquí
              </Link>
            </p>
            <p>
              ¿Olvidaste tu contraseña?{' '}
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Recuperarla aquí
              </Link>
            </p>
          </div>

        </form>
      </LegalLayout>
    </div>
  )
}

export default Login
