import { differenceInDays } from 'date-fns';
import { countUserGastos } from '../db/gastos.js';

export async function isTrialActive(userDb) {
  const today = new Date();
  const trialStart = new Date(userDb.trial_start_date);
  const daysSinceStart = differenceInDays(today, trialStart);

  if (daysSinceStart > 15) {
    return false; // Trial expirado por tiempo
  }

  const totalGastos = await countUserGastos(userDb.id);
  if (totalGastos >= 50) {
    return false; // Trial expirado por cantidad de registros
  }

  return true; // Trial sigue activo
}
