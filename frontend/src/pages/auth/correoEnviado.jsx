import LegalLayout from '@/layouts/LegalLayouts'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CorreoEnviado = () => {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const emailGuardado = localStorage.getItem('correoRegistrado')
    if (emailGuardado) {
      setEmail(emailGuardado)
    } else {
      // Si no hay correo registrado, redirigimos para evitar pantalla en blanco
      navigate('/')
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LegalLayout>
        <div className="bg-muted p-6 rounded-md max-w-sm w-full space-y-4 shadow text-center">
          <h1 className="text-xl font-bold">📩 ¡Revisa tu correo!</h1>
          <p>Te hemos enviado un enlace de confirmación a:</p>
          <p className="font-semibold text-sm text-blue-700">{email}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Si no lo ves, revisa tu carpeta de spam o promociones.
          </p>
        </div>
      </LegalLayout>
    </div>
  )
}

export default CorreoEnviado
