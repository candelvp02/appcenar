import express from 'express';
import { isAuthenticated, isRole } from '../middlewares/authMiddleware.js';
import { upload } from '../utils/multerConfig.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

router.use(isAuthenticated, isRole('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/clientes', adminController.getClients);
router.post('/cliente/:id/toggle', adminController.toggleClientStatus);
router.get('/deliveries', adminController.getDeliveries);
router.post('/delivery/:id/toggle', adminController.toggleDeliveryStatus);
router.get('/comercios', adminController.getCommerces);
router.post('/comercio/:id/toggle', adminController.toggleCommerceStatus);
router.get('/administradores', adminController.getAdmins);
router.get('/administrador/crear', adminController.getAdminForm);
router.post('/administrador/crear', adminController.createAdmin);
router.get('/administrador/editar/:id', adminController.getEditAdmin);
router.post('/administrador/editar/:id', adminController.updateAdmin);
router.post('/administrador/:id/toggle', adminController.toggleAdminStatus);
router.get('/configuracion', adminController.getConfiguration);
router.get('/configuracion/editar', adminController.getConfigurationForm);
router.post('/configuracion/editar', adminController.updateConfiguration);
router.get('/tipos-comercio', adminController.getCommerceTypes);
router.get('/tipo-comercio/crear', adminController.getCommerceTypeForm);
router.post('/tipo-comercio/crear', upload.single('icon'), adminController.createCommerceType);
router.get('/tipo-comercio/editar/:id', adminController.getEditCommerceType);
router.post('/tipo-comercio/editar/:id', upload.single('icon'), adminController.updateCommerceType);
router.get('/tipo-comercio/eliminar/:id', adminController.confirmDeleteCommerceType);
router.post('/tipo-comercio/eliminar/:id', adminController.deleteCommerceType);

export default router;