import { motion } from "framer-motion"
import { CheckCircle, FileText, Bot } from "lucide-react"

const beneficios = [
  {
    icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
    title: "Registra tus gastos desde WhatsApp",
    description: "Manda un mensaje o una foto de tu ticket y listo. Lleva el control de tus finanzas sin apps complicadas.",
  },
  {
    icon: <FileText className="h-8 w-8 text-blue-600" />,
    title: "Factura tus compras fácilmente",
    description: "Envía tus tickets por WhatsApp y nosotros generamos tus facturas. Ideal para freelancers, negocios o emprendedores.",
  },
  {
    icon: <Bot className="h-8 w-8 text-blue-600" />,
    title: "Automatiza tu atención al cliente",
    description: "Recibe y responde mensajes automáticamente con un chatbot que trabaja por ti, 24/7.",
  },
]

export default function Beneficios() {
  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-12"
        >
          ¿Qué puede hacer Simplika por ti?
        </motion.h2>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {beneficios.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition-all text-center sm:text-left"
            >
              <div className="mb-4 flex justify-center sm:justify-start">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto sm:mx-0">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
