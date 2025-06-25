const fs = require('fs');
const { spawn } = require('child_process');
const archiver = require('archiver');
const path = require('path');

function generateFfmpegCommand(data) {

  const filePath = path.join(__dirname, 'last_used_data.json');
  let existingData = [];

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(fileContent);
      if (!Array.isArray(existingData)) {
        existingData = [];
      }
    } catch (err) {
      console.error("error json:", err);
      existingData = [];
    }
  }

  existingData.push(data);

  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');

  console.log("Got data in generateFfmpegCommand:", data);

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
    hls_time,
    profiles
  } = data;


  if (!profiles || !profiles.length)
    throw new Error("No video profiles provided.");

  const gop = fps * hls_time;
  const base = path.resolve(path.join(output_folder, sessionId));
  fs.mkdirSync(base, { recursive: true });


  const args = [
    '-y', '-v', 'warning',
    '-i', inputPath,
    '-threads', '0', '-max_muxing_queue_size', '256',
    '-max_alloc', '536870912', '-bufsize', '1M', '-maxrate', '1M',
    '-af', `loudnorm=I=${adVolume}:LRA=2:TP=-2.5,aresample=async=1`
  ];

  let fc = `[0:v]split=${profiles.length}`;
  profiles.forEach((_, i) => fc += `[v${i}]`);
  fc += ';';
  profiles.forEach((p, i) => {
    const [w, h] = p.resolution.split('x');
    fc += `[v${i}]scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
      `fps=${p.fps},pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2[v${i}out];`;
  });
  args.push('-filter_complex', fc.slice(0, -1));

  // מיפוי סטרימים
  profiles.forEach((p, i) => {
    args.push(
      '-map', `[v${i}out]`,
      `-c:v:${i}`, 'libx264',
      `-pix_fmt:v:${i}`, 'yuv420p',
      `-profile:v:${i}`, 'baseline',
      `-b:v:${i}`, p.bitrate,
      `-maxrate:v:${i}`, p.maxrate,
      `-bufsize:v:${i}`, p.bufsize,
      '-preset', preset || 'ultrafast',
      '-tune', 'zerolatency',
      '-g', p.gop || gop,
      '-keyint_min', p.keyint_min || gop,

      '-map', '0:a:0',
      `-c:a:${i}`, audio_codec || 'aac',
      `-ar:${i}`, audio_rate || '44100',
      `-b:a:${i}`, audio_bitrate || '96k'
    );
  });

  args.push(
    '-f', 'hls',
    '-hls_time', `${hls_time}`,
    '-hls_list_size', '0',
    '-hls_segment_type', 'mpegts',
    '-hls_flags', 'independent_segments',
    '-hls_playlist_type', 'vod',
    '-hls_segment_filename', path.join(base, 'stream_%v_%03d.ts'),
    '-master_pl_name', 'master.m3u8',
    '-var_stream_map', profiles.map((_, i) => `v:${i},a:${i}`).join(' '),
    path.join(base, 'playlist_%v.m3u8')
  );

  console.log("✅ FFmpeg args:\n", args.join(' '));
  return args;
}


function runFfmpegCommand(args, outputFolder, callback) {
  console.log("runFfmpegCommand");
  console.log("Output folder:", outputFolder);

  const ffmpeg = spawn('ffmpeg', args);
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

    // Create zip file in the parent directory (next to the output folder)
    const zipFileName = path.basename(outputFolder) + '.zip';
    const zipPath = path.join(path.dirname(outputFolder), zipFileName);
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

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
      store: false
    });

    output.on('close', () => {
      console.log(`✅ ZIP created (${archive.pointer()} bytes) at ${zipPath}`);

      // Verify the zip file exists and has content
      try {
        const stats = fs.statSync(zipPath);
        if (stats.size === 0) {
          console.error('❌ Created zip file is empty');
          if (callback) callback(new Error('Created zip file is empty'));
          return;
        }
        console.log(`✅ Zip file size: ${stats.size} bytes`);

        // Set file permissions
        fs.chmodSync(zipPath, 0o666);
        console.log('✅ Set zip file permissions to 666');

        if (callback) callback(null, zipPath);
      } catch (err) {
        console.error('❌ Error verifying zip file:', err);
        if (callback) callback(err);
      }
    });

    output.on('error', (err) => {
      console.error('❌ Error writing zip file:', err);
      if (callback) callback(err);
    });

    archive.on('error', (err) => {
      console.error('❌ Error creating archive:', err);
      if (callback) callback(err);
    });

    archive.on('warning', (err) => {
      console.warn('⚠️ Archive warning:', err);
    });

    archive.directory(outputFolder, path.basename(outputFolder));
    archive.pipe(output);
    archive.finalize();
  });
}


module.exports = { generateFfmpegCommand, runFfmpegCommand };