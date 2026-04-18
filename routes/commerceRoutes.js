import express from 'express';
import { isAuthenticated, isRole } from '../middlewares/authMiddleware.js';
import { upload } from '../utils/multerConfig.js';
import * as commerceController from '../controllers/commerceController.js';

const router = express.Router();

router.use(isAuthenticated, isRole('commerce'));

router.get('/home', commerceController.getHome);
router.get('/pedido/:id', commerceController.getOrderDetail);
router.post('/pedido/:id/asignar', commerceController.assignDelivery);
router.get('/perfil', commerceController.getProfile);
router.post('/perfil', upload.single('logo'), commerceController.updateProfile);
router.get('/categorias', commerceController.getCategories);
router.get('/categoria/crear', commerceController.getCategoryForm);
router.post('/categoria/crear', commerceController.createCategory);
router.get('/categoria/editar/:id', commerceController.getEditCategory);
router.post('/categoria/editar/:id', commerceController.updateCategory);
router.get('/categoria/eliminar/:id', commerceController.confirmDeleteCategory);
router.post('/categoria/eliminar/:id', commerceController.deleteCategory);
router.get('/productos', commerceController.getProducts);
router.get('/producto/crear', commerceController.getProductForm);
router.post('/producto/crear', upload.single('image'), commerceController.createProduct);
router.get('/producto/editar/:id', commerceController.getEditProduct);
router.post('/producto/editar/:id', upload.single('image'), commerceController.updateProduct);
router.get('/producto/eliminar/:id', commerceController.confirmDeleteProduct);
router.post('/producto/eliminar/:id', commerceController.deleteProduct);

export default router;