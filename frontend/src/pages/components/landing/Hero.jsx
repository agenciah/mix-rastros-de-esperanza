import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="max-w-6xl w-full px-4 flex flex-col md:flex-row items-center justify-between gap-12">

        {/* Texto */}
        <div className="md:w-1/2 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Lleva el control de tus finanzas personales o de tu negocio... <br className="hidden md:inline" /> sin tanto rollo.
          </motion.h1>

          <motion.ul 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-700 space-y-2 mb-8 text-left"
          >
            <li>📸 Envía una foto de tu ticket por WhatsApp y registra tu gasto.</li>
            <li>🧾 Factura tus compras desde un mensaje.</li>
            <li>🤖 Deja que un chatbot atienda a tus clientes.</li>
          </motion.ul>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="text-gray-600 mb-8"
          >
            Todo en un solo lugar. Solo lo que necesitas. <br />
            Así de simple. Así de Simplika.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
          >
            <Button
              size="lg"
              className="text-lg bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate("/seleccionar-plan")}
            >
              Mira lo que ofrecemos
            </Button>

            <a
              href="https://wa.me/521234567890?text=Hola%2C%20quiero%20empezar%20a%20registrar%20mis%20gastos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button
                size="lg"
                variant="outline"
                className="text-lg border-blue-600 text-blue-600 hover:bg-green-500 border-green-500"
              >
                Registra tu primer gasto
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Video demo */}
        <div className="md:w-1/2 w-full flex justify-center">
          <motion.video
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.9 }}
            autoPlay
            muted
            loop
            playsInline
            className="w-full max-w-xs h-auto rounded-xl shadow-md"
          >
            <source src="/videos/simplika.mp4" type="video/mp4" />
            Tu navegador no soporta el video.
          </motion.video>
        </div>
      </div>
    </section>
  )
}
