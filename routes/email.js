const express = require('express');
const router = express.Router();

// Email routes placeholder
router.get('/test', (req, res) => {
  res.json({ message: 'Email service is working' });
});

module.exports = router;
