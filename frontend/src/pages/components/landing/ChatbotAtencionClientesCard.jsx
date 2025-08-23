import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Bot } from "lucide-react";

const ChatbotAtencionClienteCard = () => {
  return (
    <Card className="w-full max-w-xl mx-auto bg-white border-gray-200 shadow-sm rounded-2xl p-4">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Chatbot de Atención al Cliente</h2>
        </div>
        <p className="text-gray-600">
          Simplika te ofrece un chatbot listo para integrarse con WhatsApp y atender automáticamente a tus clientes.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Responde mensajes automáticamente 24/7.</li>
          <li>Atiende consultas comunes (horarios, ubicación, precios, etc).</li>
          <li>Recibe mensajes de texto, imágenes y documentos.</li>
          <li>Personalizable con tus propios flujos.</li>
        </ul>
        <div className="flex items-center gap-2 mt-2">
          <BadgeCheck size={18} className="text-green-500" />
          <span className="text-sm text-gray-600">
            Disponible únicamente si contrataste algún plan de atención al cliente.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotAtencionClienteCard;
