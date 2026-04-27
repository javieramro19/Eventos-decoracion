const router = require('express').Router();
const controller = require('../controllers/events.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { createEventoValidators, updateEventoValidators } = require('../validators/events.validators');

// Aplicamos el middleware a todas las rutas de este archivo
router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', createEventoValidators, controller.create);
router.put('/:id', updateEventoValidators, controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
