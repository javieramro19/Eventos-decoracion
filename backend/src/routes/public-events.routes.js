const router = require('express').Router();
const controller = require('../controllers/events.controller');

router.get('/', controller.getPublicEvents);
router.get('/:slug', controller.getPublicEventBySlug);

module.exports = router;
