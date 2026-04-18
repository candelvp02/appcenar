import User from '../models/User.js';
import Commerce from '../models/Commerce.js';
import CommerceType from '../models/CommerceType.js';
import { sendEmail } from '../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';

export const getLogin = (req, res) => res.render('auth/login');

export const postLogin = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error en login:', error);
    res.render('auth/login', { error: 'Error en el servidor' });
  }
};

console.log('Usuario encontrado:', User.username, 'role:', User.role, 'commerceId:', User.commerceId);

export const getRegister = (req, res) => res.render('auth/register');

export const postRegister = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;
    
    // Verificar si ya existe
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.render('auth/register', { error: 'Usuario o email ya existe', body: req.body });
    }
    
    // Determinar el rol (si viene del formulario o por defecto cliente)
    const role = req.body.role === 'delivery' ? 'delivery' : 'client';
    
    // Crear token de activación
    const token = uuidv4();
    
    // Crear usuario
    const user = new User({
      username,
      email,
      password,
      role: role,
      isActive: true, // Para pruebas, activar automáticamente
      firstName,
      lastName,
      phone,
      photo: req.file?.filename,
      activationToken: token,
      // Para delivery
      isAvailable: role === 'delivery' ? true : undefined
    });
    
    await user.save();
    
    // Intentar enviar email (pero no detener el registro si falla)
    try {
      const link = `${process.env.APP_URL}/activate/${token}`;
      await sendEmail(email, 'Activa tu cuenta', `Haz clic aquí: <a href="${link}">${link}</a>`);
      console.log(`Email de activación enviado a ${email}`);
    } catch (emailError) {
      console.error('Error enviando email:', emailError.message);
    }
    
    // Mensaje según el rol
    const successMessage = role === 'delivery' 
      ? 'Delivery registrado exitosamente. Ya puedes iniciar sesión.'
      : 'Registro exitoso. Ya puedes iniciar sesión.';
    
    res.render('auth/login', { success: successMessage });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.render('auth/register', { error: 'Error en el registro: ' + error.message, body: req.body });
  }
};

export const getRegisterCommerce = async (req, res) => {
  try {
    const commerceTypes = await CommerceType.find();
    console.log('Tipos de comercio encontrados:', commerceTypes.length); // Para depurar
    res.render('auth/registerCommerce', { commerceTypes });
  } catch (error) {
    console.error('Error cargando tipos:', error);
    res.render('auth/registerCommerce', { commerceTypes: [] });
  }
};

export const postRegisterCommerce = async (req, res) => {
  try {
    const { username, email, password, commerceName, phone, openingTime, closingTime, commerceTypeId } = req.body;
    
    // Verificar si ya existe
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      const commerceTypes = await CommerceType.find();
      return res.render('auth/registerCommerce', { error: 'Usuario o email ya existe', body: req.body, commerceTypes });
    }
    
    // Crear token
    const token = uuidv4();
    
    // Crear usuario
    const user = new User({
      username,
      email,
      password,
      role: 'commerce',
      isActive: true, // Para pruebas, activar automáticamente
      phone,
      activationToken: token
    });
    
    await user.save();
    
    // Crear comercio
 const commerce = new Commerce({
  userId: user._id,              
  name: commerceName,
  logo: req.file?.filename,
  phone,
  email,
  openingTime,
  closingTime,
  commerceTypeId: commerceTypeId,
  isActive: true
});
    
    await commerce.save();
    
    // Vincular comercio al usuario
    user.commerceId = commerce._id;
    await user.save();
    
    // Intentar enviar email
    try {
      const link = `${process.env.APP_URL}/activate/${token}`;
      await sendEmail(email, 'Activa tu comercio', `Haz clic aquí: <a href="${link}">${link}</a>`);
    } catch (emailError) {
      console.error('Error enviando email:', emailError.message);
    }
    
    res.render('auth/login', { success: 'Comercio registrado exitosamente. Ya puedes iniciar sesión.' });
    
  } catch (error) {
    console.error('Error en registro de comercio:', error);
    const commerceTypes = await CommerceType.find();
    res.render('auth/registerCommerce', { error: 'Error en el registro: ' + error.message, body: req.body, commerceTypes });
  }
};

export const activateAccount = async (req, res) => {
  try {
    const user = await User.findOne({ activationToken: req.params.token });
    if (!user) {
      return res.render('auth/login', { error: 'Token inválido' });
    }
    user.isActive = true;
    user.activationToken = null;
    await user.save();
    res.render('auth/login', { success: 'Cuenta activada, ya puedes iniciar sesión' });
  } catch (error) {
    console.error('Error activando cuenta:', error);
    res.render('auth/login', { error: 'Error activando cuenta' });
  }
};

export const getForgotPassword = (req, res) => res.render('auth/forgotPassword');

export const postForgotPassword = async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });
    
    if (!user) {
      return res.render('auth/forgotPassword', { error: 'Usuario no encontrado' });
    }
    
    const token = uuidv4();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    
    const link = `${process.env.APP_URL}/reset-password/${token}`;
    await sendEmail(user.email, 'Restablecer contraseña', `Haz clic aquí: <a href="${link}">${link}</a>`);
    
    res.render('auth/login', { success: 'Revisa tu email para restablecer contraseña' });
  } catch (error) {
    console.error('Error en recuperación:', error);
    res.render('auth/forgotPassword', { error: 'Error procesando la solicitud' });
  }
};

export const getResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.render('auth/login', { error: 'Token inválido o expirado' });
    }
    
    res.render('auth/resetPassword', { token: req.params.token });
  } catch (error) {
    console.error('Error:', error);
    res.render('auth/login', { error: 'Error procesando la solicitud' });
  }
};

export const postResetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.render('auth/resetPassword', { error: 'Contraseñas no coinciden', token: req.params.token });
    }
    
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.render('auth/login', { error: 'Token inválido o expirado' });
    }
    
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    res.render('auth/login', { success: 'Contraseña actualizada, ya puedes iniciar sesión' });
  } catch (error) {
    console.error('Error:', error);
    res.render('auth/resetPassword', { error: 'Error actualizando contraseña', token: req.params.token });
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};