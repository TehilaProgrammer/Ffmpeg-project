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

  // fs.writeFileSync(
  //   path.join(__dirname, 'last_used_data.json'),
  //   JSON.stringify(data, null, 2),
  //   'utf8'
  // );
  
  // console.log("Got data in generateFfmpegCommand:", data);

  const {
    input_video_url,
    output_folder,
    adVolume,
    fps,
    bitrate,
    preset,
    audio_rate,
    audio_bitrate,
    playlist_name,
    segment_name,
    //segment_pattern,
    hls_time,
    hls_list_size
  } = data;

  const gop = fps * hls_time;

  const segmentPath = path.join(output_folder, segment_name);
  const playlistPath = path.join(output_folder, playlist_name);

  let args = [];
  args.push("-y");
  args.push("-v", "warning");
  let inputPath = input_video_url;

  if (!/^https?:\/\//i.test(input_video_url)) {
    if (!path.isAbsolute(input_video_url)) {
      inputPath = path.join(process.cwd(), input_video_url);
    } else {
      inputPath = input_video_url;
    }
  }
  args.push("-i", `"${inputPath}"`);


  args.push("-af", `loudnorm=I=${adVolume}:LRA=2:TP=-2.5,aresample=async=1`);

  args.push("-r", fps.toString());

  args.push("-c:v", 'h264');
  args.push('-preset', preset);
  args.push("-b:v", bitrate);
  args.push("-maxrate", bitrate);
  args.push("-bufsize", bitrate);
  args.push("-g", gop.toString());
  args.push("-keyint_min", gop.toString());
  args.push("-force_key_frames", `expr:gte(t,n_forced*${hls_time})`);

  args.push("-c:a", "aac");
  args.push("-ar", audio_rate);
  args.push("-b:a", audio_bitrate);

  args.push("-f", "hls");
  args.push("-hls_time", hls_time.toString());
  args.push("-hls_playlist_type", "vod");
  args.push("-hls_segment_filename", `"${segmentPath}"`);
  args.push(playlistPath);

  const command = args.join(' ');
  console.log("Generated FFmpeg command:", command);

  return args;
}

function runFfmpegCommand(args, outputFolder, callback) {
  const ffmpeg = spawn('ffmpeg', args, { shell: true });

  ffmpeg.stdout.on('data', (data) => {
    console.log(`✅ stdout: ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    console.error(`⚠️ stderr: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`✅ FFmpeg process exited with code ${code}`);

    const folderName = path.basename(outputFolder);
    const zipPath = path.join(outputFolder, `${folderName}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ ZIP created (${archive.pointer()} bytes)`);
      if (callback) callback();
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(outputFolder, false);
    archive.finalize();
  });
}

module.exports = { generateFfmpegCommand, runFfmpegCommand };
