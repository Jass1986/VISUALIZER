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

## Notes

- Rendering happens locally with the installed `ffmpeg` and `ffprobe` binaries.
- Advanced bass-reactive styles require a Python with `Pillow`; if needed you can point the app at one with `VISUALIZER_PYTHON=/path/to/python3 npm start`
- Jobs are kept in memory while the server is running.
- Rendered videos are stored in `tmp/`.
- The current upload flow sends files to the backend as base64, so very large files are not ideal.
