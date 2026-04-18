import User from '../models/User.js';
import Commerce from '../models/Commerce.js';
import CommerceType from '../models/CommerceType.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Configuration from '../models/Configuration.js';

export const getDashboard = async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
  
  const commerces = await Commerce.find();
  const activeCommerces = commerces.filter(c => c.isActive).length;
  const inactiveCommerces = commerces.length - activeCommerces;
  
  const clients = await User.find({ role: 'client' });
  const activeClients = clients.filter(c => c.isActive).length;
  const inactiveClients = clients.length - activeClients;
  
  const deliveries = await User.find({ role: 'delivery' });
  const activeDeliveries = deliveries.filter(d => d.isActive).length;
  const inactiveDeliveries = deliveries.length - activeDeliveries;
  
  const totalProducts = await Product.countDocuments();
  
  res.render('admin/dashboard', {
    totalOrders,
    todayOrders,
    activeCommerces,
    inactiveCommerces,
    activeClients,
    inactiveClients,
    activeDeliveries,
    inactiveDeliveries,
    totalProducts
  });
};

export const getClients = async (req, res) => {
  const clients = await User.find({ role: 'client' });
  for (let client of clients) {
    client.orderCount = await Order.countDocuments({ clientId: client._id });
  }
  res.render('admin/clients', { clients });
};

export const toggleClientStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user.role === 'client') {
    user.isActive = !user.isActive;
    await user.save();
  }
  res.redirect('/admin/clientes');
};

export const getDeliveries = async (req, res) => {
  const deliveries = await User.find({ role: 'delivery' });
  for (let delivery of deliveries) {
    delivery.orderCount = await Order.countDocuments({ deliveryId: delivery._id, status: 'completed' });
  }
  res.render('admin/deliveries', { deliveries });
};

export const toggleDeliveryStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user.role === 'delivery') {
    user.isActive = !user.isActive;
    await user.save();
  }
  res.redirect('/admin/deliveries');
};

export const getCommerces = async (req, res) => {
  const commerces = await Commerce.find().populate('commerceTypeId');
  for (let commerce of commerces) {
    commerce.orderCount = await Order.countDocuments({ commerceId: commerce._id });
  }
  res.render('admin/commerces', { commerces });
};

export const toggleCommerceStatus = async (req, res) => {
  const commerce = await Commerce.findById(req.params.id);
  if (commerce) {
    commerce.isActive = !commerce.isActive;
    await commerce.save();
    await User.findByIdAndUpdate(commerce.userId, { isActive: commerce.isActive });
  }
  res.redirect('/admin/comercios');
};

export const getAdmins = async (req, res) => {
  const admins = await User.find({ role: 'admin' });
  res.render('admin/admins', { admins, currentUserId: req.session.user.id });
};

export const getAdminForm = (req, res) => {
  res.render('admin/adminForm', { admin: null });
};

export const createAdmin = async (req, res) => {
  const { username, email, password, firstName, lastName, cedula } = req.body;
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return res.render('admin/adminForm', { error: 'Usuario o email ya existe', admin: req.body });
  }
  await User.create({
    username,
    email,
    password,
    role: 'admin',
    isActive: true,
    firstName,
    lastName,
    cedula
  });
  res.redirect('/admin/administradores');
};

export const getEditAdmin = async (req, res) => {
  if (req.params.id === req.session.user.id) {
    return res.redirect('/admin/administradores?error=No puedes editar tu propio usuario');
  }
  const admin = await User.findById(req.params.id);
  if (!admin || admin.role !== 'admin') return res.redirect('/admin/administradores');
  res.render('admin/adminForm', { admin });
};

export const updateAdmin = async (req, res) => {
  const { firstName, lastName, cedula, email, username, password } = req.body;
  const update = { firstName, lastName, cedula, email, username };
  if (password) update.password = password;
  await User.findByIdAndUpdate(req.params.id, update);
  res.redirect('/admin/administradores');
};

export const toggleAdminStatus = async (req, res) => {
  if (req.params.id === req.session.user.id) {
    return res.redirect('/admin/administradores?error=No puedes inactivar tu propio usuario');
  }
  const user = await User.findById(req.params.id);
  if (user.role === 'admin') {
    user.isActive = !user.isActive;
    await user.save();
  }
  res.redirect('/admin/administradores');
};

export const getConfiguration = async (req, res) => {
  const config = await Configuration.findOne();
  res.render('admin/configuration', { config });
};

export const getConfigurationForm = async (req, res) => {
  const config = await Configuration.findOne();
  res.render('admin/configurationForm', { config });
};

export const updateConfiguration = async (req, res) => {
  const { itbis } = req.body;
  await Configuration.findOneAndUpdate({}, { itbis }, { upsert: true });
  res.redirect('/admin/configuracion');
};

export const getCommerceTypes = async (req, res) => {
  const types = await CommerceType.find();
  for (let type of types) {
    type.commerceCount = await Commerce.countDocuments({ commerceTypeId: type._id });
  }
  res.render('admin/commerceTypes', { types });
};

export const getCommerceTypeForm = (req, res) => {
  res.render('admin/commerceTypeForm', { type: null });
};

export const createCommerceType = async (req, res) => {
  const { name, description } = req.body;
  await CommerceType.create({
    name,
    description,
    icon: req.file?.filename
  });
  res.redirect('/admin/tipos-comercio');
};

export const getEditCommerceType = async (req, res) => {
  const type = await CommerceType.findById(req.params.id);
  if (!type) return res.redirect('/admin/tipos-comercio');
  res.render('admin/commerceTypeForm', { type });
};

export const updateCommerceType = async (req, res) => {
  const { name, description } = req.body;
  const update = { name, description };
  if (req.file) update.icon = req.file.filename;
  await CommerceType.findByIdAndUpdate(req.params.id, update);
  res.redirect('/admin/tipos-comercio');
};

export const confirmDeleteCommerceType = async (req, res) => {
  const type = await CommerceType.findById(req.params.id);
  if (!type) return res.redirect('/admin/tipos-comercio');
  const commerceCount = await Commerce.countDocuments({ commerceTypeId: type._id });
  res.render('admin/commerceTypeDelete', { type, commerceCount });
};

export const deleteCommerceType = async (req, res) => {
  const type = await CommerceType.findById(req.params.id);
  if (type) {
    await Commerce.deleteMany({ commerceTypeId: type._id });
    await type.deleteOne();
  }
  res.redirect('/admin/tipos-comercio');
};