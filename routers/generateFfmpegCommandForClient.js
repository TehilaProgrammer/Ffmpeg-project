const express = require("express");
const path = require("path");
const router = express.Router();
const { generateFfmpegCommand } = require("../utils/funcFfmpeg");


router.post('/api/generate-command', express.json(), (req, res) => {
    try {
      const config = req.body;
      if (!config.inputPath || !config.output_folder || !config.profiles) {
        return res.status(400).json({ error: 'Missing required parameters in JSON' });
      }
      const ffmpegArgs = generateFfmpegCommand(config);
      const ffmpegCmd = 'ffmpeg ' + ffmpegArgs.map(arg =>
        arg.includes(' ') ? `"${arg}"` : arg
      ).join(' ');
      res.json({ ffmpegCmd });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  module.exports = router;