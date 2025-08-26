import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import RasgosFisicosForm from "./RasgosFisicosForm"
import VestimentaForm from "./VestimentaForm"
import DatosPrincipalesForm from "./DatosPrincipalesForm"

export default function FichaFormLayout() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Registro de Ficha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Datos Principales */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Datos Principales</h2>
            <DatosPrincipalesForm />
          </section>
          <Separator />

          {/* Rasgos Físicos */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Rasgos Físicos</h2>
            <RasgosFisicosForm />
          </section>
          <Separator />

          {/* Vestimenta */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Vestimenta</h2>
            <VestimentaForm />
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
