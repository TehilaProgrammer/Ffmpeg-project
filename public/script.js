//!!definition variables,SSE,and conect to html elements
let showFileInput = true;
let showPathInput = false;
let profileCount = 0;

const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
const eventSource = new EventSource(`/api/status/${sessionId}`);


eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log('Status update:', data);
  document.getElementById("outputJson").textContent = JSON.stringify(data, null, 2);

  if (typeof data.status === "object" && data.status.status === "done") {

    const playlistPath = data.playlistUrl;
    if (data.status.downloadUrl) {

      const downloadBtn = document.getElementById("downloadZip");
      const zipFileName = data.status.downloadUrl.split('/').pop();
      console.log('Setting up download for:', zipFileName);

      // Configure download button with proper attributes
      downloadBtn.href = data.status.downloadUrl;
      downloadBtn.setAttribute('download', zipFileName);
      downloadBtn.setAttribute('type', 'application/zip');
      downloadBtn.style.display = "block";
     }
    //!!add profiles,calculates,update profile
    // if (data.playlistUrl) {
    //   const videoContainer = document.getElementById("videoContainer");
    //   const video = document.getElementById("videoPlayer");

    //   if (Hls.isSupported()) {
    //     const hls = new Hls();
    //     hls.loadSource(data.playlistUrl);
    //     hls.attachMedia(video);
    //     hls.on(Hls.Events.MANIFEST_PARSED, function () {
    //     });
    //     video.addEventListener("error", function (e) {
    //       console.error("Video error (HLS supported):", e);
    //     });
    //   } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    //     video.src = data.playlistUrl;
    //     video.addEventListener("loadedmetadata", function () {
    //     });
    //     video.addEventListener("error", function (e) {
    //       console.error("Video error (native HLS):", e);
    //     });
    //   }

    //   videoContainer.style.display = "block";
    // }
  }
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

//!!update the rest parameters automucally,based on the profile,bitrate as gop,butrate and so on...
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
    profiles.push({
      resolution: document.querySelector(`[name="resolution_${i}"]`).value,
      fps: document.querySelector(`[name="fps_${i}"]`).value,
      bitrate: document.querySelector(`[name="bitrate_${i}"]`).value + "k",
      maxrate: document.querySelector(`[name="maxrate_${i}"]`).value + "k",
      bufsize: document.querySelector(`[name="bufsize_${i}"]`).value + "k",
      profile: document.querySelector(`[name="profile_${i}"]`).value,
      level: document.querySelector(`[name="level_${i}"]`).value,
      gop: document.querySelector(`[name="gop_${i}"]`).value,
      keyint_min: document.querySelector(`[name="keyint_min_${i}"]`).value,
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
    } else {
      alert("Error: " + (result.error || "Unknown error occurred"));
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error generating FFmpeg command: " + error.message);
  }
});


function addProfile() {

  const container = document.getElementById("profilesContainer");
  const html = `
    <fieldset style="margin-top:20px; border:1px solid #ccc; padding:10px; border-radius:8px;">
      <legend>Profile #${profileCount + 1}</legend>
      <label>Resolution & FPS:
        <select name="resolution_fps_${profileCount}" required onchange="updateProfileSettings(this, ${profileCount})">
          <option value="">Select resolution and FPS</option>
          <option value="640x360_25">640x360 (SD) - 25fps</option>
          <option value="768x432_25">768x432 (SD) - 25fps</option>
          <option value="1024x576_25">1024x576 (SD) - 25fps</option>
          <option value="1280x720_25">1280x720 (HD) - 25fps</option>
          <option value="1280x720_50">1280x720 (HD) - 50fps</option>
          <option value="1920x1080_50">1920x1080 (Full HD) - 50fps</option>
        </select>
      </label>
      <input type="hidden" name="resolution_${profileCount}" value="">
      <input type="hidden" name="fps_${profileCount}" value="">
      
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
      <input type="hidden" name="gop_${profileCount}" value="">
      <input type="hidden" name="keyint_min_${profileCount}" value="">
    </fieldset>`;
  container.insertAdjacentHTML("beforeend", html);
  profileCount++;
}

//!! Function to update profile settings based on resolution and FPS selection
function updateProfileSettings(selectElement, profileIndex) {
  const [resolution, fps] = selectElement.value.split('_');
  const profileSelect = document.querySelector(`[name="profile_${profileIndex}"]`);
  const levelSelect = document.querySelector(`[name="level_${profileIndex}"]`);
  const bitrateInput = document.querySelector(`[name="bitrate_${profileIndex}"]`);
  const maxrateInput = document.querySelector(`[name="maxrate_${profileIndex}"]`);
  const bufsizeInput = document.querySelector(`[name="bufsize_${profileIndex}"]`);
  const gopInput = document.querySelector(`[name="gop_${profileIndex}"]`);
  const keyintMinInput = document.querySelector(`[name="keyint_min_${profileIndex}"]`);

  // Set resolution and fps
  document.querySelector(`[name="resolution_${profileIndex}"]`).value = resolution;
  document.querySelector(`[name="fps_${profileIndex}"]`).value = fps;

  // Define settings based on resolution and fps
  const settings = {
    '640x360_25': {
      profile: 'Main',
      level: '3.1',
      bitrate: 734,
      gop: 100
    },
    '768x432_25': {
      profile: 'Main',
      level: '4.0',
      bitrate: 1078,
      gop: 100
    },
    '1024x576_25': {
      profile: 'Main',
      level: '4.0',
      bitrate: 1707,
      gop: 100
    },
    '1280x720_25': {
      profile: 'Main',
      level: '4.0',
      bitrate: 2622,
      gop: 100
    },
    '1280x720_50': {
      profile: 'High',
      level: '4.2',
      bitrate: 3995,
      gop: 200
    },
    '1920x1080_50': {
      profile: 'High',
      level: '4.2',
      bitrate: 4681,
      gop: 200
    }
  };

  if (selectElement.value) {
    const selectedSettings = settings[selectElement.value];

    // Update form fields
    profileSelect.value = selectedSettings.profile;
    levelSelect.value = selectedSettings.level;
    bitrateInput.value = selectedSettings.bitrate;
    maxrateInput.value = selectedSettings.bitrate;
    bufsizeInput.value = selectedSettings.bitrate;
    gopInput.value = selectedSettings.gop;
    keyintMinInput.value = selectedSettings.gop;
  } else {
    // Clear values if no resolution is selected
    profileSelect.value = 'Main';
    levelSelect.value = '3.1';
    bitrateInput.value = '';
    maxrateInput.value = '';
    bufsizeInput.value = '';
    gopInput.value = '';
    keyintMinInput.value = '';
  }
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
    profiles.push({
      resolution: document.querySelector(`[name="resolution_${i}"]`).value,
      fps: document.querySelector(`[name="fps_${i}"]`).value,
      bitrate: document.querySelector(`[name="bitrate_${i}"]`).value + "k",
      maxrate: document.querySelector(`[name="maxrate_${i}"]`).value + "k",
      bufsize: document.querySelector(`[name="bufsize_${i}"]`).value + "k",
      profile: document.querySelector(`[name="profile_${i}"]`).value,
      level: document.querySelector(`[name="level_${i}"]`).value,
      gop: document.querySelector(`[name="gop_${i}"]`).value,
      keyint_min: document.querySelector(`[name="keyint_min_${i}"]`).value,
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
