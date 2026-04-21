import express from 'express';
import { isAuthenticated, isRole } from '../middlewares/authMiddleware.js';
import { upload } from '../utils/multerConfig.js';
import * as clientController from '../controllers/clientController.js';


const router = express.Router();
router.use(isAuthenticated, isRole('client'));

router.get('/home', clientController.getHome);
router.get('/comercios/tipo/:typeId', clientController.getCommercesByType);
router.get('/catalogo/:commerceId', clientController.getCatalog);
router.post('/carrito/agregar/:commerceId', clientController.addToCart);
router.post('/carrito/agregar', clientController.addToCart);
router.post('/carrito/remover', clientController.removeFromCart);
router.get('/checkout', clientController.getCheckout);
router.post('/pedido/crear', clientController.createOrder);
router.get('/mis-pedidos', clientController.getOrders);
router.get('/pedido/:id', clientController.getOrderDetail);
router.get('/perfil', clientController.getProfile);
router.post('/perfil', upload.single('photo'), clientController.updateProfile);
router.get('/mis-direcciones', clientController.getAddresses);
router.get('/direccion/crear', clientController.getAddressForm);
router.post('/direccion/crear', clientController.createAddress);
router.get('/direccion/editar/:id', clientController.getEditAddress);
router.post('/direccion/editar/:id', clientController.updateAddress);
router.get('/direccion/eliminar/:id', clientController.confirmDeleteAddress);
router.post('/direccion/eliminar/:id', clientController.deleteAddress);
router.get('/mis-favoritos', clientController.getFavorites);
router.post('/favorito/toggle', clientController.toggleFavorite);

export default router;