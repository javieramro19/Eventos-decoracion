const { body } = require('express-validator');

exports.publicContactValidators = [
  body('name')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 120 }).withMessage('El nombre debe tener entre 2 y 120 caracteres')
    .trim(),
  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es valido')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 40 }).withMessage('El telefono no es valido')
    .trim(),
  body('message')
    .notEmpty().withMessage('El mensaje es obligatorio')
    .isLength({ min: 10, max: 4000 }).withMessage('El mensaje debe tener entre 10 y 4000 caracteres')
    .trim(),
];
