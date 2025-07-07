# Manual Transcoding - FFmpeg Stream Generator

A web-based application for generating HLS (HTTP Live Streaming) streams from video files using FFmpeg. This tool provides an intuitive interface for configuring video transcoding parameters and generating multiple quality profiles for adaptive streaming.

## Features

- **Web-based Interface**: User-friendly HTML interface for configuring transcoding parameters
- **Multiple Input Methods**: Upload video files or specify file paths
- **Multi-Profile Support**: Generate multiple quality profiles (resolutions, bitrates, codecs)
- **HLS Streaming**: Output HLS-compatible streams with master playlist
- **Audio Processing**: Configurable audio parameters (volume, bitrate, codec, channels)
- **Real-time Status**: Monitor transcoding progress
- **Download Output**: Automatically package results in ZIP format
- **JSON Configuration**: Export/import transcoding configurations

## Prerequisites

- **Node.js** (v14 or higher)
- **FFmpeg** installed and available in system PATH
- **npm** or **yarn** package manager

### Installing FFmpeg

#### Windows
```bash
choco install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd manual_transcoding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Usage

### Basic Workflow

1. **Choose Input Method**
   - Click "Upload File" to upload a video file directly
   - Click "Use File Path" to specify a path to an existing video file

2. **Configure Audio Settings**
   - **Ad Volume**: Audio normalization level (default: -28)
   - **Audio Rate**: Sample rate in Hz (default: 48000)
   - **Audio Bitrate**: Audio bitrate in kbps (default: 128)
   - **Audio Profile**: Choose between AAC HE or AAC Low
   - **Audio Codec**: Select AAC or MP3
   - **Channel Mode**: Stereo or Mono

3. **Configure Video Settings**
   - **Preset**: FFmpeg encoding preset (default: veryfast)
   - **Playlist Name**: Name for the master playlist
   - **Segment Name**: Name for video segments
   - **HLS Time**: Segment duration in seconds (default: 6)

4. **Add Video Profiles**
   - Click "+ Add Profile" to add quality profiles
   - Configure resolution, bitrate, codec, and other parameters for each profile
   - Multiple profiles enable adaptive streaming

5. **Generate Stream**
   - Click "Generate Stream" to start transcoding
   - Monitor progress in the status section
   - Download the ZIP file containing all output files when complete

### Advanced Features

- **JSON Export**: Click "create JSON" to export current configuration
- **FFmpeg Command**: Click "Create FFmpeg Command" to view the generated FFmpeg command
- **Configuration History**: Previous configurations are automatically saved

## Project Structure

```
manual_transcoding/
├── app.js                 # Main Express server
├── package.json           # Dependencies and scripts
├── public/                # Static web assets
│   ├── index.html         # Main web interface
│   ├── script.js          # Frontend JavaScript
│   ├── images/            # UI images
│   └── output/            # Generated output files
├── routers/               # API route handlers
│   ├── config_route.js    # Route configuration
│   ├── convertJsonToFfmpegCommand.js
│   ├── convertJsonToFfmpegCommandUpload.js
│   ├── convertToRealJson.js
│   ├── generateFfmpegCommandForClient.js
│   └── status.js          # Status monitoring
├── utils/                 # Utility functions
│   ├── funcFfmpeg.js      # FFmpeg command generation
│   ├── convert.js         # Conversion utilities
│   └── statusManager.js   # Status management
└── uploads/               # Temporary upload directory
```

## Configuration

### FFmpeg Parameters

The application supports various FFmpeg parameters:

- **Video Codecs**: H.264, H.265, VP9
- **Audio Codecs**: AAC, MP3, Opus
- **Profiles**: Baseline, Main, High
- **Presets**: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow

## Output Format

The application generates HLS-compatible output:

- **Master Playlist**: `master.m3u8` containing all quality variants
- **Segment Files**: `.ts` files for each quality level
- **Individual Playlists**: Separate `.m3u8` files for each quality level
- **ZIP Archive**: All files packaged for easy download

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and in your system PATH
   - Test with `ffmpeg -version` in terminal

2. **Permission errors**
   - Check write permissions for output directories
   - Ensure the application has access to upload and output folders

3. **Large file uploads**
   - Increase upload limits in Express configuration
   - Consider using file paths for very large files

4. **Memory issues**
   - Reduce video quality or resolution
   - Process shorter video segments

### Logs

Check the console output for detailed error messages and processing status.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Version History

- **v1.0.0**: Initial release with basic transcoding functionality
- Multi-profile support
- HLS streaming output
- Web-based interface