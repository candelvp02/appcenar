export const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/login');
};

export const isGuest = (req, res, next) => {
  if (!req.session.user) return next();
  const role = req.session.user.role;
  if (role === 'admin') return res.redirect('/admin/dashboard');
  if (role === 'client') return res.redirect('/cliente/home');
  if (role === 'commerce') return res.redirect('/comercio/home');
  if (role === 'delivery') return res.redirect('/delivery/home');
  res.redirect('/login');
};

export const isRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (roles.includes(req.session.user.role)) return next();
    res.status(403).render('404', { error: 'Acceso denegado' });
  };
};