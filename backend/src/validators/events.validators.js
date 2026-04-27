const { body } = require('express-validator');

exports.createEventoValidators = [
  body('title')
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('La descripción no puede superar 2000 caracteres')
    .trim(),
];

exports.updateEventoValidators = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres')
    .trim(),
];