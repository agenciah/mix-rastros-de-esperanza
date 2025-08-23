// 📁 middleware/planMiddleware.js

export function checkPlan(permittedPlans = []) {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.plan) {
      return res.status(401).json({ error: 'Usuario no autenticado o sin plan' });
    }

    const planesUsuario = Array.isArray(user.plan) ? user.plan : [user.plan];

    const tienePlanPermitido = planesUsuario.some(plan => permittedPlans.includes(plan));

    if (!tienePlanPermitido) {
      return res.status(403).json({ error: `Acceso denegado: se requiere uno de los planes: ${permittedPlans.join(', ')}` });
    }

    next();
  };
}
