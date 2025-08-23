import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircleHeart,
  Bot,
  Clock3,
  Settings,
  Users,
  XCircle,
  Zap,
  CalendarClock,
  TrendingUp,
  Handshake,
  RefreshCw,
} from "lucide-react";

export default function ChatbotServicio() {
  return (
    <section className="py-8 md:py-12 px-4 md:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-800 mb-4">
          Nunca pierdas una venta por no responder en WhatsApp
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
          Automatiza tus respuestas frecuentes, recibe datos de tus clientes,
          registra gastos por WhatsApp y da atención 24/7 con un chatbot funcional, sin necesidad de pagar una agencia o programar nada.
        </p>
        
        {/* Botón de acción principal */}
        <Button asChild className="text-white text-md px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
          <Link to="/contacto">¡Quiero mi chatbot!</Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto mt-10 grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm border border-gray-200 bg-white">
          <CardContent className="p-6 text-gray-800 space-y-4 text-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600" />
              ¿Qué incluye el servicio?
            </h3>
            <ul className="list-disc pl-4 space-y-2">
              <li className="flex gap-2 items-start">
                <Settings className="w-4 h-4 mt-1 text-gray-500" />
                Configuración completa de chatbot en WhatsApp.
              </li>
              <li className="flex gap-2 items-start">
                <MessageCircleHeart className="w-4 h-4 mt-1 text-gray-500" />
                Diseño del flujo conversacional personalizado.
              </li>
              <li className="flex gap-2 items-start">
                <Zap className="w-4 h-4 mt-1 text-gray-500" />
                Respuestas automáticas para preguntas frecuentes.
              </li>
              <li className="flex gap-2 items-start">
                <Users className="w-4 h-4 mt-1 text-gray-500" />
                Formulario para captar leads o datos de clientes.
              </li>
              <li className="flex gap-2 items-start">
                <Clock3 className="w-4 h-4 mt-1 text-gray-500" />
                Capacitación y soporte por parte de nuestro equipo.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200 bg-white">
          <CardContent className="p-6 text-gray-800 space-y-4 text-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              ¿Qué no incluye?
            </h3>
            <ul className="list-disc pl-4 space-y-2">
              <li>Integraciones externas como HubSpot, Notion, Airtable, etc.</li>
              <li>Conexión directa con tu sistema administrativo (por ahora).</li>
              <li>Flujos complejos tipo IA o bots con lenguaje natural (por ahora).</li>
              <li>Soporte fuera del horario laboral.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-xl shadow text-gray-700 text-sm">
        <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-blue-500" />
          Condiciones del servicio
        </h4>
        <ul className="list-disc pl-4 space-y-2">
          <li>Incluye 2 sesiones por Zoom para conocer las necesidades del negocio.</li>
          <li>
            El tiempo de entrega estimado es de <strong>3 días hábiles</strong> para cubrir
            la compra de línea, configuración con Meta, y ajustes en API.
          </li>
        </ul>
      </div>

      {/* Sección con las condiciones de cambios y costos */}
      <div className="max-w-4xl mx-auto mt-10 bg-yellow-50 p-6 rounded-xl shadow-inner border border-yellow-200 text-gray-700 text-sm">
        <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-yellow-700" />
          Cambios y Reestructuración
        </h4>
        <p className="mb-2">
          La mensualidad del servicio cubre el funcionamiento y el hosting del bot. Si en el futuro necesitas modificar flujos, preguntas o respuestas, es necesario agendar una nueva sesión de trabajo con nuestro equipo para realizar la <strong>reestructuración</strong>.
        </p>
        <p className="font-bold text-base">
          Este servicio de reestructuración tiene un costo único de <span className="text-xl text-yellow-800">$1,000 MXN</span> (o <span className="text-xl text-yellow-800">$50 USD</span>).
        </p>
        <p className="mt-2 text-sm">
          Esto nos permite dedicar el tiempo necesario para implementar los cambios y garantizar que tu chatbot siga funcionando a la perfección.
        </p>
        <Button asChild className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white">
          <Link to="https://calendly.com/alejandro-agenciah/30min">Solicitar cambios</Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-xl shadow text-gray-700 text-sm">
        <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          ¿Por qué elegir Simplika?
        </h4>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            <strong>Evita pagar $8,000 MXN+</strong> por un bot hecho desde cero. Obtén lo esencial desde solo <strong>$500 MXN/mes</strong>.
          </li>
          <li>Chatbots listos sin curva de aprendizaje ni complicaciones técnicas.</li>
          <li>Atención humana durante la configuración y seguimiento constante.</li>
        </ul>
      </div>

      <div className="max-w-4xl mx-auto mt-10 text-center">
        <p className="font-medium text-lg text-gray-800 mb-4">
          ¿Listo para automatizar tu negocio y captar más clientes?
        </p>
        <Button asChild className="text-white text-md px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
          {/* Aquí es donde debes pegar tu enlace de Calendly */}
          <Link to="https://calendly.com/alejandro-agenciah/30min">Agendar videollamada gratuita</Link>
        </Button>
      </div>
    </section>
  );
}
