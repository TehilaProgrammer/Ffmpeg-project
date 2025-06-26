const express = require('express');
const router = express.Router();
const convertJson = require('../utils/convert');

router.put('/convert', (req, res) => {
  const input = req.body;
  const result = convertJson(input);
  res.json(result);
});

module.exports = router;
