// RUTA: src/components/landing/Hero.jsx

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.png"; // Asegúrate de tener una imagen en esta ruta

export default function Hero() {
    const navigate = useNavigate();

    return (
        <section className="w-full min-h-[calc(100vh-70px)] flex items-center bg-white text-gray-900">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 items-center gap-12">

                {/* Columna de Texto */}
                <div className="text-center md:text-left">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight"
                    >
                        Uniendo los Rastros,
                        <span className="text-blue-600"> Creando Esperanza.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="text-lg md:text-xl text-gray-600 mb-8"
                    >
                        La información de personas no reclamadas en hospitales, albergues, instituciones de gobierno como fiscalias, semefos, reclusorios, fosas o en situación de calle es un rastro vital que a menudo se pierde porque no esta centralizada. <strong>Hasta Encontrarte</strong> es la primera plataforma ciudadana que conecta las fichas de búsqueda de las familias con reportes de hallazgos que las mismas familias suben de todo el país.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.3, delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
                    >
                        <Button
                            size="lg"
                            className="text-lg"
                            onClick={() => navigate("/register")}
                        >
                            Crear Ficha de Búsqueda
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg"
                            onClick={() => navigate("/dashboard/hallazgos/crear")}
                        >
                            Reportar un Hallazgo
                        </Button>
                    </motion.div>
                </div>

                {/* Columna de Imagen */}
                <div className="flex justify-center">
                     <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                        src={heroImage}
                        alt="Manos uniéndose en señal de esperanza"
                        className="rounded-lg shadow-xl w-full max-w-md"
                    />
                </div>
            </div>
        </section>
    );
}