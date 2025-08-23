import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import ChatbotAtencionClienteCard from "./ChatbotAtencionClientesCard"

export default function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="w-full bg-blue-50 py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
        >
          Simplika se adapta a ti
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-700 text-lg md:text-xl mb-8"
        >
          Ya sea para controlar tus finanzas, facturar tus tickets o automatizar tu atención al cliente, empieza hoy mismo con el plan que necesitas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4 }}
        >
          <Button
            size="lg"
            className="text-lg bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate("/seleccionar-plan")}
          >
            Elige tu plan
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
