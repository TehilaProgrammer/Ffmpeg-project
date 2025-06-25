# FFmpeg Command Generator

A web-based tool for generating and running advanced FFmpeg commands for video streaming and conversion.

This project provides a **user-friendly interface** to build complex FFmpeg commands, preview them, and (optionally) run them on the server.  
Ideal for users creating **HLS streams**, transcoding video, or experimenting with FFmpeg options — without memorizing command-line syntax.

---

## Features

- **Interactive Web Form** – Set video/audio options, profiles, and advanced FFmpeg settings  
- **Multiple Video Profiles** – Add various resolutions/bitrates for adaptive streaming  
- **JSON Preview** – See the exact configuration sent to the backend  
- **FFmpeg Command Preview** – View the full FFmpeg command before running it  
- **Copy to Clipboard** – One-click copy of the command for terminal use  
- **Upload File / Input Path** – Choose to upload a file or enter a server path  
- **Form Validation** – Prevent errors with built-in validation checks  
- **(Optional) Run on Server** – Submit and process jobs server-side  
- **Live Status Updates** – Real-time feedback via server-sent events  
- **Download Output** – Get processed files as a ZIP archive  
- **HLS Playback** – Preview the output stream in-browser  

---

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)  
- FFmpeg installed and available in system `PATH`  

### Installation

```bash

git clone https://github.com/TehilaProgrammer/ffmpeg-command-generator.git
cd ffmpeg-command-generator
npm install

```
##  Run the App

```bash
npm start
```
Visit http://localhost:3000 in your browser.



Usage:

-Choose a video file or provide a path

-Fill in audio/video settings

-Add one or more output profiles

-Click Create JSON or Create FFmpeg Command

-Use Copy Command to copy it

-(Optional) Click Generate Stream to run and download results


Project Structure

public/ – Static frontend files

routers/ – Express route handlers

utils/ – FFmpeg generation and helpers

app.js – Main Express server

package.json – Project dependencies

Customization & Extensions
Add more FFmpeg options by editing the form/backend

Add authentication to save user jobs/history

Enable batch processing for multiple files

Create presets for common use-cases (e.g., "YouTube 1080p")

License
This project is for educational and personal use.
Feel free to modify and adapt it to your needs!

Credits
Built with Node.js, Express, and FFmpeg.
UI inspired by modern streaming tools.


