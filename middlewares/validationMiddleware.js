import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('error', { errors: errors.array() });
  }
  next();
};

export const loginValidation = [
  body('usernameOrEmail').notEmpty().withMessage('Usuario o email requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  validate
];

export const registerValidation = [
  body('username').notEmpty().withMessage('Usuario requerido'),
  body('email').isEmail().withMessage('Email válido requerido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Contraseñas no coinciden'),
  validate
];