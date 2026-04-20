import Order from '../models/Order.js';
import User from '../models/User.js';
import Commerce from '../models/Commerce.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { upload } from '../utils/multerConfig.js';
import Address from '../models/Address.js';

export const getHome = async (req, res) => {
  const orders = await Order.find({ commerceId: req.session.user.commerceId })
    .populate('clientId')
    .populate('commerceId') 
    .sort('-createdAt')
    .lean(); 
    
  res.render('commerce/home', { orders });
};

export const getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('commerceId')
    .populate('addressId')
    .populate('items.productId')
    .lean();

  if (order.commerceId._id.toString() !== req.session.user.commerceId.toString()) {
    return res.redirect('/comercio/home');
  }
  
  const deliveries = await User.find({ 
    role: 'delivery', 
    isActive: true, 
    isAvailable: true 
  }).lean();
  res.render('commerce/orderDetail', { order, deliveries });
};

export const assignDelivery = async (req, res) => {
  const { deliveryId } = req.body;
  const order = await Order.findOne({
    _id: req.params.id,
    commerceId: req.session.user.commerceId,
    status: 'pending'
  });
  if (!order) return res.redirect('/comercio/home');
  const delivery = await User.findOne({ _id: deliveryId, role: 'delivery', isActive: true, isAvailable: true });
  if (!delivery) {
    return res.redirect(`/comercio/pedido/${req.params.id}?error=No hay delivery disponible`);
  }
  order.deliveryId = deliveryId;
  order.status = 'in_progress';
  await order.save();
  delivery.isAvailable = false;
  await delivery.save();
  res.redirect('/comercio/home');
};

export const getProfile = async (req, res) => {
  const commerce = await Commerce.findById(req.session.user.commerceId).lean();
  res.render('commerce/profile', { commerce });
};

export const updateProfile = async (req, res) => {
  const { name, phone, email, openingTime, closingTime } = req.body;
  const update = { name, phone, email, openingTime, closingTime };
  if (req.file) update.logo = req.file.filename;
  await Commerce.findByIdAndUpdate(req.session.user.commerceId, update);
  res.redirect('/comercio/perfil');
};

export const getCategories = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const categories = await Category.find({ commerceId }).lean();

    for (let category of categories) {
      category.productCount = await Product.countDocuments({ categoryId: category._id });
    }

    console.log('Categorías enviadas a la vista:', categories);
    res.render('commerce/categories', { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar categorías');
  }
};

export const getCategoryForm = (req, res) => {
  res.render('commerce/categoryForm', { category: null });
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const commerceId = req.session.user.commerceId;

    if (!commerceId) {
      return res.status(400).send('No se encontró el comercio asociado al usuario');
    }

    await Category.create({
      commerceId: commerceId,
      name,
      description
    });

    res.redirect('/comercio/categorias');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear la categoría');
  }
};

export const getEditCategory = async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, commerceId: req.session.user.commerceId }).lean();
  if (!category) return res.redirect('/comercio/categorias');
  res.render('commerce/categoryForm', { category });
};

export const updateCategory = async (req, res) => {
  const { name, description } = req.body;
  await Category.findOneAndUpdate(
    { _id: req.params.id, commerceId: req.session.user.commerceId },
    { name, description }
  );
  res.redirect('/comercio/categorias');
};

export const confirmDeleteCategory = async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, commerceId: req.session.user.commerceId });
  if (!category) return res.redirect('/comercio/categorias');
  const productCount = await Product.countDocuments({ categoryId: category._id });
  res.render('commerce/categoryDelete', { category, productCount });
};

export const deleteCategory = async (req, res) => {
  const category = await Category.findOneAndDelete({ _id: req.params.id, commerceId: req.session.user.commerceId });
  if (category) {
    await Product.deleteMany({ categoryId: category._id });
  }
  res.redirect('/comercio/categorias');
};

export const getProducts = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const products = await Product.find({ commerceId }).populate('categoryId').lean();
    console.log('Productos encontrados:', products); // Para depurar
    res.render('commerce/products', { products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar productos');
  }
};

export const getProductForm = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const categories = await Category.find({ commerceId }).lean();
    console.log('Categorías enviadas al formulario:', categories); // <-- Para depurar
    res.render('commerce/productForm', { product: null, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar formulario');
  }
};

export const createProduct = async (req, res) => {
  const { name, description, price, categoryId } = req.body;
  await Product.create({
    commerceId: req.session.user.commerceId,
    categoryId,
    name,
    description,
    price,
    image: req.file?.filename
  });
  res.redirect('/comercio/productos');
};

export const getEditProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, commerceId: req.session.user.commerceId }).lean();
  if (!product) return res.redirect('/comercio/productos');
  const categories = await Category.find({ commerceId: req.session.user.commerceId });
  res.render('commerce/productForm', { product, categories });
};

export const updateProduct = async (req, res) => {
  const { name, description, price, categoryId } = req.body;
  const update = { name, description, price, categoryId };
  if (req.file) update.image = req.file.filename;
  await Product.findOneAndUpdate(
    { _id: req.params.id, commerceId: req.session.user.commerceId },
    update
  );
  res.redirect('/comercio/productos');
};

export const confirmDeleteProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, commerceId: req.session.user.commerceId });
  if (!product) return res.redirect('/comercio/productos');
  res.render('commerce/productDelete', { product });
};

export const deleteProduct = async (req, res) => {
  await Product.findOneAndDelete({ _id: req.params.id, commerceId: req.session.user.commerceId });
  res.redirect('/comercio/productos');
};