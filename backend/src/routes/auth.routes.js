const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { registerValidators, loginValidators } = require('../validators/auth.validators');

router.post('/register', registerValidators, controller.register);
router.post('/login', loginValidators, controller.login);
router.get('/me', authMiddleware, controller.me);

module.exports = router;

