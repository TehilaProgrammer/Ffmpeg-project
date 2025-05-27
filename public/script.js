let showFileInput = true;
let showPathInput = false;

const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
const eventSource = new EventSource(`/api/status?sessionId=${sessionId}`);
eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log('Status update:', data);  
  document.getElementById("outputJson").textContent = JSON.stringify(data, null, 2);

  if (data.status === "done" && data.downloadUrl) {
    const downloadBtn = document.getElementById("downloadZip");
    downloadBtn.href = data.downloadUrl;
    downloadBtn.style.display = "block";
  }
};

eventSource.onerror = function(error) {
  console.error('EventSource error:', error);
  eventSource.close();
};

document.getElementById("chooseFileBtn").addEventListener("click", function () {
  showFileInput = true;
  showPathInput = false;

  document.getElementById("fileInputSection").style.display = "block";
  document.getElementById("pathInputSection").style.display = "none";
  document.getElementById("errorMessage").style.display = "none";
});

document.getElementById("choosePathBtn").addEventListener("click", function () {
  showFileInput = false;
  showPathInput = true;

  document.getElementById("fileInputSection").style.display = "none";
  document.getElementById("pathInputSection").style.display = "block";
  document.getElementById("errorMessage").style.display = "none";
});

document.getElementById("ffmpegForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const inputFileVideo = document.getElementById("inputFileVideo").files[0];
  const inputPathVideo = document.getElementById("inputPathVideo").value.trim();
  const errorMessage = document.getElementById("errorMessage");

  if ((showFileInput && !inputFileVideo) || (showPathInput && inputPathVideo === "")) {
    errorMessage.textContent = "You must provide a file or a path according to your selection";
    errorMessage.style.display = "block";
    return;
  } else {
    errorMessage.style.display = "none";
  }

  const formData = new FormData();

  if (showFileInput) {
    formData.append("inputVideo", inputFileVideo);
  } else if (showPathInput) {
    formData.append("inputPath", inputPathVideo);
  }

const now = new Date();
const timestampFolder =
  "output_" +
  now.getFullYear() + "-" +
  String(now.getMonth() + 1).padStart(2, "0") + "-" +
  String(now.getDate()).padStart(2, "0") + "_" +
  String(now.getHours()).padStart(2, "0") + "-" +
  String(now.getMinutes()).padStart(2, "0") + "-" +
  String(now.getSeconds()).padStart(2, "0");

formData.append("output_folder", `public/output/${timestampFolder}`);
  formData.append("adVolume", document.getElementById("adVolume").value);
  formData.append("fps", document.getElementById("fps").value);
  formData.append("bitrate", document.getElementById("bitrate").value + "k");
  formData.append("audio_rate", document.getElementById("audioRate").value);
  formData.append("audio_bitrate", document.getElementById("audioBitrate").value + "k");
  formData.append("preset", document.getElementById("preset").value);
  formData.append("playlist_name", document.getElementById("playlistName").value + ".m3u8");
  formData.append("segment_name", document.getElementById("segmentName").value + "_%03d.ts");
  formData.append("hls_time", document.getElementById("hlsTime").value);
  formData.append("sessionId", sessionId);


  fetch("/api/convert", {
    method: "POST",
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById("outputJson").textContent = JSON.stringify(data, null, 2);
      console.log("Server response:", data);
      if (data.downloadUrl) {
        const downloadBtn = document.getElementById("downloadZip");
        downloadBtn.href = data.downloadUrl;
        downloadBtn.style.display = "block";
      }
    })
    .catch(error => {
      console.error("Error sending data:", error);
    });
});




