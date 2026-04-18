import CommerceType from '../models/CommerceType.js';
import Commerce from '../models/Commerce.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Address from '../models/Address.js';
import Favorite from '../models/Favorite.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Configuration from '../models/Configuration.js';

export const getHome = async (req, res) => {
  const commerceTypes = await CommerceType.find();
  res.render('client/home', { commerceTypes });
};

export const getCommercesByType = async (req, res) => {
  const { typeId } = req.params;
  const { search } = req.query;
  const commerceType = await CommerceType.findById(typeId);
  let query = { commerceTypeId: typeId, isActive: true };
  if (search) query.name = { $regex: search, $options: 'i' };
  const commerces = await Commerce.find(query);
  const favorites = await Favorite.find({ userId: req.session.user.id }).distinct('commerceId');
  res.render('client/commerceList', {
    commerceType,
    commerces,
    favorites: favorites.map(f => f.toString()),
    count: commerces.length,
    search
  });
};

export const addFavorite = async (req, res) => {
  const { commerceId } = req.body;
  const existing = await Favorite.findOne({ userId: req.session.user.id, commerceId });
  if (!existing) {
    await Favorite.create({ userId: req.session.user.id, commerceId });
  }
  res.redirect('back');
};

export const removeFavorite = async (req, res) => {
  await Favorite.findOneAndDelete({ userId: req.session.user.id, commerceId: req.params.commerceId });
  res.redirect('back');
};

export const getCatalog = async (req, res) => {
  const { commerceId } = req.params;
  const commerce = await Commerce.findById(commerceId);
  const categories = await Category.find({ commerceId }).populate({
    path: 'products',
    match: { isActive: true },
    model: 'Product'
  });
  const categoriesWithProducts = [];
  for (const cat of categories) {
    const products = await Product.find({ categoryId: cat._id, isActive: true });
    if (products.length > 0) {
      categoriesWithProducts.push({ ...cat.toObject(), products });
    }
  }
  res.render('client/catalog', { commerce, categories: categoriesWithProducts });
};

export const addToCart = async (req, res) => {
  const { productId, commerceId } = req.body;
  const product = await Product.findById(productId);
  let cart = req.session.cart || [];
  const existing = cart.find(item => item.productId.toString() === productId);
  if (!existing) {
    cart.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      commerceId
    });
  }
  req.session.cart = cart;
  res.redirect('back');
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.body;
  let cart = req.session.cart || [];
  cart = cart.filter(item => item.productId.toString() !== productId);
  req.session.cart = cart;
  res.redirect('back');
};

export const getCheckout = async (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('back');
  const commerceId = cart[0].commerceId;
  const commerce = await Commerce.findById(commerceId);
  const addresses = await Address.find({ userId: req.session.user.id });
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const config = await Configuration.findOne();
  const itbisPercent = config ? config.itbis : 18;
  const itbis = subtotal * itbisPercent / 100;
  const total = subtotal + itbis;
  res.render('client/checkout', { cart, commerce, addresses, subtotal, itbis, total, itbisPercent });
};

export const createOrder = async (req, res) => {
  const { addressId } = req.body;
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cliente/home');
  const commerceId = cart[0].commerceId;
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const config = await Configuration.findOne();
  const itbisPercent = config ? config.itbis : 18;
  const itbis = subtotal * itbisPercent / 100;
  const total = subtotal + itbis;
  const order = new Order({
    clientId: req.session.user.id,
    commerceId,
    addressId,
    items: cart.map(item => ({
      productId: item.productId,
      productName: item.name,
      productPrice: item.price,
      quantity: 1
    })),
    subtotal,
    itbis,
    total,
    status: 'pending'
  });
  await order.save();
  req.session.cart = [];
  res.redirect('/cliente/mis-pedidos');
};

export const getOrders = async (req, res) => {
  const orders = await Order.find({ clientId: req.session.user.id })
    .populate('commerceId')
    .sort('-createdAt');
  res.render('client/orders', { orders });
};

export const getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('commerceId')
    .populate('addressId');
  if (order.clientId.toString() !== req.session.user.id) {
    return res.redirect('/cliente/mis-pedidos');
  }
  res.render('client/orderDetail', { order });
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render('client/profile', { user });
};

export const updateProfile = async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const update = { firstName, lastName, phone };
  if (req.file) update.photo = req.file.filename;
  await User.findByIdAndUpdate(req.session.user.id, update);
  res.redirect('/cliente/perfil');
};

export const getAddresses = async (req, res) => {
  const addresses = await Address.find({ userId: req.session.user.id });
  res.render('client/addresses', { addresses });
};

export const getAddressForm = (req, res) => {
  res.render('client/addressForm', { address: null });
};

export const createAddress = async (req, res) => {
  const { name, description } = req.body;
  await Address.create({ userId: req.session.user.id, name, description });
  res.redirect('/cliente/mis-direcciones');
};

export const getEditAddress = async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.session.user.id });
  if (!address) return res.redirect('/cliente/mis-direcciones');
  res.render('client/addressForm', { address });
};

export const updateAddress = async (req, res) => {
  const { name, description } = req.body;
  await Address.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.user.id },
    { name, description }
  );
  res.redirect('/cliente/mis-direcciones');
};

export const confirmDeleteAddress = async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.session.user.id });
  if (!address) return res.redirect('/cliente/mis-direcciones');
  res.render('client/addressDelete', { address });
};

export const deleteAddress = async (req, res) => {
  await Address.findOneAndDelete({ _id: req.params.id, userId: req.session.user.id });
  res.redirect('/cliente/mis-direcciones');
};

export const getFavorites = async (req, res) => {
  const favorites = await Favorite.find({ userId: req.session.user.id }).populate('commerceId');
  res.render('client/favorites', { favorites });
};