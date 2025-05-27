const statusStreams = {};

function sendStatus(sessionId, message) {
  const stream = statusStreams[sessionId];
  if (stream) {
    stream.write(`data: ${JSON.stringify({ status: message })}\n\n`);
  }
}

function addStream(sessionId, res) {
  statusStreams[sessionId] = res;
}

function removeStream(sessionId) {
  delete statusStreams[sessionId];
}

module.exports = {
  sendStatus,
  addStream,
  removeStream
}; 