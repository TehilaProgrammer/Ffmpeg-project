let showFileInput = true;
let showPathInput = false;
let profileCount = 0;

const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
const eventSource = new EventSource(`/api/status/${sessionId}`);


eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log('Status update:', data);
  document.getElementById("outputJson").textContent = JSON.stringify(data, null, 2);
};

eventSource.onerror = function (error) {
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

document.getElementById("ffmpegForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);

  const inputVideo = document.getElementById("inputFileVideo")?.files[0];
  const inputPath = document.getElementById("inputPathVideo")?.value?.trim();
  const showFileInput = document.getElementById("fileInputSection").style.display !== "none";
  const showPathInput = document.getElementById("pathInputSection").style.display !== "none";

  if ((showFileInput && !inputVideo) || (showPathInput && !inputPath)) {
    alert("Please provide either a video file or input path according to your selection");
    return;
  }

  let uploadedInputPath = inputPath;
  if (showFileInput) {
    const uploadFormData = new FormData();
    uploadFormData.append("inputVideo", inputVideo);

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: uploadFormData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult.inputPath) {
      alert("Failed to upload video file.");
      return;
    }
    uploadedInputPath = uploadResult.inputPath;
  }

  const outputFolder = `public/output/${new Date().toISOString().replace(/[:.]/g, "_")}`;
  const profiles = [];
  
  for (let i = 0; i < profileCount; i++) {
    // Get individual resolution width and height for each profile
    const width = document.querySelector(`[name="resolution_width_${i}"]`).value;
    const height = document.querySelector(`[name="resolution_height_${i}"]`).value;
    const resolution = `${width}x${height}`;
    
    // Get bitrate and set defaults for other values
    const bitrate = document.querySelector(`[name="bitrate_${i}"]`).value;
    const maxrate = document.querySelector(`[name="maxrate_${i}"]`).value || bitrate;
    const bufsize = document.querySelector(`[name="bufsize_${i}"]`).value || bitrate;
    const gop = document.querySelector(`[name="gop_${i}"]`).value || "100";
    const keyintMin = document.querySelector(`[name="keyint_min_${i}"]`).value || "100";
    
    profiles.push({
      resolution: resolution,
      fps: document.querySelector(`[name="fps_${i}"]`).value,
      bitrate: bitrate + "k",
      maxrate: maxrate + "k",
      bufsize: bufsize + "k",
      profile: document.querySelector(`[name="profile_${i}"]`).value,
      level: document.querySelector(`[name="level_${i}"]`).value,
      gop: gop,
      keyint_min: keyintMin,
      codec: "h264",
      pix_fmt: "yuv420p",
      fps_mode: "cfr"
    });
  }

  const json = {
    inputPath: uploadedInputPath,
    output_folder: outputFolder,
    adVolume: document.getElementById("adVolume").value,
    audio_rate: document.getElementById("audioRate").value,
    audio_bitrate: document.getElementById("audioBitrate").value + "k",
    audio_profile: document.getElementById("audioProfile").value,
    audio_codec: document.getElementById("audioCodec").value,
    channel_mode: document.getElementById("channelMode").value,
    preset: document.getElementById("preset").value,
    playlist_name: document.getElementById("playlistName").value + ".m3u8",
    segment_name: document.getElementById("segmentName").value + "_%03d.ts",
    hls_time: document.getElementById("hlsTime").value,
    sessionId,
    profiles,
  };

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();

    if (result.status == "done") {
      document.getElementById("outputJson").textContent = JSON.stringify(result, null, 2);
      downloadZip(result.downloadUrl)
      videoPlayer(result.playlistUrl)
    } else {
      alert("Error: " + (result.error || "Unknown error occurred"));
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error generating FFmpeg command: " + error.message);
  }
});

function downloadZip(downloadUrl) {
  const downloadBtn = document.getElementById("downloadZip");
  const zipFileName = downloadUrl.split('/').pop();

  // Configure download button with proper attributes
  downloadBtn.href = downloadUrl;
  downloadBtn.setAttribute('download', zipFileName);
  downloadBtn.setAttribute('type', 'application/zip');
  downloadBtn.style.display = "block";
}

