// RUTA: src/components/landing/CTASection.jsx

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
    const navigate = useNavigate();
    return (
        <section className="w-full bg-blue-50 py-20">
            <div className="max-w-3xl mx-auto px-4 text-center">
                <motion.h2 /* ... (animaciones) ... */ className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Cada dato cuenta. Cada búsqueda importa.
                </motion.h2>
                <motion.p /* ... (animaciones) ... */ className="text-gray-700 text-lg md:text-xl mb-8">
                    Tu participación puede ser la pieza clave para reunir a una familia. Únete a la red de búsqueda y creemos esperanza juntos.
                </motion.p>
                <motion.div /* ... (animaciones) ... */>
                    <Button size="lg" className="text-lg" onClick={() => navigate("/register")}>
                        Empezar Ahora (Es Gratis)
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}