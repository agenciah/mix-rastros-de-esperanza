import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const preguntas = [
  {
    q: "¿Necesito tener un negocio para usar Simplika?",
    a: "No. Cualquier persona puede registrar y llevar control de sus gastos desde WhatsApp, incluso sin facturar."
  },
  {
    q: "¿Cómo funciona la facturación?",
    a: "Solo debes enviar una foto de tu ticket por WhatsApp. Nosotros verificamos los datos y enviamos la factura al correo que registraste."
  },
  {
    q: "¿Qué incluye el plan de chatbots?",
    a: "Incluye el diseño y configuración de un chatbot personalizado para tu negocio, integrado con Google Sheets si lo necesitas."
  },
  {
    q: "¿Puedo combinar planes?",
    a: "Sí. Puedes elegir solo el control de gastos, o agregar facturación y chatbots de forma combinada."
  },
  {
    q: "¿Hay compromiso de permanencia?",
    a: "No. Puedes cancelar cuando quieras."
  }
]


export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null)

  const toggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section id="faq" className="bg-white w-full py-16 px-4 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-10">
          Preguntas frecuentes
        </h2>

        <div className="space-y-4">
          {preguntas.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(index)}
                aria-expanded={activeIndex === index}
                aria-controls={`faq-panel-${index}`}
                id={`faq-header-${index}`}
                className="flex justify-between items-center w-full px-5 py-4 text-left text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
              >
                <span className="font-medium">{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${activeIndex === index ? "rotate-180" : "rotate-0"}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {activeIndex === index && (
                  <motion.div
                    id={`faq-panel-${index}`}
                    role="region"
                    aria-labelledby={`faq-header-${index}`}
                    initial={{ maxHeight: 0, opacity: 0 }}
                    animate={{ maxHeight: 500, opacity: 1 }}
                    exit={{ maxHeight: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-6 text-sm text-gray-600 overflow-hidden bg-gray-50"
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
