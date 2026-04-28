const router = require('express').Router();
const controller = require('../controllers/events.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { createEventoValidators, updateEventoValidators } = require('../validators/events.validators');

router.use(authMiddleware);

router.get('/stats/summary', controller.getStatsSummary);
router.get('/', controller.getAdminEvents);
router.get('/:id', controller.getAdminEventById);
router.post('/', createEventoValidators, controller.createAdminEvent);
router.put('/:id/publish', controller.publishAdminEvent);
router.put('/:id/unpublish', controller.unpublishAdminEvent);
router.put('/:id', updateEventoValidators, controller.updateAdminEvent);
router.delete('/:id', controller.removeAdminEvent);

module.exports = router;
