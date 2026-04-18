import express from 'express';
import { isGuest } from '../middlewares/authMiddleware.js';
import { upload } from '../utils/multerConfig.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.get('/login', isGuest, authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/register', isGuest, authController.getRegister);
router.post('/register', upload.single('photo'), authController.postRegister);
router.get('/register-commerce', isGuest, authController.getRegisterCommerce);
router.post('/register-commerce', upload.single('logo'), authController.postRegisterCommerce);
router.get('/activate/:token', authController.activateAccount);
router.get('/forgot-password', isGuest, authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);
router.get('/reset-password/:token', isGuest, authController.getResetPassword);
router.post('/reset-password/:token', authController.postResetPassword);
router.get('/logout', authController.logout);

export default router;