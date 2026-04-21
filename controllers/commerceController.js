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
  try {
    const order = await Order.findById(req.params.id)
      .populate('commerceId')
      .populate('addressId')
      .populate('items.productId')
      .lean();

    if (!order || order.commerceId._id.toString() !== req.session.user.commerceId.toString()) {
      return res.redirect('/comercio/home');
    }

    order.stringId = order._id.toString();
    
    // 1. Buscamos TODOS los deliveries que cumplan las condiciones iniciales
    const rawDeliveries = await User.find({ 
      role: 'delivery', 
      isActive: true 
    }).lean();

    // 2. FILTRAMOS MANUALMENTE para asegurar que isAvailable sea estrictamente true
    // y creamos el escudo stringId al mismo tiempo
    const deliveries = rawDeliveries
      .filter(d => d.isAvailable === true)
      .map(d => ({
        _id: d._id, // Mantenemos el original por si acaso
        stringId: d._id.toString(),
        firstName: d.firstName,
        lastName: d.lastName
      }));

    // Imprimimos para confirmar que el filtro manual funcionó
    console.log('Deliveries limpios para la vista:', deliveries);

    const error = req.query.error;

    res.render('commerce/orderDetail', { order, deliveries, error });
  } catch (error) {
    console.error(error);
    res.redirect('/comercio/home');
  }
};


export const assignDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.body;
    const orderId = req.params.id;
    const order = await Order.findOne({
      _id: orderId,
      commerceId: req.session.user.commerceId,
      status: 'pending'
    });

    if (!order) return res.redirect('/comercio/home');
    const delivery = await User.findOne({ _id: deliveryId, role: 'delivery', isActive: true, isAvailable: true });
    
    if (!delivery) {
      // Si justo se ocupó, devolvemos al usuario al pedido con un mensaje de error en la URL
      return res.redirect(`/comercio/pedido/${orderId}?error=El delivery seleccionado ya no está disponible. Intente con otro.`);
    }

    order.deliveryId = deliveryId;
    order.status = 'in_progress'; 
    await order.save();
    
    delivery.isAvailable = false;
    await delivery.save();
    
    res.redirect(`/comercio/pedido/${orderId}`);
  } catch (error) {
    console.error(error);
    res.redirect('/comercio/home');
  }
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
  category.stringId = category._id.toString();
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
    const rawCategories = await Category.find({ commerceId }).lean();

    const categories = rawCategories.map(cat => ({
      ...cat,
      stringId: cat._id.toString()
    }));
    console.log('Categorías con escudo:', categories); 
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
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.redirect('/comercio/productos');
    // Buscamos todas las categorías del comercio
    const categories = await Category.find({ commerceId: req.session.user.commerceId }).lean();
    const categoriesWithSelected = categories.map(cat => ({
      ...cat,
      stringId: cat._id.toString(), // Para el valor del <option>
      isSelected: cat._id.toString() === product.categoryId?.toString() 
    }));
    res.render('commerce/productForm', { 
      product, 
      categories: categoriesWithSelected 
    });
  } catch (error) {
    console.error(error);
    res.redirect('/comercio/productos');
  }
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
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.redirect('/comercio/productos');
    }
    product.stringId = product._id.toString();
    res.render('commerce/productDelete', { product }); 
    
  } catch (error) {
    console.error(error);
    res.redirect('/comercio/productos');
  }
};

export const deleteProduct = async (req, res) => {
  await Product.findOneAndDelete({ _id: req.params.id, commerceId: req.session.user.commerceId });
  res.redirect('/comercio/productos');
};