# Visualizer Studio

Visualizer Studio is a local app that turns:

- an audio file
- an image

into a rendered MP4 music visualizer video using FFmpeg.

## Features

- Upload audio and artwork in the browser
- Pick from 31 visualizer styles
- Tweak the uploaded image before render with basic brightness, contrast, saturation, zoom, and position controls
- Follow a clearer step-by-step workflow for uploads, image framing, style selection, and export
- Browse categories and compare built-in style preview thumbnails before rendering
- Use advanced bass-reactive modes where the image pulses and shakes with the low end
- Render in `16:9`, `1:1`, or `9:16`
- Start with a fast `15s Preview` or render the full track
- Add optional track title and artist text overlays
- Stretch the uploaded artwork across the full output frame
- Watch render progress with background job polling
- Download the generated video file directly from the app

## Supported Inputs

- Audio: MP3, WAV, FLAC, M4A, AAC, OGG
- Image: PNG, JPG, JPEG, WEBP

## Run It

```bash
npm start
```

Then open:

```text
http://127.0.0.1:3000
```

## Deploy to Vercel

This app is configured to run as a full-stack application on Vercel with the backend API and frontend together.

### Steps:

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Vercel config for backend deployment"
   git push
   ```

2. **Deploy using Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel
   ```
   
   Or use the **Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Vercel will auto-detect the Node.js backend and deploy a serverless instance

3. **Environment Variables** (optional for Vercel):
   - `VISUALIZER_PYTHON`: Path to Python with Pillow for bass-reactive styles
   
4. **After deployment**:
   - Your app will be available at `https://<your-project-name>.vercel.app`
   - Both frontend and API endpoints will work at the same domain
   - The frontend will automatically detect and use the backend for rendering

### Notes:

- The `vercel.json` file configures routing for both static files and API endpoints
- Rendered videos are stored in the serverless function's `/tmp` directory (ephemeral)
- For persistent storage of videos, configure a cloud storage provider (e.g., AWS S3, Cloudinary)
- Jobs are kept in memory during execution only

## Notes

- Rendering happens locally with the installed `ffmpeg` and `ffprobe` binaries.
- Advanced bass-reactive styles require a Python with `Pillow`; if needed you can point the app at one with `VISUALIZER_PYTHON=/path/to/python3 npm start`
- Jobs are kept in memory while the server is running.
- Rendered videos are stored in `tmp/`.
- The current upload flow sends files to the backend as base64, so very large files are not ideal.
