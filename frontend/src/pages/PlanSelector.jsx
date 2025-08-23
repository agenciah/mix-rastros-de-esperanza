import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // Recomendado usar el contexto
import { useNavigate } from 'react-router-dom';

const PLANES_DISPONIBLES = [
  { id: 'plan_49', nombre: 'Plan Básico ($49)' },
  { id: 'plan_250', nombre: 'Facturación 25 ($250)' },
  { id: 'plan_450', nombre: 'Facturación 50 ($450)' },
  // ... (los demás planes)
];

const PlanSelector = () => {
  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, fetchUser } = useAuth(); // Obtén el usuario y una función para refrescarlo
  const navigate = useNavigate();

  // Carga el plan actual del usuario
  useEffect(() => {
    console.log('🔵 [PlanSelector] 1. useEffect se ejecuta. Usuario del contexto:', user);
    if (user?.plan && Array.isArray(user.plan) && user.plan.length > 0) {
      const planId = user.plan[0];
      console.log(`🔵 [PlanSelector] 2. Plan actual detectado del usuario: "${planId}" (Tipo: ${typeof planId})`);
      setPlanSeleccionado(planId);
    } else {
      console.log('🔵 [PlanSelector] 2. No se encontró un plan válido en el usuario del contexto. `user.plan`:', user?.plan);
    }
  }, [user]);

  const guardarPlan = async () => {
    console.log(`🔴 [PlanSelector] 5. Click en "Guardar". Estado actual de \`planSeleccionado\`: "${planSeleccionado}" (Tipo: ${typeof planSeleccionado})`);
    
    if (!planSeleccionado) {
        console.error('❌ [PlanSelector] Error: No hay ningún plan seleccionado para guardar.');
        toast.error('Debes seleccionar un plan antes de guardar.');
        return;
    }

    const payload = { planes: [planSeleccionado] };
    console.log('🔴 [PlanSelector] 6. Payload que se enviará a la API:', payload);

    setLoading(true);
    try {
      const response = await api.put('/usuarios/actualizar-planes', payload);
      console.log('✅ [PlanSelector] 7. ÉXITO en la API. Respuesta del servidor:', response.data);
      await fetchUser();
      toast.success('Plan actualizado correctamente!');
      navigate('/dashboard/configuracion');
    } catch (error) {
      console.error('❌ [PlanSelector] 7. ERROR en la API. Detalles del error:', error);
      if (error.response) {
        console.error('❌ Data de la respuesta de error:', error.response.data);
        toast.error(`Error del servidor: ${error.response.data.error || 'Error desconocido'}`);
      } else {
        toast.error('No se pudo conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Selecciona tu plan</h2>

      <div className="space-y-2">
        {PLANES_DISPONIBLES.map((plan) => (
          <label key={plan.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
            <input
              type="radio"
              name="plan"
              value={plan.id}
              // Esta comparación ahora funciona porque ambos son strings.
              checked={planSeleccionado === plan.id}
              onChange={() => setPlanSeleccionado(plan.id)}
              className="accent-blue-600"
            />
            <span>{plan.nombre}</span>
          </label>
        ))}
      </div>

      <button
        onClick={guardarPlan}
        disabled={loading || !planSeleccionado}
        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
};

export default PlanSelector;