const express = require("express");
const path = require("path");
const router = express.Router();
const { generateFfmpegCommand, runFfmpegCommand, ensureVariantFolders } = require("../utils/funcFfmpeg");
const { sendStatus } = require("../utils/statusManager");
const fs = require('fs');

router.post('/api/convert', express.json(), async (req, res) => {
  try {
    const config = req.body;
    console.log("config", config);
    if (!config.inputPath || !config.output_folder || !config.profiles) {
      return res.status(400).json({ error: 'Missing required parameters in JSON' });
    }
    ensureVariantFolders(config.output_folder, config.sessionId, config.profiles);
    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.output_folder)) {
      fs.mkdirSync(config.output_folder, { recursive: true });
    }
    const ffmpegArgs = generateFfmpegCommand(config);
    // Use the base output folder for zip creation, not the session-specific folder
    const baseOutputPath = config.output_folder;

    runFfmpegCommand(ffmpegArgs, baseOutputPath, (err, zipPath) => {
      if (err) {
        console.error('Error creating zip:', err);
        sendStatus(config.sessionId, "error: " + err.message);
        return res.status(500).json({ error: 'Failed to create zip file' });
      }
      
      sendStatus(config.sessionId, "done");
      // Get the relative path from public directory
      const relativeZipPath = path.relative(path.join(__dirname, '..', 'public'), zipPath);
      res.json({
        status: "done",
        message: "FFmpeg completed and ZIP created",
        downloadUrl: '/' + relativeZipPath.replace(/\\/g, '/'),
        playlistUrl: `/output/${path.basename(config.output_folder)}/${config.sessionId}-master.m3u8`
      });
    });

  } catch (err) {
    console.error('Conversion error:', err);
    if (config.sessionId) {
      sendStatus(config.sessionId, "error: " + err.message);
    }
    res.status(500).json({ error: 'Conversion failed' });
  }
});
module.exports = router;