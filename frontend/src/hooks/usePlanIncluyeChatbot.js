// /hooks/usePlanIncluyeChatbot.js

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function usePlanIncluyeChatbot() {
  const { user, loading } = useAuth();

  const incluyeChatbot = useMemo(() => {
    // Si está cargando o no hay usuario/plan, el resultado es falso.
    if (loading || !user || !user.plan) {
      return false;
    }

    // El `user.plan` que recibimos del contexto ya es un array, ¡no más parseo!
    const planesDelUsuario = user.plan;
    
    const planesConChatbot = [
      'plan_250_chatbot',
      'plan_450_chatbot',
      'plan_500_chatbot'
    ];

    // La comprobación es directa y más segura
    return Array.isArray(planesDelUsuario) && planesDelUsuario.some(p => planesConChatbot.includes(p));

  }, [user, loading]);

  return incluyeChatbot;
}