function videoPlayer(playlistUrl){
  const videoContainer = document.getElementById("videoContainer");
  const video = document.getElementById("videoPlayer");

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(playlistUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function () {});
    video.addEventListener("error", function (e) {
      console.error("Video error (HLS supported):", e);
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = playlistUrl;
    video.addEventListener("loadedmetadata", function () {});
    video.addEventListener("error", function (e) {
      console.error("Video error (native HLS):", e);
    });
  }

  videoContainer.style.display = "block";
}

function addProfile() {
  const container = document.getElementById("profilesContainer");
  const html = `
    <fieldset style="margin-top:20px; border:1px solid #ccc; padding:10px; border-radius:8px;">
      <legend>Profile #${profileCount + 1}</legend>
      
      <label>Resolution Width:
        <input type="number" name="resolution_width_${profileCount}" required min="1" max="7680" placeholder="e.g., 1920">
      </label>
      
      <label>Resolution Height:
        <input type="number" name="resolution_height_${profileCount}" required min="1" max="4320" placeholder="e.g., 1080">
      </label>
      
      <label>FPS:
        <input type="number" name="fps_${profileCount}" required min="1" max="120" step="0.1" placeholder="e.g., 25">
      </label>
      
      <input type="hidden" name="resolution_${profileCount}" value="">
      
      <label>Profile:
        <select name="profile_${profileCount}" required>
          <option value="Main">Main</option>
          <option value="High">High</option>
        </select>
      </label>
      
      <label>Level:
        <select name="level_${profileCount}" required>
          <option value="3.1">3.1</option>
          <option value="4.0">4.0</option>
          <option value="4.2">4.2</option>
        </select>
      </label>

      <label>Bitrate (kbps):
        <input type="number" name="bitrate_${profileCount}" required min="100" max="10000" placeholder="Enter bitrate">
      </label>

      <input type="hidden" name="maxrate_${profileCount}" value="">
      <input type="hidden" name="bufsize_${profileCount}" value="">
      <input type="hidden" name="gop_${profileCount}" value="100">
      <input type="hidden" name="keyint_min_${profileCount}" value="100">
    </fieldset>`;
  container.insertAdjacentHTML("beforeend", html);
  profileCount++;
}

//!!JSON building
function buildFfmpegJson() {

  console.log("in build JSON");
  console.log(profileCount);

  // const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const inputPath = document.getElementById("inputPathVideo").value.trim();
  const now = new Date();
  const outputFolder = `public/output/${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}_${now.getMinutes().toString().padStart(2, '0')}_${now.getSeconds().toString().padStart(2, '0')}_${now.getMilliseconds()}`;
  
  const profiles = [];

  for (let i = 0; i < profileCount; i++) {
    // Get individual resolution width and height for each profile
    const width = document.querySelector(`[name="resolution_width_${i}"]`).value;
    const height = document.querySelector(`[name="resolution_height_${i}"]`).value;
    const resolution = `${width}x${height}`;
    
    // Get bitrate and set defaults for other values
    const bitrate = document.querySelector(`[name="bitrate_${i}"]`).value;
    const maxrate = document.querySelector(`[name="maxrate_${i}"]`).value || bitrate;
    const bufsize = document.querySelector(`[name="bufsize_${i}"]`).value || bitrate;
    const gop = document.querySelector(`[name="gop_${i}"]`).value || "100";
    const keyintMin = document.querySelector(`[name="keyint_min_${i}"]`).value || "100";
    
    profiles.push({
      resolution: resolution,
      fps: document.querySelector(`[name="fps_${i}"]`).value,
      bitrate: bitrate + "k",
      maxrate: maxrate + "k",
      bufsize: bufsize + "k",
      profile: document.querySelector(`[name="profile_${i}"]`).value,
      level: document.querySelector(`[name="level_${i}"]`).value,
      gop: gop,
      keyint_min: keyintMin,
      codec: "h264",
      pix_fmt: "yuv420p",
      fps_mode: "cfr"
    });
  }

  const json = {
    inputPath,
    output_folder: outputFolder,
    adVolume: document.getElementById("adVolume").value,
    audio_rate: document.getElementById("audioRate").value,
    audio_bitrate: document.getElementById("audioBitrate").value + "k",
    audio_profile: document.getElementById("audioProfile").value,
    audio_codec: document.getElementById("audioCodec").value,
    channel_mode: document.getElementById("channelMode").value,
    preset: document.getElementById("preset").value,
    playlist_name: document.getElementById("playlistName").value + ".m3u8",
    segment_name: document.getElementById("segmentName").value + "_%03d.ts",
    hls_time: document.getElementById("hlsTime").value,
    sessionId,
    profiles
  };

  console.log("Generated JSON:", json);
  document.getElementById("outputJson").textContent = JSON.stringify(json, null, 2);
}
