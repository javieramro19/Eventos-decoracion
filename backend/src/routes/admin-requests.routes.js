const router = require('express').Router();
const controller = require('../controllers/events.controller');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);
router.use(adminOnlyMiddleware);

router.put('/:id/approve', controller.approveAdminEvent);
router.put('/:id/reject', controller.rejectAdminEvent);

module.exports = router;
