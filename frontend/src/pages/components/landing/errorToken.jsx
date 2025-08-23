import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import LegalLayout from '@/layouts/LegalLayouts'

const ErrorToken = () => {
  const navigate = useNavigate()

  return (
    <LegalLayout>
      <div className="min-h-screen flex flex-col justify-center items-center px-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Token inválido o expirado</h1>
        <p className="text-gray-700 mb-6">
          El enlace de confirmación ya no es válido. Es posible que ya lo hayas usado o que haya expirado.
        </p>
        <Button onClick={() => navigate('/seleccionar-plan')}>
          Volver a seleccionar plan
        </Button>
      </div>
    </LegalLayout>
  )
}

export default ErrorToken
