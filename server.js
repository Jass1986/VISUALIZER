// Visualizer Studio Server - Railway Deployment v2
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const TMP_DIR = path.join(ROOT, "tmp");
const DATA_DIR = path.join(ROOT, "data");
const STYLE_USAGE_FILE = path.join(DATA_DIR, "style-usage.json");
const jobs = new Map();

fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

function resolveRendererPython() {
  const candidates = [
    process.env.VISUALIZER_PYTHON,
    "/usr/bin/python3",
    "/usr/local/bin/python3",
    "python3",
    "python",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["-c", "import PIL; print('PIL_OK')"], {
      cwd: ROOT,
      env: process.env,
      encoding: "utf-8",
    });

    if (probe.status === 0 && probe.stdout.includes("PIL_OK")) {
      return candidate;
    }
  }

  return null;
}

const RENDERER_PYTHON = resolveRendererPython();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};

const OUTPUT_FORMATS = {
  widescreen: {
    name: "Widescreen",
    width: 1280,
    height: 720,
    framePaddingRatio: 0.055,
    vizWidthRatio: 0.84,
  },
  square: {
    name: "Square",
    width: 1080,
    height: 1080,
    framePaddingRatio: 0.055,
    vizWidthRatio: 0.86,
  },
  vertical: {
    name: "Vertical",
    width: 1080,
    height: 1920,
    framePaddingRatio: 0.045,
    vizWidthRatio: 0.84,
  },
};

const CLIP_MODES = {
  preview: {
    name: "15s Preview",
    durationSeconds: 15,
  },
  full: {
    name: "Full Track",
    durationSeconds: null,
  },
};

