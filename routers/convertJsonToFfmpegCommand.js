const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { generateFfmpegCommand, runFfmpegCommand } = require("../utils/funcFfmpeg");
const { sendStatus } = require("../utils/statusManager");
const fs = require('fs');
const upload = multer({ dest: "uploads/" });

router.post("/api/convert", upload.fields([
  { name: "inputVideo", maxCount: 1 },
  { name: "inputPath", maxCount: 1 }
]), async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    if (!req.files?.inputVideo && !req.body.inputPath) {
      return res.status(400).json({ error: "No input video provided" });
    }

    if (req.body.inputPath) {
      const fullPath = req.body.inputPath;
      if (fullPath.startsWith('http://') || fullPath.startsWith('https://')) {
      } else {
        if (!fs.existsSync(fullPath)) {
          return res.status(400).json({ error: 'The local path does not exist on server' });
        }
      }
    }

    sendStatus(sessionId, "processing...");// Get the correct input path based on whether it's a file upload or URL/path
    const fullInputPath = req.files?.inputVideo ?
      path.resolve(req.files.inputVideo[0].path) :
      req.body.inputPath;

    console.log('Processing input:', fullInputPath);

    const ffmpegParams = {
      input_video_url: fullInputPath,
      output_folder: req.body.output_folder,
      adVolume: parseFloat(req.body.adVolume),
      fps: parseInt(req.body.fps),
      bitrate: req.body.bitrate,
      audio_rate: req.body.audio_rate,
      audio_bitrate: req.body.audio_bitrate,
      preset: req.body.preset,
      playlist_name: req.body.playlist_name,
      segment_name: req.body.segment_name,
      hls_time: parseInt(req.body.hls_time),
    };

    if (!fs.existsSync(ffmpegParams.output_folder)) {
      fs.mkdirSync(ffmpegParams.output_folder, { recursive: true });
    }

    console.log("----------------------------------------------------------\n", ffmpegParams);

    const args = generateFfmpegCommand(ffmpegParams);
    sendStatus(sessionId, "uploading ZIP");

    runFfmpegCommand(args, ffmpegParams.output_folder, () => {
      sendStatus(sessionId, "done");
      const zipName = `${path.basename(ffmpegParams.output_folder)}.zip`;
      res.json({
        status: "done",
        message: "FFmpeg completed and ZIP created",
        downloadUrl: `/output/${path.basename(ffmpegParams.output_folder)}/${zipName}`,
        playlistUrl: `/output/${path.basename(ffmpegParams.output_folder)}/${ffmpegParams.playlist_name}`
      });
      console.log(" Sending playlist URL:", `/output/${path.basename(ffmpegParams.output_folder)}/${ffmpegParams.playlist_name}`);
    });
  } catch (error) {
    console.error(error);
    if (sessionId) {
      sendStatus(sessionId, "error: " + error.message);
    }
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;