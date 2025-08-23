export const PLANES = [
  //frontend/src/constants/planes.js
  {
    id: "plan_49", // Plan básico
    nombre: "Plan Básico",
    precio: 49,
    descripcion: [
      "Registro ilimitado de gastos",
      "Exportación a Excel",
      "Soporte por WhatsApp"
    ],
    incluyeRegistro: true,
    incluyeFacturacion: false,
    incluyeChatbot: false
  },
  {
    id: "plan_250",
    nombre: "Plan Facturación 25",
    precio: 250,
    descripcion: [
      "Incluye Plan Básico",
      "25 facturas al mes",
      "Facturación de tickets con una foto desde whastapp"
    ],
    incluyeRegistro: true,
    incluyeFacturacion: true,
    incluyeChatbot: false
  },
  {
    id: "plan_450",
    nombre: "Plan Facturación 50",
    precio: 450,
    descripcion: [
      "Incluye Plan Básico",
      "50 facturas al mes",
      "Facturación de tickets con una foto desde whastapp"
    ],
    incluyeRegistro: true,
    incluyeFacturacion: true,
    incluyeChatbot: false
  },
  {
    id: "plan_500_chatbot",
    nombre: "Chatbot Atención al Cliente",
    precio: 500,
    descripcion: [
      "Chatbot personalizado",
      "Soporte de atención al cliente vía WhatsApp",
      "Respuestas automatizadas"
    ],
    incluyeRegistro: true,
    incluyeFacturacion: false,
    incluyeChatbot: true
  },
  {
    id: "plan_250_chatbot",
    nombre: "Facturación 25 + Chatbot",
    precio: 750,
    descripcion: [
      "25 facturas al mes",
      "Facturación de tickets con una foto desde whastapp",
      "Chatbot atención al cliente"
    ],
    incluyeRegistro: true,
    incluyeFacturacion: true,
    incluyeChatbot: true
  },
  {
    id: "plan_450_chatbot",
    nombre: "Facturación 50 + Chatbot",
    precio: 950,
    descripcion: [
      "50 facturas al mes",
      "Facturación de tickets con una foto desde whastapp",
      "Chatbot atención al cliente"
    ],
    incluyeRegistro: true,
    incluyeFacturacion: true,
    incluyeChatbot: true
  }
];
