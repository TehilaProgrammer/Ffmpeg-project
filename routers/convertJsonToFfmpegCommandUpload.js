const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require('fs');


router.post('/api/upload', upload.single('inputVideo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadedPath = req.file.path;
  res.json({ inputPath: uploadedPath });
});
module.exports = router;