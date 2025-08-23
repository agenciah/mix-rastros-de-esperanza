import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import ChatbotAtencionClienteCard from "./ChatbotAtencionClientesCard"

const pasos = [
  {
    titulo: "Control de gastos",
    pasos: [
      "Manda un mensaje o una foto de tu ticket por WhatsApp",
      "El chatbot registra el gasto automáticamente",
      "Consulta o descarga tus gastos en Excel desde la plataforma",
    ],
  },
  {
    titulo: "Facturación de tickets",
    pasos: [
      "Envía una foto del ticket desde WhatsApp",
      "Validamos los datos (monto, fecha, establecimiento)",
      "Recibes la factura directamente en tu correo",
    ],
  },
  {
    titulo: "Chatbot de atención a clientes",
    pasos: [
      "Agendamos dos reuniones para definir qué debe hacer tu chatbot",
      "Creamos y conectamos tu bot a Google Sheets si es necesario",
      "Tu número queda listo para atender a tus clientes por WhatsApp",
    ],
  },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="w-full bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center mb-12 px-2">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          ¿Cómo funciona Simplika?
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Así de simple: seleccionas el servicio que necesitas, interactúas por WhatsApp, y dejas que la automatización haga el resto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-2 sm:px-0">
        {pasos.map((bloque, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="bg-white rounded-xl shadow p-6 text-left"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {bloque.titulo}
            </h3>
            <ul className="space-y-3">
              {bloque.pasos.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <div className="mt-12">
        <ChatbotAtencionClienteCard />
      </div>  
    </section>
  )
}
