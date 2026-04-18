import User from '../models/User.js';
import Commerce from '../models/Commerce.js';
import { sendEmail } from '../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';

export const getLogin = (req, res) => res.render('auth/login');

export const postLogin = async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  const user = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (!user || !(await user.comparePassword(password))) {
    return res.render('auth/login', { error: 'Credenciales incorrectas', usernameOrEmail });
  }
  if (!user.isActive) {
    return res.render('auth/login', { error: 'Cuenta inactiva, revise su email', usernameOrEmail });
  }
  req.session.user = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    commerceId: user.commerceId
  };
  if (user.role === 'admin') return res.redirect('/admin/dashboard');
  if (user.role === 'client') return res.redirect('/cliente/home');
  if (user.role === 'commerce') return res.redirect('/comercio/home');
  if (user.role === 'delivery') return res.redirect('/delivery/home');
  res.redirect('/login');
};

export const getRegister = (req, res) => res.render('auth/register');

export const postRegister = async (req, res) => {
  const { username, email, password, firstName, lastName, phone } = req.body;
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) return res.render('auth/register', { error: 'Usuario o email ya existe', body: req.body });
  const token = uuidv4();
  const user = new User({
    username, email, password, role: 'client', isActive: false,
    firstName, lastName, phone, photo: req.file?.filename,
    activationToken: token
  });
  await user.save();
  const link = `${process.env.APP_URL}/activate/${token}`;
  await sendEmail(email, 'Activa tu cuenta', `Haz clic aquí: <a href="${link}">${link}</a>`);
  res.render('auth/login', { success: 'Registro exitoso, revisa tu email para activar' });
};

export const getRegisterCommerce = (req, res) => res.render('auth/registerCommerce');

export const postRegisterCommerce = async (req, res) => {
  const { username, email, password, commerceName, phone, openingTime, closingTime, commerceTypeId } = req.body;
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) return res.render('auth/registerCommerce', { error: 'Usuario o email ya existe', body: req.body });
  const token = uuidv4();
  const user = new User({
    username, email, password, role: 'commerce', isActive: false,
    phone, activationToken: token
  });
  await user.save();
  const commerce = new Commerce({
    userId: user._id,
    name: commerceName,
    logo: req.file?.filename,
    phone,
    email,
    openingTime,
    closingTime,
    commerceTypeId
  });
  await commerce.save();
  user.commerceId = commerce._id;
  await user.save();
  const link = `${process.env.APP_URL}/activate/${token}`;
  await sendEmail(email, 'Activa tu comercio', `Haz clic aquí: <a href="${link}">${link}</a>`);
  res.render('auth/login', { success: 'Comercio registrado, revisa tu email para activar' });
};

export const activateAccount = async (req, res) => {
  const user = await User.findOne({ activationToken: req.params.token });
  if (!user) return res.render('auth/login', { error: 'Token inválido' });
  user.isActive = true;
  user.activationToken = null;
  await user.save();
  res.render('auth/login', { success: 'Cuenta activada, ya puedes iniciar sesión' });
};

export const getForgotPassword = (req, res) => res.render('auth/forgotPassword');

export const postForgotPassword = async (req, res) => {
  const { usernameOrEmail } = req.body;
  const user = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (!user) return res.render('auth/forgotPassword', { error: 'Usuario no encontrado' });
  const token = uuidv4();
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  const link = `${process.env.APP_URL}/reset-password/${token}`;
  await sendEmail(user.email, 'Restablecer contraseña', `Haz clic aquí: <a href="${link}">${link}</a>`);
  res.render('auth/login', { success: 'Revisa tu email para restablecer contraseña' });
};

export const getResetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) return res.render('auth/login', { error: 'Token inválido o expirado' });
  res.render('auth/resetPassword', { token: req.params.token });
};

export const postResetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render('auth/resetPassword', { error: 'Contraseñas no coinciden', token: req.params.token });
  }
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) return res.render('auth/login', { error: 'Token inválido o expirado' });
  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  res.render('auth/login', { success: 'Contraseña actualizada, ya puedes iniciar sesión' });
};

export const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};