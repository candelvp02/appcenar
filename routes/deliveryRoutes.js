import express from 'express';
import { isAuthenticated, isRole } from '../middlewares/authMiddleware.js';
import { upload } from '../utils/multerConfig.js';
import * as deliveryController from '../controllers/deliveryController.js';

const router = express.Router();

router.use(isAuthenticated, isRole('delivery'));

router.get('/home', deliveryController.getHome);
router.get('/pedido/:id', deliveryController.getOrderDetail);
router.post('/pedido/:id/completar', deliveryController.completeOrder);
router.get('/perfil', deliveryController.getProfile);
router.post('/perfil', upload.single('photo'), deliveryController.updateProfile);

export default router;