import { differenceInDays } from 'date-fns';

export function isTrialActive(userDb) {
  if (userDb.plan !== 'trial') return false;

  const days = differenceInDays(new Date(), new Date(userDb.trial_start_date));
  return days <= 15 && userDb.gastos_registrados < 50;
}
