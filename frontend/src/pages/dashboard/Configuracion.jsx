import PerfilSection from '@/pages/dashboard/configuracion/PerfilSection'
import DatosFiscalesSection from '@/pages/dashboard/configuracion/DatosFiscalesSection'
import PlanSection from '@/pages/dashboard/configuracion/PlanesContratadosSection'
import CancelarCuentaSection from '@/pages/dashboard/configuracion/CancelarCuentaSection'
import DatosFiscalesServicio from './DatosFiscarlesServicio'

const Configuracion = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center">Configuración de cuenta</h1>

      <PerfilSection />
      <DatosFiscalesSection />
      <PlanSection />
      <DatosFiscalesServicio/>
      <CancelarCuentaSection />
    </div>
  )
}

export default Configuracion
