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
  const commerceTypes = await CommerceType.find().lean();
  res.render('client/home', { commerceTypes });
};

export const getCommercesByType = async (req, res) => {
  try {
    const { typeId } = req.params;
    
    // 1. Buscamos los comercios de ese tipo
    const commerces = await Commerce.find({ commerceTypeId: typeId, isActive: true }).lean();
    const commerceType = await CommerceType.findById(typeId).lean();

    // 2. Buscamos TODOS los favoritos de este usuario en la colección Favorite
    const userFavorites = await Favorite.find({ userId: req.session.user.id }).lean();
    
    // Convertimos los favoritos en una lista simple de IDs para que sea fácil comparar
    const favoriteCommerceIds = userFavorites.map(fav => fav.commerceId.toString());
    const commercesWithFavorites = commerces.map(commerce => ({
      ...commerce,
      isFavorite: favoriteCommerceIds.includes(commerce._id.toString()) // True o False
    }));

    // 4. Enviamos la nueva lista a la vista
    res.render('client/commerceList', { 
      commerces: commercesWithFavorites, 
      commerceType,
      count: commerces.length 
    });
    
  } catch (error) {
    console.error(error);
    res.redirect('/cliente/home');
  }
};

export const getCatalog = async (req, res) => {
  const { commerceId } = req.params;
  const commerce = await Commerce.findById(commerceId).lean();
  const categories = await Category.find({ commerceId }).lean();
  
  for (let cat of categories) {
    cat.products = await Product.find({ categoryId: cat._id, isActive: true }).lean();
  }
  
  const categoriesWithProducts = categories.filter(cat => cat.products.length > 0);
  
  const cart = req.session.cart || [];
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  
  
  const config = await Configuration.findOne().lean();
  const itbisPercent = config ? config.itbis : 18;
  const itbis = subtotal * (itbisPercent / 100);
  const total = subtotal + itbis;

  const cartProductIds = cart.map(item => String(item.productId));
  for (let cat of categories) {
    cat.products = await Product.find({ categoryId: cat._id, isActive: true }).lean();
    cat.products.forEach(p => {
      p.inCart = cartProductIds.includes(String(p._id));
    });
  }

  res.render('client/catalog', { 
    commerce, 
    categories: categoriesWithProducts,
    commerceId: commerce._id,
    cart, 
    subtotal,
    itbis, 
    total 
  });
};

export const addToCart = async (req, res) => {
  try {
    const { productId, commerceId } = req.body; // ← viene de la URL
    
    console.log('Datos recibidos:', { productId, commerceId });
    
    if (!productId || !commerceId) {
      console.error('Faltan datos');
      return res.redirect(req.get('Referrer') || '/cliente/home');
    }
    
    const product = await Product.findById(productId).lean();
    if (!product) return res.redirect(req.get('Referrer') || '/cliente/home');
    
    let cart = req.session.cart || [];
    if (!Array.isArray(cart)) cart = [];
    
    const existingIndex = cart.findIndex(item => String(item.productId) === String(productId));
    if (existingIndex === -1) {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        commerceId: commerceId
      });
    }
    
    req.session.cart = cart;
    res.redirect(req.get('Referrer') || '/cliente/home');
  } catch (error) {
    console.error(error);
    res.redirect(req.get('Referrer') || '/cliente/home');
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    let cart = req.session.cart || [];
    cart = cart.filter(item => item.productId.toString() !== productId);
    req.session.cart = cart;
    res.redirect(req.get('Referrer') || '/cliente/home');
  } catch (error) {
    console.error(error);
    res.redirect(req.get('Referrer') || '/cliente/home');
  }
};

export const getCheckout = async (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cliente/home');
  const commerceId = cart[0].commerceId;
  const commerce = await Commerce.findById(commerceId).lean();
  const addresses = await Address.find({ userId: req.session.user.id }).lean();
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const config = await Configuration.findOne().lean();
  const itbisPercent = config ? config.itbis : 18;
  const itbis = subtotal * itbisPercent / 100;
  const total = subtotal + itbis;
  res.render('client/checkout', { cart, commerce, addresses, subtotal, itbis, total, itbisPercent });
};

export const createOrder = async (req, res) => {
  const { addressId } = req.body;
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cliente/home');
  if (!addressId) return res.redirect('/cliente/checkout');
  
  const commerceId = cart[0].commerceId;
  if (!commerceId) {
    return res.status(400).send('Error: El carrito no tiene commerceId. Asegúrate de agregar productos correctamente.');
  }
  
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const config = await Configuration.findOne().lean();
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
      productImage: item.image,
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
  const orders = await Order.find({ clientId: req.session.user.id }).populate('commerceId').sort('-createdAt').lean();
  res.render('client/orders', { orders });
};

export const getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('commerceId').populate('addressId').lean();
  res.render('client/orderDetail', { order });
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
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
  const addresses = await Address.find({ userId: req.session.user.id }).lean();
  res.render('client/addresses', { addresses });
};

export const getAddressForm = (req, res) => res.render('client/addressForm', { address: null });
export const createAddress = async (req, res) => {
  await Address.create({ userId: req.session.user.id, name: req.body.name, description: req.body.description });
  res.redirect('/cliente/mis-direcciones');
};
export const getEditAddress = async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.session.user.id }).lean();
  res.render('client/addressForm', { address });
};
export const updateAddress = async (req, res) => {
  await Address.findOneAndUpdate({ _id: req.params.id, userId: req.session.user.id }, { name: req.body.name, description: req.body.description });
  res.redirect('/cliente/mis-direcciones');
};
export const confirmDeleteAddress = async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.session.user.id }).lean();
  res.render('client/addressDelete', { address });
};
export const deleteAddress = async (req, res) => {
  await Address.findOneAndDelete({ _id: req.params.id, userId: req.session.user.id });
  res.redirect('/cliente/mis-direcciones');
};
export const getFavorites = async (req, res) => {
  const favorites = await Favorite.find({ userId: req.session.user.id }).populate('commerceId').lean();
  res.render('client/favorites', { favorites });
};
export const toggleFavorite = async (req, res) => {
  try {
    const { commerceId } = req.body;
    const userId = req.session.user.id;

    // Buscamos si ya existe un registro de favorito para este usuario y comercio
    const existingFavorite = await Favorite.findOne({ userId, commerceId });

    if (existingFavorite) {
      // Si existe, lo eliminamos (Corazón vacío)
      await Favorite.findByIdAndDelete(existingFavorite._id);
    } else {
      // Si no existe, lo creamos (Corazón rojo)
      await Favorite.create({ userId, commerceId });
    }

    // Recargamos la misma página donde el usuario hizo clic
    res.redirect('back');
  } catch (error) {
    console.error('Error en toggleFavorite:', error);
    res.redirect('back');
  }
};