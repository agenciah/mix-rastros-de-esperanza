import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PLANES } from "@/constants/planes";
import ChatbotAtencionClienteCard from "./ChatbotAtencionClientesCard";

const PlanSelectorLanding = () => {
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [esAnual, setEsAnual] = useState(false);
  const navigate = useNavigate();

  const handleSeleccion = (id) => {
    setPlanSeleccionado(id);
  };

  const handleContinuar = () => {
    if (!planSeleccionado || !PLANES[planSeleccionado]) {
      alert("Selecciona un plan válido antes de continuar.");
      return;
    }

    const plan = PLANES[planSeleccionado];

    localStorage.setItem(
      "planSeleccionado",
      JSON.stringify({
        ...plan,
        esAnual,
      })
    );

    navigate("/register"); // Ajusta la ruta si usas "/registro"
  };

  return (
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Elige tu plan</h2>
        <p className="mt-4 text-lg text-gray-600">
          Selecciona el plan que mejor se adapte a tu negocio.
        </p>
          <ChatbotAtencionClienteCard />
      </div>

      <div className="flex justify-center items-center mb-6">
        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={esAnual}
            onChange={() => setEsAnual(!esAnual)}
            className="h-5 w-5 text-blue-600"
          />
          <span>Quiero pagar de forma anual (11 meses)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {Object.entries(PLANES).map(([id, plan]) => {
          const seleccionado = planSeleccionado === id;
          const precio = esAnual ? plan.precio * 11 : plan.precio;

          return (
            <div
              key={id}
              className={`border rounded-xl p-6 cursor-pointer transition duration-200 shadow-sm hover:shadow-md ${
                seleccionado ? "border-blue-500 ring-2 ring-blue-400" : "border-gray-300"
              }`}
              onClick={() => handleSeleccion(id)}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.nombre}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                ${precio} {esAnual ? "/año" : "/mes"}
              </p>
              <ul className="text-gray-700 list-disc list-inside space-y-1 text-sm">
                {Array.isArray(plan.descripcion)
                  ? plan.descripcion.map((caracteristica, i) => (
                      <li key={i}>{caracteristica}</li>
                    ))
                  : <li>{plan.descripcion}</li>}
                {plan.incluye && plan.incluye.includes("registro_gastos") && (
                  <li>Incluye registro de gastos ($49)</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={handleContinuar}
          disabled={!planSeleccionado}
          className={`px-6 py-3 text-white rounded-lg font-semibold transition ${
            planSeleccionado
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default PlanSelectorLanding;
