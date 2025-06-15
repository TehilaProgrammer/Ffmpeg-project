const fs = require('fs');
const { spawn } = require('child_process');
const archiver = require('archiver');
const path = require('path');
function generateFfmpegCommand(data) {
  const {
    inputPath,
    output_folder,
    sessionId,
    adVolume,
    fps,
    preset,
    audio_rate,
    audio_bitrate,
    audio_codec,
    playlist_name,
    segment_name,
    hls_time,
    profiles
  } = data;

  const gop = fps * hls_time;
  // Use session-specific folder for FFmpeg output
  const sessionOutputPath = path.join(output_folder, sessionId);

  let args = [];
  console.log("Input path:", inputPath);
  console.log("Output folder:", output_folder);
  console.log("Session output path:", sessionOutputPath);

  args.push("-y");
  args.push("-v", "warning");

  let processedInputPath = inputPath;
  if (!/^https?:\/\//i.test(inputPath)) {
    if (!path.isAbsolute(inputPath)) {
      processedInputPath = path.join(process.cwd(), inputPath);
    }
  }
  args.push("-i", processedInputPath);

  args.push("-af", `loudnorm=I=${adVolume}:LRA=2:TP=-2.5,aresample=async=1`);

  let filterComplex = `[0:v]split=${profiles.length}`;
  for (let i = 0; i < profiles.length; i++) {
    filterComplex += `[v${i}]`;
  }
  filterComplex += ";";

  for (let i = 0; i < profiles.length; i++) {
    const { resolution, fps: pfps } = profiles[i];
    const [width, height] = resolution.split('x');
    filterComplex += `[v${i}]scale=${width}:${height}:force_original_aspect_ratio=decrease,fps=${pfps},pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[v${i}out];`;
  }

  filterComplex = filterComplex.slice(0, -1);

  args.push("-filter_complex", filterComplex);

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    args.push(`-map`, `[v${i}out]`);
    args.push(`-c:v:${i}`, "h264");
    args.push(`-pix_fmt:v:${i}`, "yuv420p");
    args.push(`-profile:v:${i}`, p.profile);
    args.push(`-b:v:${i}`, p.bitrate);
    args.push(`-maxrate:v:${i}`, p.maxrate);
    args.push(`-bufsize:v:${i}`, p.bufsize);
    args.push(`-fps_mode`, p.fps_mode);
    args.push(`-g`, p.gop);
    args.push(`-keyint_min`, p.keyint_min);
    args.push(`-level:v:${i}`, p.level);
    args.push(`-preset`, preset);
  }

  for (let i = 0; i < profiles.length; i++) {
    args.push(`-map`, "0:a:0?");
    args.push(`-c:a:${i}`, audio_codec);
    args.push(`-ar`, audio_rate);
    args.push(`-b:a:${i}`, audio_bitrate);
    args.push("-async", "1");
  }

  args.push("-f", "hls");
  args.push("-force_key_frames", `expr:gte(t,n_forced*${hls_time})`);
  args.push("-hls_time", hls_time.toString());
  args.push("-avoid_negative_ts", "make_zero");
  args.push("-hls_playlist_type", "vod");

  args.push("-hls_fmp4_init_filename", `%v_${sessionId}-init.mp4`);
  args.push("-master_pl_name", `${sessionId}-master.m3u8`);

  let streamMap = "";
  for (let i = 0; i < profiles.length; i++) {
    streamMap += `v:${i},a:${i} `;
  }
  args.push("-var_stream_map", streamMap.trim());

  args.push(path.join(sessionOutputPath, `%v_${sessionId}-playlist.m3u8`));

  console.log("Generated FFmpeg args:", args.join(' '));

  return args;
}

function runFfmpegCommand(args, outputFolder, callback) {
  console.log("runFfmpegCommand");
  console.log("Output folder:", outputFolder);
  
  const ffmpeg = spawn('ffmpeg', args, { shell: true });
  console.log("FFmpeg process started");

  ffmpeg.stdout.on('data', (data) => {
    console.log(`✅ stdout: ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    console.error(`⚠️ stderr: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`✅ FFmpeg process exited with code ${code}`);
    
    // Check if output folder exists
    if (!fs.existsSync(outputFolder)) {
      console.error(`❌ Output folder does not exist: ${outputFolder}`);
      if (callback) callback(new Error('Output folder not found'));
      return;
    }

    // List contents of output folder
    console.log("Contents of output folder:", fs.readdirSync(outputFolder));

    const folderName = path.basename(outputFolder);
    const zipPath = path.join(outputFolder, `${folderName}.zip`);
    console.log("Creating zip at:", zipPath);

    // Remove existing zip if it exists
    if (fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
        console.log("Removed existing zip file");
      } catch (err) {
        console.error("Error removing existing zip:", err);
      }
    }

    const output = fs.createWriteStream(zipPath, { mode: 0o666 }); // Set readable permissions
    const archive = archiver("zip", { 
      zlib: { level: 9 },
      store: false // Don't store files, compress them
    });

    output.on("close", () => {
      console.log(`✅ ZIP created (${archive.pointer()} bytes)`);
      // Set file permissions after creation
      try {
        fs.chmodSync(zipPath, 0o666); // Make file readable by all
        console.log("Set zip file permissions to 666");
      } catch (err) {
        console.error("Error setting zip permissions:", err);
      }
      if (callback) callback(null, zipPath);
    });

    output.on("error", (err) => {
      console.error("❌ Error writing zip file:", err);
      if (callback) callback(err);
    });

    archive.on("error", (err) => {
      console.error("❌ Error creating archive:", err);
      if (callback) callback(err);
    });

    archive.on("warning", (err) => {
      console.warn("⚠️ Archive warning:", err);
    });

    // Include all subdirectories in the zip
    archive.directory(outputFolder, false);
    archive.finalize();
  });
}

function ensureVariantFolders(outputFolder, sessionId, profiles) {
  const basePath = path.join(outputFolder, sessionId);
  for (let i = 0; i < profiles.length; i++) {
    const variantFolder = path.join(basePath);
    if (!fs.existsSync(variantFolder)) {
      fs.mkdirSync(variantFolder, { recursive: true });
    }
  }
}

module.exports = { generateFfmpegCommand, runFfmpegCommand, ensureVariantFolders };
 