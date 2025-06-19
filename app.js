console.log("express app is ready to lunch");

const express=require("express");//import express module
const http=require("http");//import http for server running
const path=require("path");
const{routesInit}=require("./routers/config_route")
const app=express();//server definition
const fs = require('fs');
const PORT=process.env.PORT||"3000";
app.use(express.json());

// Handle zip file downloads
app.get('/output/:timestamp/:filename', (req, res) => {
  const { timestamp,  filename } = req.params;
  console.log('Download request params:', { timestamp, filename });
  
  const zipPath = path.join(__dirname, 'public', 'output', timestamp, filename);
  console.log('Attempting to serve zip file:', zipPath);
  
  // Validate the request
  if (!timestamp  || !filename) {
    console.error('Invalid request parameters:', req.params);
    return res.status(400).json({ error: 'Invalid request parameters' });
  }
  
  // Check if file exists
  if (!fs.existsSync(zipPath)) {
    console.error('Zip file not found:', zipPath);
    return res.status(404).json({ 
      error: 'Zip file not found',
      path: zipPath,
      params: req.params
    });
  }

  try {
    const stats = fs.statSync(zipPath);
    console.log('File stats:', {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
    
    if (stats.size === 0) {
      console.error('Zip file is empty:', zipPath);
      return res.status(500).json({ 
        error: 'Zip file is empty',
        path: zipPath
      });
    }

    // Set headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(zipPath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming zip file:', {
        error: error.message,
        code: error.code,
        path: zipPath
      });
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error streaming file',
          details: error.message
        });
      }
    });

    fileStream.on('open', () => {
      console.log('Starting file stream for:', filename);
    });

    fileStream.on('end', () => {
      console.log('Finished streaming file:', filename);
    });
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving zip file:', {
      error: error.message,
      code: error.code,
      path: zipPath
    });
    res.status(500).json({ 
      error: 'Error serving file',
      details: error.message
    });
  }
});

routesInit(app);
app.use(express.static(path.join(__dirname,"public")));
const server=http.createServer(app);//create http server
server.listen(PORT);