const STYLE_PRESETS = {
  pulse: {
    name: "Pulse Bars",
    description: "Full-screen artwork with bright equalizer bars along the bottom edge.",
    overlayHeightRatio: 0.22,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = height - vizHeight - Math.round(pad * 1.2);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.08:brightness=-0.08:saturation=1.18[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=log:fscale=log:colors=0x00d1ff|0xff4fd8|0xffffff,format=rgba,colorchannelmixer=aa=0.94[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=black@0.18:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${pad}:w=${width - pad * 2}:h=${height - pad * 2}:color=white@0.05:t=2[framed]`,
        `[framed][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  wave: {
    name: "Neon Wave",
    description: "A clean waveform ribbon floating over the full-screen artwork.",
    overlayHeightRatio: 0.17,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = Math.round(height * 0.66);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=10,eq=contrast=1.12:brightness=-0.1:saturation=1.22[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showwaves=s=${vizWidth}x${vizHeight}:mode=line:rate=30:colors=0x00ffb3|0xffffff,format=rgba,colorchannelmixer=aa=0.98[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x04111a@0.22:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${pad}:w=${width - pad * 2}:h=${height - pad * 2}:color=0x30d5ff@0.08:t=fill[surface]`,
        `[surface][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  spectrum: {
    name: "Spectrum Heat",
    description: "A wide scrolling spectrum layered over a full-frame image.",
    overlayHeightRatio: 0.2,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = height - vizHeight - Math.round(pad * 1.1);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=6:1,eq=contrast=1.1:brightness=-0.1:saturation=1.16[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showspectrum=s=${vizWidth}x${vizHeight}:mode=combined:slide=scroll:color=rainbow:scale=log:win_func=hann,format=rgba,colorchannelmixer=aa=0.92[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=black@0.22:t=fill[toned]`,
        `[toned][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  scope: {
    name: "Stereo Scope",
    description: "A vector-scope centerpiece glowing over the full-screen image.",
    overlayHeightRatio: 0.28,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const scopeSize = Math.round(Math.min(vizWidth, vizHeight * 1.15));
      const scopeY = Math.round(height * 0.48);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=8,eq=contrast=1.12:brightness=-0.1:saturation=1.24[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]pan=stereo|c0=c0|c1=c0,avectorscope=s=${scopeSize}x${scopeSize}:zoom=1.2:draw=line:rf=18:gf=220:bf=255:af=0.85,format=rgba[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x050c16@0.24:t=fill[toned]`,
        `[toned][viz]overlay=(W-w)/2:${scopeY}[visual]`,
      ];
    },
  },
  mirror: {
    name: "Mirror Line",
    description: "Mirrored waveform rails with the artwork stretched edge to edge.",
    overlayHeightRatio: 0.13,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const topWaveY = Math.round(height * 0.62);
      const bottomWaveY = topWaveY + vizHeight + Math.round(pad * 0.3);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.08:brightness=-0.11:saturation=1.18[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0xffffff|0xff7adc,format=rgba,colorchannelmixer=aa=0.98[topviz]`,
        `[afx2]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0x30d5ff|0xffffff,format=rgba,colorchannelmixer=aa=0.62,vflip[bottomviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x08131f@0.16:t=fill[toned]`,
        `[toned][topviz]overlay=(W-w)/2:${topWaveY}[waveone]`,
        `[waveone][bottomviz]overlay=(W-w)/2:${bottomWaveY}[visual]`,
      ];
    },
  },
  skyline: {
    name: "Skyline Bars",
    description: "Tall city-light bars rising from the bottom over a full-screen image.",
    overlayHeightRatio: 0.34,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = height - vizHeight - Math.round(pad * 0.8);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.09:brightness=-0.12:saturation=1.14[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0x7cff98|0x30d5ff|0xffffff,format=rgba,colorchannelmixer=aa=0.9[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=black@0.24:t=fill[toned]`,
        `[toned][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  halo: {
    name: "Halo Scope",
    description: "A scope centerpiece with a thin bottom wave and a full-frame background.",
    overlayHeightRatio: 0.11,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const scopeSize = Math.round(Math.min(width, height) * 0.38);
      const scopeY = Math.round(height * 0.26);
      const waveY = height - vizHeight - Math.round(pad * 1.25);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=7,eq=contrast=1.1:brightness=-0.1:saturation=1.22[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]pan=stereo|c0=c0|c1=c0,avectorscope=s=${scopeSize}x${scopeSize}:zoom=1.05:draw=line:rf=255:gf=95:bf=200:af=0.82,format=rgba[scopeviz]`,
        `[afx2]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0xffffff|0x30d5ff,format=rgba,colorchannelmixer=aa=0.9[waveviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=black@0.2:t=fill[toned]`,
        `[toned][scopeviz]overlay=(W-w)/2:${scopeY}[scopeframe]`,
        `[scopeframe][waveviz]overlay=(W-w)/2:${waveY}[visual]`,
      ];
    },
  },
  twin: {
    name: "Twin Spectrum",
    description: "Split spectrum bands at the top and bottom with full-screen artwork.",
    overlayHeightRatio: 0.12,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const topY = Math.round(pad * 1.6);
      const bottomY = height - vizHeight - Math.round(pad * 1.2);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=4:1,eq=contrast=1.08:brightness=-0.1:saturation=1.18[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showspectrum=s=${vizWidth}x${vizHeight}:mode=combined:slide=scroll:color=channel:scale=log:win_func=hann,format=rgba,colorchannelmixer=aa=0.84[topviz]`,
        `[afx2]showspectrum=s=${vizWidth}x${vizHeight}:mode=combined:slide=scroll:color=rainbow:scale=log:win_func=hann,format=rgba,colorchannelmixer=aa=0.88[bottomviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x050912@0.2:t=fill[toned]`,
        `[toned][topviz]overlay=(W-w)/2:${topY}[bandone]`,
        `[bandone][bottomviz]overlay=(W-w)/2:${bottomY}[visual]`,
      ];
    },
  },
  glass: {
    name: "Glass Bars",
    description: "Glassmorphism-style bars floating on frosted panels over the artwork.",
    overlayHeightRatio: 0.24,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const panelX = Math.round(width * 0.08);
      const panelY = Math.round(height * 0.2);
      const panelW = width - panelX * 2;
      const panelH = Math.round(height * 0.54);
      const vizY = Math.round(height * 0.56);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=10,eq=contrast=1.06:brightness=-0.08:saturation=1.12[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0xffffff|0x30d5ff|0xff77cc,format=rgba,colorchannelmixer=aa=0.94[viz]`,
        `[bg]drawbox=x=${panelX}:y=${panelY}:w=${panelW}:h=${panelH}:color=white@0.08:t=fill[glassbase]`,
        `[glassbase]drawbox=x=${panelX}:y=${panelY}:w=${panelW}:h=${panelH}:color=white@0.16:t=2[glasspanel]`,
        `[glasspanel][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  retro: {
    name: "Retro Grid",
    description: "Retro-futurist neon waveform with perspective grid energy.",
    overlayHeightRatio: 0.14,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const waveY = Math.round(height * 0.62);
      const gridStartY = Math.round(height * 0.7);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.12:brightness=-0.16:saturation=1.18[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0xff4fd8|0x30d5ff,format=rgba,colorchannelmixer=aa=0.98[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x090014@0.26:t=fill[tinted]`,
        `[tinted]drawgrid=width=${Math.round(width / 10)}:height=${Math.round(height / 12)}:thickness=1:color=0x30d5ff@0.12[grid]`,
        `[grid]drawbox=x=0:y=${gridStartY}:w=${width}:h=${height - gridStartY}:color=0xff4fd8@0.05:t=fill[gridlit]`,
        `[gridlit][viz]overlay=(W-w)/2:${waveY}[visual]`,
      ];
    },
  },
  liquid: {
    name: "Liquid Pulse",
    description: "Organic stacked waves with a softer flowing motion feel.",
    overlayHeightRatio: 0.1,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const upperY = Math.round(height * 0.58);
      const lowerY = upperY + vizHeight + Math.round(pad * 0.2);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=12,eq=contrast=1.05:brightness=-0.09:saturation=1.14[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0x7cff98|0xffffff,format=rgba,colorchannelmixer=aa=0.88[wavea]`,
        `[afx2]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0x30d5ff|0xff77cc,format=rgba,colorchannelmixer=aa=0.72,vflip[waveb]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x05111a@0.18:t=fill[tinted]`,
        `[tinted][wavea]overlay=(W-w)/2:${upperY}[layerone]`,
        `[layerone][waveb]overlay=(W-w)/2:${lowerY}[visual]`,
      ];
    },
  },
  flurry: {
    name: "Flurry Scope",
    description: "Scope-style centerpiece with brighter energetic glow for a current creator-tool look.",
    overlayHeightRatio: 0.2,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const scopeSize = Math.round(Math.min(width, height) * 0.34);
      const scopeY = Math.round(height * 0.24);
      const bandY = Math.round(height * 0.72);
      const bandHeight = Math.round(vizHeight * 0.75);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=9,eq=contrast=1.1:brightness=-0.12:saturation=1.22[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]pan=stereo|c0=c0|c1=c0,avectorscope=s=${scopeSize}x${scopeSize}:zoom=1.12:draw=line:rf=255:gf=255:bf=255:af=0.9,format=rgba[scopeviz]`,
        `[afx2]showfreqs=s=${vizWidth}x${bandHeight}:mode=bar:ascale=lin:fscale=log:colors=0x30d5ff|0xffffff|0xff77cc,format=rgba,colorchannelmixer=aa=0.82[bandviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=black@0.22:t=fill[tinted]`,
        `[tinted][scopeviz]overlay=(W-w)/2:${scopeY}[scopeframe]`,
        `[scopeframe][bandviz]overlay=(W-w)/2:${bandY}[visual]`,
      ];
    },
  },
  neonlooppro: {
    name: "Neon Loop Pro",
    description: "A clean commercial neon ring visualizer with balanced title space.",
    overlayHeightRatio: 0.09,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const ringSize = Math.round(Math.min(width, height) * 0.36);
      const ringY = Math.round(height * 0.2);
      const waveY = Math.round(height * 0.72);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=8,eq=contrast=1.08:brightness=-0.12:saturation=1.18[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]pan=stereo|c0=c0|c1=c0,avectorscope=s=${ringSize}x${ringSize}:zoom=1.04:draw=line:rf=255:gf=80:bf=210:af=0.88,format=rgba[ringviz]`,
        `[afx2]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0x30d5ff|0xffffff,format=rgba,colorchannelmixer=aa=0.92[waveviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x070913@0.24:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${pad}:w=${width - pad * 2}:h=${height - pad * 2}:color=white@0.04:t=2[frame]`,
        `[frame][ringviz]overlay=(W-w)/2:${ringY}[ringframe]`,
        `[ringframe][waveviz]overlay=(W-w)/2:${waveY}[visual]`,
      ];
    },
  },
  ledmatrixpro: {
    name: "LED Matrix Pro",
    description: "A polished LED equalizer look inspired by digital promo templates.",
    overlayHeightRatio: 0.27,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = Math.round(height * 0.48);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.06:brightness=-0.16:saturation=1.04[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0x7cff98|0xe9ff6b|0xff8a4b,format=rgba,colorchannelmixer=aa=0.96[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x050608@0.34:t=fill[toned]`,
        `[toned]drawgrid=width=${Math.round(width / 52)}:height=${Math.round(height / 28)}:thickness=1:color=white@0.05[grid]`,
        `[grid]drawbox=x=${pad}:y=${Math.round(height * 0.18)}:w=${width - pad * 2}:h=${Math.round(height * 0.52)}:color=0x030303@0.26:t=fill[panel]`,
        `[panel][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  minimalpro: {
    name: "Minimal Promo",
    description: "A clean, understated spectrum layout for a professional single release look.",
    overlayHeightRatio: 0.07,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const waveY = Math.round(height * 0.68);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=6,eq=contrast=1.03:brightness=-0.14:saturation=0.92[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0xffffff|0xffffff,format=rgba,colorchannelmixer=aa=0.9[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x05070a@0.4:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${pad}:w=${width - pad * 2}:h=${height - pad * 2}:color=white@0.08:t=2[frame]`,
        `[frame][viz]overlay=(W-w)/2:${waveY}[visual]`,
      ];
    },
  },
  electropulsepro: {
    name: "Electro Pulse Pro",
    description: "A bold commercial electro spectrum style with layered bottom energy bands.",
    overlayHeightRatio: 0.18,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const spectrumY = Math.round(height * 0.62);
      const topBandY = Math.round(height * 0.18);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=4:1,eq=contrast=1.09:brightness=-0.12:saturation=1.2[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showspectrum=s=${vizWidth}x${vizHeight}:mode=combined:slide=scroll:color=rainbow:scale=log:win_func=hann,format=rgba,colorchannelmixer=aa=0.9[spectrumviz]`,
        `[afx2]showwaves=s=${vizWidth}x${Math.max(50, Math.round(vizHeight * 0.42))}:mode=cline:rate=30:colors=0xffffff|0xff77cc,format=rgba,colorchannelmixer=aa=0.82[bandviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x060912@0.24:t=fill[toned]`,
        `[toned][bandviz]overlay=(W-w)/2:${topBandY}[topband]`,
        `[topband][spectrumviz]overlay=(W-w)/2:${spectrumY}[visual]`,
      ];
    },
  },
  broadcastpro: {
    name: "Broadcast Halo",
    description: "A premium broadcast-style halo ring with clean lower-third energy.",
    overlayHeightRatio: 0.08,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const ringSize = Math.round(Math.min(width, height) * 0.34);
      const ringY = Math.round(height * 0.18);
      const lowerY = Math.round(height * 0.76);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=7,eq=contrast=1.06:brightness=-0.16:saturation=1.06[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]pan=stereo|c0=c0|c1=c0,avectorscope=s=${ringSize}x${ringSize}:zoom=1.03:draw=line:rf=120:gf=220:bf=255:af=0.82,format=rgba[ringviz]`,
        `[afx2]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0xffffff|0xb7f4ff,format=rgba,colorchannelmixer=aa=0.86[waveviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x04070b@0.42:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${pad}:w=${width - pad * 2}:h=${height - pad * 2}:color=white@0.06:t=2[frame]`,
        `[frame][ringviz]overlay=(W-w)/2:${ringY}[ringframe]`,
        `[ringframe][waveviz]overlay=(W-w)/2:${lowerY}[visual]`,
      ];
    },
  },
  chrometunnel: {
    name: "Chrome Tunnel",
    description: "A sleek tunnel-like spectrum style with metallic promo energy.",
    overlayHeightRatio: 0.14,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const topY = Math.round(height * 0.2);
      const bottomY = Math.round(height * 0.68);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=4:1,eq=contrast=1.08:brightness=-0.14:saturation=0.95[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showspectrum=s=${vizWidth}x${vizHeight}:mode=combined:slide=scroll:color=moreland:scale=log:win_func=hann,format=rgba,colorchannelmixer=aa=0.84[topviz]`,
        `[afx2]showspectrum=s=${vizWidth}x${vizHeight}:mode=combined:slide=scroll:color=rainbow:scale=log:win_func=hann,format=rgba,colorchannelmixer=aa=0.9,vflip[bottomviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x050608@0.34:t=fill[toned]`,
        `[toned]drawbox=x=${Math.round(width * 0.14)}:y=${Math.round(height * 0.12)}:w=${Math.round(width * 0.72)}:h=${Math.round(height * 0.74)}:color=white@0.05:t=2[tunnel]`,
        `[tunnel][topviz]overlay=(W-w)/2:${topY}[upper]`,
        `[upper][bottomviz]overlay=(W-w)/2:${bottomY}[visual]`,
      ];
    },
  },
  aurorapro: {
    name: "Aurora Line",
    description: "A polished aurora waveform with soft cinematic glow.",
    overlayHeightRatio: 0.09,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const upperY = Math.round(height * 0.58);
      const lowerY = upperY + Math.round(vizHeight * 0.86);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=9,eq=contrast=1.04:brightness=-0.12:saturation=1.08[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0x7cff98|0xffffff,format=rgba,colorchannelmixer=aa=0.86[wavea]`,
        `[afx2]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0x30d5ff|0xff77cc,format=rgba,colorchannelmixer=aa=0.68[waveb]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x050912@0.28:t=fill[toned]`,
        `[toned][wavea]overlay=(W-w)/2:${upperY}[layera]`,
        `[layera][waveb]overlay=(W-w)/2:${lowerY}[visual]`,
      ];
    },
  },
  monolithpro: {
    name: "Monolith Bars",
    description: "Tall premium bars with a darker festival-poster promo feel.",
    overlayHeightRatio: 0.31,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = Math.round(height * 0.42);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.08:brightness=-0.18:saturation=1.12[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0xffffff|0xff77cc|0x30d5ff,format=rgba,colorchannelmixer=aa=0.96[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x06060a@0.36:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${Math.round(height * 0.16)}:w=${width - pad * 2}:h=${Math.round(height * 0.56)}:color=0x000000@0.24:t=fill[panel]`,
        `[panel][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  topbarslimpro: {
    name: "Top Slim Bars",
    description: "Slim inverted bars dropping cleanly from the top for a modern promo look.",
    overlayHeightRatio: 0.18,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = Math.round(height * 0.12);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=5,eq=contrast=1.05:brightness=-0.14:saturation=1.04[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0xffffff|0xb7f4ff|0x30d5ff,format=rgba,vflip,colorchannelmixer=aa=0.94[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x05070b@0.28:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${pad}:w=${width - pad * 2}:h=${height - pad * 2}:color=white@0.05:t=2[frame]`,
        `[frame][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  snowshower: {
    name: "Snow Shower",
    description: "A clean lower waveform with drifting snow particles for a winter-night atmosphere.",
    overlayHeightRatio: 0.08,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const waveY = Math.round(height * 0.72);
      const snowAlpha = "if(gt(random(1),0.9972),255,0)";

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=7,eq=contrast=1.02:brightness=-0.16:saturation=0.9[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0xffffff|0xd9f3ff,format=rgba,colorchannelmixer=aa=0.88[waveviz]`,
        `color=c=white@0.0:s=${width}x${height}:r=30,format=rgba,geq=r='255':g='255':b='255':a='${snowAlpha}',gblur=sigma=0.3[snow]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x04111a@0.34:t=fill[toned]`,
        `[toned][snow]overlay=shortest=1[weathered]`,
        `[weathered][waveviz]overlay=(W-w)/2:${waveY}[visual]`,
      ];
    },
  },
  sunraypulse: {
    name: "Sunray Pulse",
    description: "Minimal sun rays blooming behind the artwork with a restrained pulse line.",
    overlayHeightRatio: 0.09,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const waveY = Math.round(height * 0.7);
      const centerX = Math.round(width * 0.5);
      const beamTop = Math.round(height * 0.08);
      const beamHeight = Math.round(height * 0.54);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=6,eq=contrast=1.02:brightness=-0.12:saturation=1.02[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showwaves=s=${vizWidth}x${vizHeight}:mode=cline:rate=30:colors=0xffffff|0xffe6b0,format=rgba,colorchannelmixer=aa=0.86[waveviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x120d08@0.22:t=fill[tint0]`,
        `[tint0]drawbox=x=${centerX - Math.round(width * 0.03)}:y=${beamTop}:w=${Math.round(width * 0.06)}:h=${beamHeight}:color=0xffefc2@0.12:t=fill[tint1]`,
        `[tint1]drawbox=x=${centerX - Math.round(width * 0.11)}:y=${beamTop}:w=${Math.round(width * 0.035)}:h=${beamHeight}:color=0xffefc2@0.08:t=fill[tint2]`,
        `[tint2]drawbox=x=${centerX + Math.round(width * 0.075)}:y=${beamTop}:w=${Math.round(width * 0.035)}:h=${beamHeight}:color=0xffefc2@0.08:t=fill[tint3]`,
        `[tint3]drawbox=x=${centerX - Math.round(width * 0.18)}:y=${beamTop}:w=${Math.round(width * 0.025)}:h=${Math.round(beamHeight * 0.94)}:color=0xffefc2@0.05:t=fill[tint4]`,
        `[tint4]drawbox=x=${centerX + Math.round(width * 0.155)}:y=${beamTop}:w=${Math.round(width * 0.025)}:h=${Math.round(beamHeight * 0.94)}:color=0xffefc2@0.05:t=fill[tint5]`,
        `[tint5]drawbox=x=0:y=0:w=${width}:h=${Math.round(height * 0.32)}:color=0xffd27d@0.08:t=fill[tint6]`,
        `[tint6][waveviz]overlay=(W-w)/2:${waveY}[visual]`,
      ];
    },
  },
  beatbounce: {
    name: "Beat Bounce",
    description: "A central bounce line with punchy mirrored bass bars that feel tighter on kicks.",
    overlayHeightRatio: 0.14,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const topY = Math.round(height * 0.42);
      const bottomY = topY + Math.round(vizHeight * 0.9);
      const lineY = Math.round(height * 0.58);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=7,eq=contrast=1.08:brightness=-0.12:saturation=1.12[bg]`,
        "[1:a]asplit=4[aout][afx1][afx2][afx3]",
        `[afx1]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0xff77cc|0xffffff|0x30d5ff,format=rgba,colorchannelmixer=aa=0.86[viztopraw]`,
        `[afx2]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0x30d5ff|0xffffff|0xff77cc,format=rgba,vflip,colorchannelmixer=aa=0.72[vizbottom]`,
        `[afx3]showwaves=s=${vizWidth}x${Math.max(36, Math.round(vizHeight * 0.34))}:mode=cline:rate=30:colors=0xffffff|0xffd4ef,format=rgba,colorchannelmixer=aa=0.92[lineviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x070913@0.26:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${Math.round(height * 0.22)}:w=${width - pad * 2}:h=${Math.round(height * 0.5)}:color=white@0.04:t=2[frame]`,
        `[frame][viztopraw]overlay=(W-w)/2:${topY}[layertop]`,
        `[layertop][vizbottom]overlay=(W-w)/2:${bottomY}[layerbars]`,
        `[layerbars][lineviz]overlay=(W-w)/2:${lineY}[visual]`,
      ];
    },
  },
  basscolumns: {
    name: "Bass Columns",
    description: "Heavy glowing columns that jump from the bottom with a cleaner club-style low-end feel.",
    overlayHeightRatio: 0.3,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = Math.round(height * 0.46);
      const panelY = Math.round(height * 0.18);
      const panelH = Math.round(height * 0.56);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.08:brightness=-0.16:saturation=1.08[bg]`,
        "[1:a]asplit=2[aout][afx]",
        `[afx]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0x30d5ff|0xffffff|0x7cff98,format=rgba,colorchannelmixer=aa=0.96[viz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x041019@0.3:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${panelY}:w=${width - pad * 2}:h=${panelH}:color=0x02060a@0.28:t=fill[panel]`,
        `[panel]drawbox=x=${pad}:y=${panelY}:w=${width - pad * 2}:h=${panelH}:color=0xb7f4ff@0.08:t=2[frame]`,
        `[frame][viz]overlay=(W-w)/2:${vizY}[visual]`,
      ];
    },
  },
  subsurge: {
    name: "Sub Surge",
    description: "Wide bass bands surge upward with a deep sub-driven club look.",
    overlayHeightRatio: 0.22,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const topBandY = Math.round(height * 0.18);
      const lowBandY = Math.round(height * 0.62);
      const waveHeight = Math.max(42, Math.round(vizHeight * 0.42));

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=5:1,eq=contrast=1.08:brightness=-0.14:saturation=1.08[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showwaves=s=${vizWidth}x${waveHeight}:mode=cline:rate=30:colors=0xb7f4ff|0xffffff,format=rgba,colorchannelmixer=aa=0.8[topwave]`,
        `[afx2]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0x30d5ff|0xffffff|0x7cff98,format=rgba,colorchannelmixer=aa=0.95[lowviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x041019@0.34:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${Math.round(height * 0.14)}:w=${width - pad * 2}:h=${Math.round(height * 0.66)}:color=white@0.04:t=2[frame]`,
        `[frame][topwave]overlay=(W-w)/2:${topBandY}[layerone]`,
        `[layerone][lowviz]overlay=(W-w)/2:${lowBandY}[visual]`,
      ];
    },
  },
  kickstrobe: {
    name: "Kick Strobe",
    description: "Sharp kick-style columns with a tight center line for more aggressive beat energy.",
    overlayHeightRatio: 0.2,
    build({ width, height, pad, vizWidth, vizHeight }) {
      const vizY = Math.round(height * 0.24);
      const lineY = Math.round(height * 0.57);

      return [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=6,eq=contrast=1.1:brightness=-0.16:saturation=1.16[bg]`,
        "[1:a]asplit=3[aout][afx1][afx2]",
        `[afx1]showfreqs=s=${vizWidth}x${vizHeight}:mode=bar:ascale=lin:fscale=log:colors=0xff77cc|0xffffff|0x30d5ff,format=rgba,vflip,colorchannelmixer=aa=0.95[viz]`,
        `[afx2]showwaves=s=${vizWidth}x${Math.max(36, Math.round(vizHeight * 0.3))}:mode=cline:rate=30:colors=0xffffff|0xffd4ef,format=rgba,colorchannelmixer=aa=0.88[lineviz]`,
        `[bg]drawbox=x=0:y=0:w=${width}:h=${height}:color=0x060814@0.3:t=fill[toned]`,
        `[toned]drawbox=x=${pad}:y=${pad}:w=${width - pad * 2}:h=${height - pad * 2}:color=white@0.05:t=2[frame]`,
        `[frame][viz]overlay=(W-w)/2:${vizY}[layerone]`,
        `[layerone][lineviz]overlay=(W-w)/2:${lineY}[visual]`,
      ];
    },
  },
  basswarp: {
    engine: "python",
    name: "Bass Warp",
    description: "Bass-reactive image vibration with neon mirrored bars and center pulse.",
  },
  prismring: {
    engine: "python",
    name: "Prism Ring",
    description: "Bass-reactive artwork with radial prism spokes and a reactive halo ring.",
  },
  latticebars: {
    engine: "python",
    name: "Lattice Bars",
    description: "Futuristic glass bar stacks with image shake driven by low-end hits.",
  },
  shockwave: {
    engine: "python",
    name: "Shockwave",
    description: "Heavy bass pulses drive ripple waves through the full-screen artwork.",
  },
};

function randomId() {
  return crypto.randomBytes(10).toString("hex");
}

function loadStyleUsageCounts() {
  try {
    const raw = fs.readFileSync(STYLE_USAGE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    return {};
  }
}

function saveStyleUsageCounts(counts) {
  fs.writeFileSync(STYLE_USAGE_FILE, JSON.stringify(counts, null, 2));
}

function recordStyleUsage(styleId) {
  if (!STYLE_PRESETS[styleId]) {
    return;
  }

  const counts = loadStyleUsageCounts();
  counts[styleId] = Math.max(0, Number(counts[styleId]) || 0) + 1;
  saveStyleUsageCounts(counts);
}

function getTopStyles(limit = 5) {
  const counts = loadStyleUsageCounts();

  return Object.entries(counts)
    .filter(([styleId, count]) => STYLE_PRESETS[styleId] && Number(count) > 0)
    .sort((left, right) => {
      const countDiff = Number(right[1]) - Number(left[1]);
      if (countDiff !== 0) {
        return countDiff;
      }
      return STYLE_PRESETS[left[0]].name.localeCompare(STYLE_PRESETS[right[0]].name);
    })
    .slice(0, limit)
    .map(([styleId, count], index) => ({
      rank: index + 1,
      id: styleId,
      name: STYLE_PRESETS[styleId].name,
      description: STYLE_PRESETS[styleId].description,
      count: Number(count),
    }));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    sendJson(res, 404, { error: "File not found." });
  });
  res.writeHead(200, { "Content-Type": contentType });
  stream.pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100 * 1024 * 1024) {
        reject(new Error("Upload is too large. Keep files under 100MB total."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl || "");
  if (!match) {
    throw new Error("Invalid upload payload.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function extensionFromMime(mimeType) {
  const mapping = {
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/wave": ".wav",
    "audio/flac": ".flac",
    "audio/x-flac": ".flac",
    "audio/mp4": ".m4a",
    "audio/aac": ".aac",
    "audio/ogg": ".ogg",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
  };

  return mapping[mimeType] || "";
}

function runCommand(command, args, onStdoutLine) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: { ...process.env, TMPDIR: os.tmpdir() },
    });

    let stdout = "";
    let stderr = "";
    let stdoutBuffer = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      stdoutBuffer += text;

      let newlineIndex = stdoutBuffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = stdoutBuffer.slice(0, newlineIndex).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
        if (line && onStdoutLine) {
          onStdoutLine(line);
        }
        newlineIndex = stdoutBuffer.indexOf("\n");
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr || stdout || `${command} exited with code ${code}`));
    });
  });
}

async function getAudioDurationSeconds(filePath) {
  const result = await runCommand("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  const duration = Number.parseFloat(result.stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  return duration;
}

function updateJob(jobId, patch) {
  const current = jobs.get(jobId);
  if (!current) {
    return;
  }

  jobs.set(jobId, {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

function buildOverlayAndProgressFilters({ width, height, pad, durationSeconds, hasTextOverlay }) {
  const filters = [];
  let inputLabel = "visual";
  let index = 0;
  const labelFor = () => `tx${++index}`;

  if (hasTextOverlay) {
    const label = labelFor();
    filters.push(`[2:v]scale=${width}:${height},format=rgba[textoverlay]`);
    filters.push(`[${inputLabel}][textoverlay]overlay=0:0[${label}]`);
    inputLabel = label;
  }

  const trackWidth = width - Math.round(pad * 2.7);
  const trackHeight = Math.max(8, Math.round(height * 0.008));
  const trackX = Math.round(pad * 1.35);
  const trackY = height - Math.round(pad * 1.1);

  const baseLabel = labelFor();
  filters.push(
    `[${inputLabel}]drawbox=x=${trackX}:y=${trackY}:w=${trackWidth}:h=${trackHeight}:color=white@0.18:t=fill[${baseLabel}]`
  );
  inputLabel = baseLabel;

  if (durationSeconds && durationSeconds > 0) {
    const label = labelFor();
    const durationValue = durationSeconds.toFixed(3);
    filters.push(
      `[${inputLabel}]drawbox=x=${trackX}:y=${trackY}:w=${trackWidth}*min(t/${durationValue}\\,1):h=${trackHeight}:color=0x30d5ff@0.92:t=fill[${label}]`
    );
    inputLabel = label;
  }

  filters.push(`[${inputLabel}]null[vout]`);
  return filters;
}

function buildFilterGraph({ style, formatKey, durationSeconds, hasTextOverlay }) {
  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.pulse;
  const format = OUTPUT_FORMATS[formatKey] || OUTPUT_FORMATS.widescreen;
  const pad = Math.round(Math.min(format.width, format.height) * format.framePaddingRatio);
  const vizWidth = Math.round(format.width * format.vizWidthRatio);
  const vizHeight = Math.max(100, Math.round(format.height * preset.overlayHeightRatio));
  const filters = preset.build({
    width: format.width,
    height: format.height,
    pad,
    vizWidth,
    vizHeight,
  });

  filters.push(
    ...buildOverlayAndProgressFilters({
      width: format.width,
      height: format.height,
      pad,
      durationSeconds,
      hasTextOverlay,
    })
  );

  return {
    width: format.width,
    height: format.height,
    preset,
    format,
    filterComplex: filters.join(";"),
  };
}

function createJobResponse(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    style: job.style,
    styleName: job.styleName,
    format: job.format,
    formatName: job.formatName,
    clipMode: job.clipMode,
    clipName: job.clipName,
    videoUrl: job.videoUrl,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

async function renderJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  try {
    updateJob(jobId, { status: "running", progress: 3, message: "Preparing files..." });

    const audioFile = parseDataUrl(job.audioDataUrl);
    const imageFile = parseDataUrl(job.imageDataUrl);
    const overlayFile = job.overlayDataUrl && job.overlayDataUrl.trim() ? parseDataUrl(job.overlayDataUrl) : null;
    const audioExt = extensionFromMime(audioFile.mimeType);
    const imageExt = extensionFromMime(imageFile.mimeType);
    const overlayExt = overlayFile ? extensionFromMime(overlayFile.mimeType) : "";

    if (!audioExt || !imageExt || (overlayFile && !overlayExt)) {
      throw new Error("Unsupported file type. Use MP3, WAV, FLAC, M4A, AAC, OGG and PNG, JPG, or WEBP.");
    }

    const audioPath = path.join(TMP_DIR, `${jobId}-audio${audioExt}`);
    const imagePath = path.join(TMP_DIR, `${jobId}-image${imageExt}`);
    const overlayPath = overlayFile ? path.join(TMP_DIR, `${jobId}-overlay${overlayExt}`) : null;
    const outputPath = path.join(TMP_DIR, `${jobId}-visualizer.mp4`);

    fs.writeFileSync(audioPath, audioFile.buffer);
    fs.writeFileSync(imagePath, imageFile.buffer);
    if (overlayFile && overlayPath) {
      fs.writeFileSync(overlayPath, overlayFile.buffer);
    }

    updateJob(jobId, { progress: 8, message: "Analyzing audio..." });
    const durationSeconds = await getAudioDurationSeconds(audioPath).catch(() => null);
    const clipMode = CLIP_MODES[job.clipMode] || CLIP_MODES.preview;
    const renderDurationSeconds = clipMode.durationSeconds
      ? Math.min(durationSeconds || clipMode.durationSeconds, clipMode.durationSeconds)
      : durationSeconds;

    const stylePreset = STYLE_PRESETS[job.style] || STYLE_PRESETS.pulse;
    const formatPreset = OUTPUT_FORMATS[job.format] || OUTPUT_FORMATS.widescreen;

    updateJob(jobId, {
      progress: 12,
      message: `Rendering ${stylePreset.name} in ${formatPreset.name}${clipMode.durationSeconds ? ` (${clipMode.name})` : ""}...`,
      styleName: stylePreset.name,
      formatName: formatPreset.name,
      clipName: clipMode.name,
    });

    if (stylePreset.engine === "python") {
      // Python should be available since we fell back in handleCreateRender
      const pythonArgs = [
        path.join(ROOT, "scripts", "render_reactive.py"),
        "--audio",
        audioPath,
        "--image",
        imagePath,
        "--output",
        outputPath,
        "--style",
        job.style,
        "--width",
        String(formatPreset.width),
        "--height",
        String(formatPreset.height),
        "--fps",
        "30",
        "--duration",
        String(renderDurationSeconds || 0),
      ];

      if (job.title) {
        pythonArgs.push("--title", job.title);
      }

      if (job.artist) {
        pythonArgs.push("--artist", job.artist);
      }

      await runCommand(RENDERER_PYTHON, pythonArgs, (line) => {
        if (line.startsWith("progress=")) {
          const value = Number.parseInt(line.split("=")[1], 10);
          if (Number.isFinite(value)) {
            updateJob(jobId, {
              progress: Math.max(12, Math.min(98, value)),
              message: `Rendering ${Math.max(0, Math.min(100, value))}%`,
            });
          }
          return;
        }

        if (line.startsWith("status=")) {
          updateJob(jobId, { message: line.slice("status=".length) });
        }
      });

      updateJob(jobId, {
        status: "completed",
        progress: 100,
        message: "Video ready.",
        videoUrl: `/media/${path.basename(outputPath)}`,
        audioDataUrl: undefined,
        imageDataUrl: undefined,
        overlayDataUrl: undefined,
      });
      recordStyleUsage(job.style);
      return;
    }
      style: job.style,
      formatKey: job.format,
      durationSeconds: renderDurationSeconds,
      hasTextOverlay: Boolean(overlayFile),
    });

    const ffmpegArgs = [
      "-y",
      "-progress",
      "pipe:1",
      "-nostats",
      "-loop",
      "1",
      "-i",
      imagePath,
      "-i",
      audioPath,
    ];

    if (overlayPath) {
      ffmpegArgs.push("-loop", "1", "-i", overlayPath);
    }

    if (clipMode.durationSeconds) {
      ffmpegArgs.push("-t", String(clipMode.durationSeconds));
    }

    ffmpegArgs.push(
      "-filter_complex",
      graph.filterComplex,
      "-map",
      "[vout]",
      "-map",
      "[aout]",
      "-shortest",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      outputPath
    );

    await runCommand(
      "ffmpeg",
      ffmpegArgs,
      (line) => {
        if (!renderDurationSeconds || !line.startsWith("out_time_ms=")) {
          if (line === "progress=end") {
            updateJob(jobId, { progress: 99, message: "Finalizing export..." });
          }
          return;
        }

        const renderedMicroseconds = Number.parseFloat(line.split("=")[1]);
        if (!Number.isFinite(renderedMicroseconds)) {
          return;
        }

        const ratio = Math.min(renderedMicroseconds / (renderDurationSeconds * 1000000), 1);
        const progress = Math.max(12, Math.min(98, Math.round(12 + ratio * 86)));
        updateJob(jobId, {
          progress,
          message: `Rendering ${Math.round(ratio * 100)}%`,
        });
      }
    );

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      message: "Video ready.",
      videoUrl: `/media/${path.basename(outputPath)}`,
      audioDataUrl: undefined,
      imageDataUrl: undefined,
      overlayDataUrl: undefined,
    });
    recordStyleUsage(job.style);
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      progress: 100,
      error: error.message,
      message: "Render failed.",
      audioDataUrl: undefined,
      imageDataUrl: undefined,
      overlayDataUrl: undefined,
    });
  }
}

async function handleCreateRender(req, res) {
  try {
    const rawBody = await readBody(req);
    const payload = JSON.parse(rawBody || "{}");

    if (!payload.audioDataUrl || !payload.imageDataUrl) {
      sendJson(res, 400, { error: "Audio and image are required." });
      return;
    }

    const style = STYLE_PRESETS[payload.style] ? payload.style : "pulse";
    
    // Check if style requires Python and reject if Python not available
    if (STYLE_PRESETS[style].engine === "python") {
      sendJson(res, 400, { 
        error: "This style requires Python which is not available on the server. Please choose a different style.",
        availableFallbacks: {
          basswarp: "basscolumns",
          prismring: "scope", 
          latticebars: "glass",
          shockwave: "wave"
        }
      });
      return;
    }
    
    const format = OUTPUT_FORMATS[payload.format] ? payload.format : "widescreen";
    const clipMode = CLIP_MODES[payload.clipMode] ? payload.clipMode : "preview";
    const id = randomId();
    const now = new Date().toISOString();

    const job = {
      id,
      status: "queued",
      progress: 0,
      message: "Queued for rendering...",
      style,
      styleName: STYLE_PRESETS[style].name,
      format,
      formatName: OUTPUT_FORMATS[format].name,
      clipMode,
      clipName: CLIP_MODES[clipMode].name,
      title: String(payload.title || "").slice(0, 80),
      artist: String(payload.artist || "").slice(0, 80),
      overlayDataUrl: payload.overlayDataUrl || "",
      audioDataUrl: payload.audioDataUrl,
      imageDataUrl: payload.imageDataUrl,
      videoUrl: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    jobs.set(id, job);
    renderJob(id);

    sendJson(res, 202, {
      ok: true,
      job: createJobResponse(job),
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Could not create render job.",
      details: error.message,
    });
  }
}

function handleGetRenderStatus(req, res) {
  const match = /^\/api\/render\/([a-f0-9]+)$/.exec(req.url.split("?")[0]);
  const jobId = match ? match[1] : null;
  const job = jobId ? jobs.get(jobId) : null;

  if (!job) {
    sendJson(res, 404, { error: "Render job not found." });
    return;
  }

  sendJson(res, 200, { ok: true, job: createJobResponse(job) });
}

function handleGetTopStyles(req, res) {
  sendJson(res, 200, {
    ok: true,
    styles: getTopStyles(5),
    totalTrackedStyles: Object.keys(loadStyleUsageCounts()).length,
  });
}

function serveStatic(req, res) {
  const safePath = path.normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = safePath === "/" ? "/index.html" : safePath;

  if (requestedPath.startsWith("/media/")) {
    const filePath = path.join(TMP_DIR, path.basename(requestedPath));
    if (!fs.existsSync(filePath)) {
      sendJson(res, 404, { error: "Rendered video not found." });
      return;
    }
    sendFile(res, filePath);
    return;
  }

  const filePath = path.join(PUBLIC_DIR, requestedPath);
  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath)) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  sendFile(res, filePath);
}

const server = http.createServer(async (req, res) => {
  // Add CORS headers for Vercel frontend
  res.setHeader("Access-Control-Allow-Origin", "https://visualizer-ochre-eight.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/render") {
    await handleCreateRender(req, res);
    return;
  }

  if (req.method === "GET" && /^\/api\/render\/[a-f0-9]+$/.test(req.url.split("?")[0])) {
    handleGetRenderStatus(req, res);
    return;
  }

  if (req.method === "GET" && req.url.split("?")[0] === "/api/styles/top") {
    handleGetTopStyles(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, HOST, () => {
  console.log(`Visualizer Studio running at http://${HOST}:${PORT}`);
});
