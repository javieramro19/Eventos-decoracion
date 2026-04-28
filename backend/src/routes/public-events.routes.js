const router = require('express').Router();
const controller = require('../controllers/events.controller');
const { publicContactValidators } = require('../validators/public-events.validators');

router.get('/', controller.getPublicEvents);
router.get('/:slug', controller.getPublicEventBySlug);
router.post('/:slug/contact', publicContactValidators, controller.createPublicEventContact);

module.exports = router;
