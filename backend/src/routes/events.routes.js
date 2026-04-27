const router = require('express').Router();
router.get('/', (req, res) => {
  res.json({ message: 'Ruta de eventos funcionando', data: [] });
});
module.exports = router;