import Order from '../models/Order.js';
import User from '../models/User.js';

export const getHome = async (req, res) => {
  const orders = await Order.find({ deliveryId: req.session.user.id })
    .populate('commerceId')
    .sort('-createdAt');
  res.render('delivery/home', { orders });
};

export const getOrderDetail = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    deliveryId: req.session.user.id
  }).populate('commerceId').populate('addressId').populate('items.productId');
  
  if (!order) return res.redirect('/delivery/home');
  
  const showAddress = order.status === 'in_progress';
  res.render('delivery/orderDetail', { order, showAddress });
};

export const completeOrder = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    deliveryId: req.session.user.id,
    status: 'in_progress'
  });
  
  if (!order) return res.redirect('/delivery/home');
  
  order.status = 'completed';
  await order.save();
  
  const delivery = await User.findById(req.session.user.id);
  delivery.isAvailable = true;
  await delivery.save();
  
  res.redirect('/delivery/home');
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render('delivery/profile', { user });
};

export const updateProfile = async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const update = { firstName, lastName, phone };
  if (req.file) update.photo = req.file.filename;
  await User.findByIdAndUpdate(req.session.user.id, update);
  res.redirect('/delivery/perfil');
};