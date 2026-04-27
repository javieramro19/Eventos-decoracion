const { body } = require('express-validator');

const allowedCategories = ['wedding', 'birthday', 'corporate', 'baptism', 'communion', 'other'];

const sharedPlanValidators = [
  body('planId')
    .optional({ nullable: true })
    .isLength({ max: 80 }).withMessage('El identificador del plan no es valido')
    .trim(),
  body('planName')
    .optional({ nullable: true })
    .isLength({ max: 120 }).withMessage('El nombre del plan no es valido')
    .trim(),
  body('planSummary')
    .optional({ nullable: true })
    .isLength({ max: 2000 }).withMessage('El resumen del plan es demasiado largo')
    .trim(),
  body('basePrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('El precio base debe ser un numero valido'),
  body('extrasTotal')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('El total de extras debe ser un numero valido'),
  body('totalPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('El precio final debe ser un numero valido'),
  body('customExtraNote')
    .optional({ nullable: true })
    .isLength({ max: 2000 }).withMessage('La nota del extra es demasiado larga')
    .trim(),
  body('selectedExtras')
    .optional({ nullable: true })
    .isArray({ max: 20 }).withMessage('Los extras seleccionados no son validos'),
  body('selectedExtras.*.id')
    .optional()
    .isLength({ max: 80 }).withMessage('El id del extra no es valido'),
  body('selectedExtras.*.name')
    .optional()
    .isLength({ max: 120 }).withMessage('El nombre del extra no es valido'),
  body('selectedExtras.*.detail')
    .optional()
    .isLength({ max: 500 }).withMessage('El detalle del extra es demasiado largo'),
  body('selectedExtras.*.price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio del extra no es valido'),
  body('source')
    .optional({ nullable: true })
    .isLength({ max: 50 }).withMessage('La fuente del evento no es valida')
    .trim(),
];

exports.createEventoValidators = [
  body('title')
    .notEmpty().withMessage('El titulo es obligatorio')
    .isLength({ min: 3, max: 200 }).withMessage('El titulo debe tener entre 3 y 200 caracteres')
    .trim(),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 2000 }).withMessage('La descripcion no puede superar 2000 caracteres')
    .trim(),
  body('location')
    .optional({ nullable: true })
    .isLength({ max: 255 }).withMessage('La ubicacion no puede superar 255 caracteres')
    .trim(),
  body('eventDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha del evento no es valida'),
  body('category')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(allowedCategories).withMessage('La categoria seleccionada no es valida'),
  ...sharedPlanValidators,
];

exports.updateEventoValidators = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 }).withMessage('El titulo debe tener entre 3 y 200 caracteres')
    .trim(),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 2000 }).withMessage('La descripcion no puede superar 2000 caracteres')
    .trim(),
  body('location')
    .optional({ nullable: true })
    .isLength({ max: 255 }).withMessage('La ubicacion no puede superar 255 caracteres')
    .trim(),
  body('eventDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha del evento no es valida'),
  body('category')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(allowedCategories).withMessage('La categoria seleccionada no es valida'),
  body('isPublished')
    .optional()
    .isBoolean().withMessage('El estado de publicacion debe ser booleano'),
  body('coverImage')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('La imagen de portada no puede superar 500 caracteres')
    .trim(),
  ...sharedPlanValidators,
];
