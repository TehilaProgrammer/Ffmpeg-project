const express = require('express');
const router = express.Router();
const { addStream, removeStream } = require('../utils/statusManager');

router.get("/api/status", (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);

  // Add this stream to our status manager
  addStream(sessionId, res);

  // Clean up when the connection closes
  req.on("close", () => {
    removeStream(sessionId);
  });
});

module.exports = router;