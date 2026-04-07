const styleCategories = [
  { id: "all", name: "All Styles" },
  { id: "professional", name: "Professional" },
  { id: "atmospheric", name: "Atmospheric" },
  { id: "bass_reactive", name: "Bass Reactive" },
  { id: "energy", name: "High Energy" },
  { id: "clean", name: "Clean & Minimal" },
  { id: "experimental", name: "Experimental" },
];

const styles = [
  { id: "pulse", name: "Pulse Bars", description: "Full-screen artwork with bright equalizer bars along the bottom edge.", category: "energy", motif: "bars", theme: "cyan" },
  { id: "wave", name: "Neon Wave", description: "A clean waveform ribbon floating over the full-screen artwork.", category: "clean", motif: "wave", theme: "mint" },
  { id: "spectrum", name: "Spectrum Heat", description: "A wide scrolling spectrum layered over a full-frame image.", category: "energy", motif: "spectrum", theme: "rainbow" },
  { id: "scope", name: "Stereo Scope", description: "A vector-scope centerpiece glowing over the full-screen image.", category: "experimental", motif: "ring", theme: "cyan" },
  { id: "mirror", name: "Mirror Line", description: "Mirrored waveform rails with the artwork stretched edge to edge.", category: "clean", motif: "double-wave", theme: "magenta" },
  { id: "skyline", name: "Skyline Bars", description: "Tall city-light bars rising from the bottom over a full-screen image.", category: "energy", motif: "bars", theme: "lime" },
  { id: "halo", name: "Halo Scope", description: "A scope centerpiece with a thin bottom wave and a full-frame background.", category: "experimental", motif: "ring", theme: "magenta" },
  { id: "twin", name: "Twin Spectrum", description: "Split spectrum bands at the top and bottom with full-screen artwork.", category: "energy", motif: "bands", theme: "rainbow" },
  { id: "glass", name: "Glass Bars", description: "Glassmorphism-style bars floating on frosted panels over the artwork.", category: "professional", motif: "panel-bars", theme: "ice" },
  { id: "retro", name: "Retro Grid", description: "Retro-futurist neon waveform with perspective grid energy.", category: "experimental", motif: "grid-wave", theme: "retro" },
  { id: "liquid", name: "Liquid Pulse", description: "Organic stacked waves with a softer flowing motion feel.", category: "experimental", motif: "double-wave", theme: "mint" },
  { id: "flurry", name: "Flurry Scope", description: "Scope-style centerpiece with brighter energetic glow for a current creator-tool look.", category: "experimental", motif: "ring-bars", theme: "magenta" },
  { id: "neonlooppro", name: "Neon Loop Pro", description: "A clean commercial neon ring visualizer with balanced title space.", category: "professional", motif: "ring-wave", theme: "magenta" },
  { id: "ledmatrixpro", name: "LED Matrix Pro", description: "A polished LED equalizer look inspired by digital promo templates.", category: "professional", motif: "grid-bars", theme: "lime" },
  { id: "minimalpro", name: "Minimal Promo", description: "A clean, understated spectrum layout for a professional single release look.", category: "clean", motif: "minimal-wave", theme: "mono" },
  { id: "electropulsepro", name: "Electro Pulse Pro", description: "A bold commercial electro spectrum style with layered bottom energy bands.", category: "professional", motif: "bands", theme: "rainbow" },
  { id: "broadcastpro", name: "Broadcast Halo", description: "A premium broadcast-style halo ring with clean lower-third energy.", category: "professional", motif: "ring-wave", theme: "ice" },
  { id: "chrometunnel", name: "Chrome Tunnel", description: "A sleek tunnel-like spectrum style with metallic promo energy.", category: "professional", motif: "bands", theme: "chrome" },
  { id: "aurorapro", name: "Aurora Line", description: "A polished aurora waveform with soft cinematic glow.", category: "professional", motif: "double-wave", theme: "aurora" },
  { id: "monolithpro", name: "Monolith Bars", description: "Tall premium bars with a darker festival-poster promo feel.", category: "professional", motif: "bars", theme: "sunset" },
  { id: "topbarslimpro", name: "Top Slim Bars", description: "Slim inverted bars dropping cleanly from the top for a modern promo look.", category: "professional", motif: "top-bars", theme: "ice" },
  { id: "snowshower", name: "Snow Shower", description: "A clean lower waveform with drifting snow particles for a winter-night atmosphere.", category: "atmospheric", motif: "snow-wave", theme: "ice" },
  { id: "sunraypulse", name: "Sunray Pulse", description: "Minimal sun rays blooming behind the artwork with a restrained pulse line.", category: "atmospheric", motif: "sun-rays", theme: "sunrise" },
  { id: "beatbounce", name: "Beat Bounce", description: "A central bounce line with punchy mirrored bass bars that feel tighter on kicks.", category: "bass_reactive", motif: "ring-bars", theme: "magenta" },
  { id: "basscolumns", name: "Bass Columns", description: "Heavy glowing columns that jump from the bottom with a cleaner club-style low-end feel.", category: "bass_reactive", motif: "bars", theme: "cyan" },
  { id: "subsurge", name: "Sub Surge", description: "Wide bass bands surge upward with a deep sub-driven club look.", category: "bass_reactive", motif: "bands", theme: "cyan" },
  { id: "kickstrobe", name: "Kick Strobe", description: "Sharp kick-style columns with a tight center line for more aggressive beat energy.", category: "bass_reactive", motif: "top-bars", theme: "magenta" },
  { id: "basswarp", name: "Bass Warp", description: "Bass-reactive image vibration with neon mirrored bars and center pulse.", category: "bass_reactive", motif: "ring-bars", theme: "cyan", engine: "python" },
  { id: "prismring", name: "Prism Ring", description: "Bass-reactive artwork with radial prism spokes and a reactive halo ring.", category: "bass_reactive", motif: "ring", theme: "rainbow", engine: "python" },
  { id: "latticebars", name: "Lattice Bars", description: "Futuristic glass bar stacks with image shake driven by low-end hits.", category: "bass_reactive", motif: "panel-bars", theme: "ice", engine: "python" },
  { id: "shockwave", name: "Shockwave", description: "Heavy bass pulses drive ripple waves through the full-screen artwork.", category: "bass_reactive", motif: "shockwave", theme: "cyan", engine: "python" },
];

const formats = [
  { id: "widescreen", name: "16:9", description: "1280 x 720 for YouTube and desktop playback.", width: 1280, height: 720 },
  { id: "square", name: "1:1", description: "1080 x 1080 for feed posts and covers.", width: 1080, height: 1080 },
  { id: "vertical", name: "9:16", description: "1080 x 1920 for reels, shorts, and stories.", width: 1080, height: 1920 },
];

const clipModes = [
  { id: "preview", name: "15s Preview", description: "Fast short render for checking the style before a full export." },
  { id: "full", name: "Full Track", description: "Render the complete song when you are happy with the preview." },
];

const defaultImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  zoom: 100,
  offsetX: 0,
  offsetY: 0,
};

const state = {
  selectedCategory: "all",
  selectedStyle: "neonlooppro",
  selectedFormat: "widescreen",
  selectedClipMode: "preview",
  audioDataUrl: "",
  imageDataUrl: "",
  sourceImageDataUrl: "",
  imageAdjustments: { ...defaultImageAdjustments },
  activeJobId: null,
  pollHandle: null,
};

const audioInput = document.getElementById("audioInput");
const imageInput = document.getElementById("imageInput");
const titleInput = document.getElementById("titleInput");
const artistInput = document.getElementById("artistInput");
const topStylesList = document.getElementById("topStylesList");
const leaderboardStatus = document.getElementById("leaderboardStatus");
const styleCategorySelect = document.getElementById("styleCategorySelect");
const styleSelect = document.getElementById("styleSelect");
const styleCount = document.getElementById("styleCount");
const styleHeroName = document.getElementById("styleHeroName");
const styleHeroMeta = document.getElementById("styleHeroMeta");
const styleHeroDescription = document.getElementById("styleHeroDescription");
const styleHeroPreview = document.getElementById("styleHeroPreview");
const formatGrid = document.getElementById("formatGrid");
const clipGrid = document.getElementById("clipGrid");
const renderButton = document.getElementById("renderButton");
const statusElement = document.getElementById("status");
const imagePreview = document.getElementById("imagePreview");
const imagePlaceholder = document.getElementById("imagePlaceholder");
const videoPreview = document.getElementById("videoPreview");
const videoPlaceholder = document.getElementById("videoPlaceholder");
const downloadLink = document.getElementById("downloadLink");
const jobPanel = document.getElementById("jobPanel");
const jobPercent = document.getElementById("jobPercent");
const jobMessage = document.getElementById("jobMessage");
const progressFill = document.getElementById("progressFill");
const brightnessInput = document.getElementById("brightnessInput");
const contrastInput = document.getElementById("contrastInput");
const saturationInput = document.getElementById("saturationInput");
const zoomInput = document.getElementById("zoomInput");
const offsetXInput = document.getElementById("offsetXInput");
const offsetYInput = document.getElementById("offsetYInput");
const resetImageEditsButton = document.getElementById("resetImageEditsButton");
const audioReadyBadge = document.getElementById("audioReadyBadge");
const imageReadyBadge = document.getElementById("imageReadyBadge");
const styleReadyBadge = document.getElementById("styleReadyBadge");
const outputReadyBadge = document.getElementById("outputReadyBadge");
const setupSummary = document.getElementById("setupSummary");
const selectionHint = document.getElementById("selectionHint");
const stylePageInfo = document.getElementById("stylePageInfo");
const stylePrevButton = document.getElementById("stylePrevButton");
const styleNextButton = document.getElementById("styleNextButton");
const stepToggles = Array.from(document.querySelectorAll("[data-step-toggle]"));
const commentForm = document.getElementById("commentForm");
const commentNameInput = document.getElementById("commentNameInput");
const commentRoleInput = document.getElementById("commentRoleInput");
const commentMessageInput = document.getElementById("commentMessageInput");
const commentStatus = document.getElementById("commentStatus");
const commentsList = document.getElementById("commentsList");
const clearCommentsButton = document.getElementById("clearCommentsButton");

const COMMENTS_STORAGE_KEY = "visualizer-studio-comments";

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.color = isError ? "#ff9ea8" : "";
}

function updateProgress(progress, message) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  jobPanel.classList.remove("hidden");
  jobPercent.textContent = `${safeProgress}%`;
  jobMessage.textContent = message || "Rendering...";
  progressFill.style.width = `${safeProgress}%`;
}

function stopPolling() {
  if (state.pollHandle) {
    clearInterval(state.pollHandle);
    state.pollHandle = null;
  }
}

function getCategoryName(categoryId) {
  return styleCategories.find((category) => category.id === categoryId)?.name || "All Styles";
}

function getSelectedStyle() {
  return styles.find((style) => style.id === state.selectedStyle) || styles[0];
}

function getStyleById(styleId) {
  return styles.find((style) => style.id === styleId) || null;
}

function getVisibleStyles() {
  if (state.selectedCategory === "all") {
    return styles;
  }
  return styles.filter((style) => style.category === state.selectedCategory);
}

function applyPreviewClasses(element, style) {
  element.className = `style-preview style-theme-${style.theme} style-motif-${style.motif}`;
  element.innerHTML = `
    <span class="preview-layer preview-layer-a"></span>
    <span class="preview-layer preview-layer-b"></span>
    <span class="preview-layer preview-layer-c"></span>
  `;
}

function renderStyleHero() {
  const style = getSelectedStyle();
  styleHeroName.textContent = style.name;
  styleHeroMeta.textContent = `${getCategoryName(style.category)} style`;
  styleHeroDescription.textContent = style.description;
  applyPreviewClasses(styleHeroPreview, style);
}

function setBadgeState(element, isReady, readyText, waitingText) {
  element.textContent = isReady ? readyText : waitingText;
  element.classList.toggle("ready", isReady);
}

function renderSetupSummary() {
  const style = getSelectedStyle();
  const format = formats.find((item) => item.id === state.selectedFormat) || formats[0];
  const clipMode = clipModes.find((item) => item.id === state.selectedClipMode) || clipModes[0];
  const hasAudio = Boolean(state.audioDataUrl);
  const hasImage = Boolean(state.imageDataUrl);

  setBadgeState(audioReadyBadge, hasAudio, "1. Audio ready", "1. Add audio");
  setBadgeState(imageReadyBadge, hasImage, "2. Artwork ready", "2. Add artwork");
  setBadgeState(styleReadyBadge, true, "3. Style picked", "3. Pick a style");
  setBadgeState(outputReadyBadge, true, "4. Export ready", "4. Export settings");

  if (!hasAudio && !hasImage) {
    selectionHint.textContent = "Start by loading the song and artwork.";
  } else if (!hasAudio) {
    selectionHint.textContent = "Add the audio so the preview can be rendered.";
  } else if (!hasImage) {
    selectionHint.textContent = "Add the artwork so the video has a background.";
  } else {
    selectionHint.textContent = `${style.name} ready in ${format.name}, ${clipMode.name.toLowerCase()}.`;
  }

  setupSummary.textContent = `${style.name} in ${format.name} as a ${clipMode.name}.`;
}

function renderStyleOptions() {
  const visibleStyles = getVisibleStyles();
  styleCount.textContent = `${visibleStyles.length} styles`;
  styleSelect.innerHTML = "";

  if (!visibleStyles.some((style) => style.id === state.selectedStyle)) {
    state.selectedStyle = visibleStyles[0]?.id || styles[0].id;
  }

  for (const style of visibleStyles) {
    const option = document.createElement("option");
    option.value = style.id;
    option.textContent = style.name + (style.engine === "python" ? " (Python required - may not work)" : "");
    if (style.id === state.selectedStyle) {
      option.selected = true;
    }
    if (style.engine === "python") {
      option.disabled = true;
      option.style.color = "#999";
    }
    styleSelect.appendChild(option);
  }

  const selectedIndex = Math.max(0, visibleStyles.findIndex((style) => style.id === state.selectedStyle));
  stylePageInfo.textContent = `${selectedIndex + 1} of ${visibleStyles.length}`;
  stylePrevButton.disabled = selectedIndex <= 0;
  styleNextButton.disabled = selectedIndex >= visibleStyles.length - 1;
}

function renderTopStyles(topStyles) {
  topStylesList.innerHTML = "";

  if (!topStyles.length) {
    topStylesList.innerHTML = `
      <div class="top-style-empty">
        No shared usage data yet. The first completed renders will start filling this top 5 leaderboard.
      </div>
    `;
    leaderboardStatus.textContent = "No community data yet";
    return;
  }

  leaderboardStatus.textContent = `${topStyles.length} ranked styles live`;

  for (const topStyle of topStyles) {
    const styleMeta = getStyleById(topStyle.id);
    const article = document.createElement("article");
    article.className = `top-style-card${topStyle.rank === 1 ? " featured" : ""}`;
    article.innerHTML = `
      <div class="top-style-rank">#${topStyle.rank}</div>
      <h3>${topStyle.name}</h3>
      <p class="top-style-description">${styleMeta?.description || topStyle.description || "Community favorite visualizer style."}</p>
      <p class="top-style-usage">${topStyle.count} total renders</p>
    `;
    topStylesList.appendChild(article);
  }
}

async function loadTopStyles() {
  leaderboardStatus.textContent = "Loading community favorites...";

  try {
    const backendUrl = window.BACKEND_URL || "";
    const response = await fetch(`${backendUrl}/api/styles/top`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not load top styles.");
    }

    renderTopStyles(Array.isArray(result.styles) ? result.styles : []);
  } catch (error) {
    topStylesList.innerHTML = `
      <div class="top-style-empty">
        Community favorites could not be loaded right now.
      </div>
    `;
    leaderboardStatus.textContent = "Leaderboard unavailable";
  }
}

function renderCards(container, items, selectedId, onSelect) {
  container.innerHTML = "";
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `style-card ${item.id === selectedId ? "selected" : ""}`;
    button.innerHTML = `<h3>${item.name}</h3><p>${item.description}</p>`;
    button.addEventListener("click", () => onSelect(item.id, item.name));
    container.appendChild(button);
  }
}

function loadComments() {
  try {
    const saved = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveComments(comments) {
  window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
}

function renderComments() {
  const comments = loadComments();
  commentsList.innerHTML = "";

  if (!comments.length) {
    commentsList.innerHTML = `<div class="comment-empty">No feedback yet. Be the first producer to leave a note.</div>`;
    return;
  }

  for (const comment of comments) {
    const article = document.createElement("article");
    article.className = "comment-card";
    article.innerHTML = `
      <div class="comment-card-head">
        <div>
          <h3>${comment.name}</h3>
          <p>${comment.role || "Producer"}</p>
        </div>
        <span>${comment.date}</span>
      </div>
      <p class="comment-message">${comment.message}</p>
    `;
    commentsList.appendChild(article);
  }
}

function renderFormatCards() {
  renderCards(formatGrid, formats, state.selectedFormat, (formatId, formatName) => {
    state.selectedFormat = formatId;
    renderFormatCards();
    renderSetupSummary();
    setStatus(`Video format selected: ${formatName}`);
  });
}

function syncRenderButtonLabel() {
  renderButton.textContent = state.selectedClipMode === "preview" ? "Render 15s Preview" : "Render Full Track";
}

function renderClipCards() {
  renderCards(clipGrid, clipModes, state.selectedClipMode, (clipId, clipName) => {
    state.selectedClipMode = clipId;
    renderClipCards();
    syncRenderButtonLabel();
    renderSetupSummary();
    setStatus(`Render mode selected: ${clipName}`);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function syncImageControls() {
  brightnessInput.value = state.imageAdjustments.brightness;
  contrastInput.value = state.imageAdjustments.contrast;
  saturationInput.value = state.imageAdjustments.saturation;
  zoomInput.value = state.imageAdjustments.zoom;
  offsetXInput.value = state.imageAdjustments.offsetX;
  offsetYInput.value = state.imageAdjustments.offsetY;
}

async function applyImageAdjustments() {
  if (!state.sourceImageDataUrl) {
    return;
  }

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the artwork for editing."));
    img.src = state.sourceImageDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  const zoomScale = state.imageAdjustments.zoom / 100;
  const panMagnitude = Math.max(Math.abs(state.imageAdjustments.offsetX), Math.abs(state.imageAdjustments.offsetY)) / 100;
  const overscanScale = 1 + panMagnitude * 0.18;
  const coverScale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const finalScale = coverScale * Math.max(zoomScale, overscanScale);
  const drawWidth = image.width * finalScale;
  const drawHeight = image.height * finalScale;
  const maxOffsetX = Math.max(0, (drawWidth - canvas.width) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - canvas.height) / 2);
  const extraX = maxOffsetX * (state.imageAdjustments.offsetX / 100);
  const extraY = maxOffsetY * (state.imageAdjustments.offsetY / 100);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.filter = `brightness(${state.imageAdjustments.brightness}%) contrast(${state.imageAdjustments.contrast}%) saturate(${state.imageAdjustments.saturation}%)`;
  context.drawImage(
    image,
    (canvas.width - drawWidth) / 2 + extraX,
    (canvas.height - drawHeight) / 2 + extraY,
    drawWidth,
    drawHeight
  );

  state.imageDataUrl = canvas.toDataURL("image/jpeg", 0.94);
  imagePreview.src = state.imageDataUrl;
  imagePreview.classList.remove("hidden");
  imagePlaceholder.classList.add("hidden");
}

function onImageAdjustmentChange(key, value) {
  state.imageAdjustments[key] = Number(value);
  if (!state.sourceImageDataUrl) {
    return;
  }
  applyImageAdjustments().then(() => {
    setStatus("Updated image edits.");
  }).catch((error) => {
    setStatus(error.message, true);
  });
}

async function buildTextOverlayDataUrl() {
  const title = titleInput.value.trim();
  const artist = artistInput.value.trim();
  if (!title && !artist) {
    return "";
  }

  const format = formats.find((item) => item.id === state.selectedFormat) || formats[0];
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const context = canvas.getContext("2d");

  const pad = Math.round(Math.min(format.width, format.height) * 0.07);
  const titleFont = Math.max(40, Math.round(format.height * 0.042));
  const artistFont = Math.max(24, Math.round(format.height * 0.022));
  const titleY = format.height - Math.round(pad * 2.6);
  const artistY = titleY + Math.round(format.height * 0.05);

  context.clearRect(0, 0, format.width, format.height);
  context.textBaseline = "top";

  if (title) {
    context.font = `700 ${titleFont}px "Avenir Next", "Segoe UI", sans-serif`;
    const titleWidth = context.measureText(title).width;
    const titleBoxHeight = titleFont + 28;
    context.fillStyle = "rgba(0, 0, 0, 0.34)";
    context.fillRect(pad - 14, titleY - 10, Math.min(titleWidth + 28, format.width - pad * 2), titleBoxHeight);
    context.fillStyle = "#ffffff";
    context.fillText(title, pad, titleY);
  }

  if (artist) {
    context.font = `600 ${artistFont}px "Avenir Next", "Segoe UI", sans-serif`;
    const artistWidth = context.measureText(artist).width;
    const artistBoxHeight = artistFont + 22;
    context.fillStyle = "rgba(0, 0, 0, 0.22)";
    context.fillRect(pad - 10, artistY - 8, Math.min(artistWidth + 20, format.width - pad * 2), artistBoxHeight);
    context.fillStyle = "#d9f3ff";
    context.fillText(artist, pad, artistY);
  }

  return canvas.toDataURL("image/png");
}

async function pollJob(jobId) {
  try {
    const backendUrl = window.BACKEND_URL || "";
    const response = await fetch(`${backendUrl}/api/render/${jobId}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not fetch render status.");
    }

    const job = result.job;
    updateProgress(job.progress, job.message);
    setStatus(job.message, job.status === "failed");

    if (job.status === "completed") {
      stopPolling();
      renderButton.disabled = false;
      state.activeJobId = null;
      const backendUrl = window.BACKEND_URL || "";
      videoPreview.src = backendUrl + job.videoUrl;
      videoPreview.classList.remove("hidden");
      videoPlaceholder.classList.add("hidden");
      downloadLink.href = backendUrl + job.videoUrl;
      downloadLink.download = `${(titleInput.value || "visualizer").trim().replace(/\s+/g, "-").toLowerCase()}-${job.clipMode}.mp4`;
      downloadLink.classList.remove("hidden");
      setStatus(`Video ready in ${job.formatName} with ${job.styleName} as a ${job.clipName}.`);
      loadTopStyles();
      return;
    }

    if (job.status === "failed") {
      stopPolling();
      renderButton.disabled = false;
      state.activeJobId = null;
      setStatus(job.error || "Render failed.", true);
    }
  } catch (error) {
    stopPolling();
    renderButton.disabled = false;
    state.activeJobId = null;
    setStatus(error.message, true);
  }
}

audioInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  console.log("Audio file selected:", file?.name, "Size:", file?.size);
  if (!file) {
    state.audioDataUrl = "";
    renderSetupSummary();
    return;
  }

  try {
    // Railway can handle larger files - allow up to 50MB audio
    const maxSize = 50 * 1024 * 1024; // 50MB
    console.log("File size check:", file.size, "vs max:", maxSize);
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setStatus(`Audio file too large (${sizeMB}MB). Please use files under 50MB.`, true);
      event.target.value = ""; // Clear the input
      return;
    }

    console.log("Reading file as data URL...");
    state.audioDataUrl = await readFileAsDataUrl(file);
    console.log("File loaded successfully, data URL length:", state.audioDataUrl.length);
    renderSetupSummary();
    setStatus(`Loaded audio: ${file.name}`);
  } catch (error) {
    console.error("Error loading audio file:", error);
    setStatus(`Failed to load audio file: ${error.message}`, true);
    event.target.value = ""; // Clear the input
  }
});

imageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    state.imageDataUrl = "";
    state.sourceImageDataUrl = "";
    imagePreview.classList.add("hidden");
    imagePlaceholder.classList.remove("hidden");
    renderSetupSummary();
    return;
  }

  try {
    // Railway can handle larger files - allow up to 10MB images
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setStatus(`Image file too large (${sizeMB}MB). Please use files under 10MB.`, true);
      event.target.value = ""; // Clear the input
      return;
    }

    state.sourceImageDataUrl = await readFileAsDataUrl(file);
    state.imageAdjustments = { ...defaultImageAdjustments };
    syncImageControls();
    await applyImageAdjustments();
    renderSetupSummary();
    setStatus(`Loaded artwork: ${file.name}`);
  } catch (error) {
    setStatus(`Failed to load image file: ${error.message}`, true);
    event.target.value = ""; // Clear the input
  }
});

styleCategorySelect.addEventListener("change", (event) => {
  state.selectedCategory = event.target.value;
  renderStyleOptions();
  renderStyleHero();
  renderSetupSummary();
  setStatus(`Category selected: ${getCategoryName(state.selectedCategory)}`);
});

styleSelect.addEventListener("change", (event) => {
  state.selectedStyle = event.target.value;
  renderStyleOptions();
  renderStyleHero();
  renderSetupSummary();
  setStatus(`Style selected: ${getSelectedStyle().name}`);
});

stylePrevButton.addEventListener("click", () => {
  const visibleStyles = getVisibleStyles();
  const selectedIndex = visibleStyles.findIndex((style) => style.id === state.selectedStyle);
  if (selectedIndex > 0) {
    state.selectedStyle = visibleStyles[selectedIndex - 1].id;
  }
  renderStyleOptions();
  renderStyleHero();
  renderSetupSummary();
});

styleNextButton.addEventListener("click", () => {
  const visibleStyles = getVisibleStyles();
  const selectedIndex = visibleStyles.findIndex((style) => style.id === state.selectedStyle);
  if (selectedIndex >= 0 && selectedIndex < visibleStyles.length - 1) {
    state.selectedStyle = visibleStyles[selectedIndex + 1].id;
  }
  renderStyleOptions();
  renderStyleHero();
  renderSetupSummary();
});

brightnessInput.addEventListener("input", (event) => onImageAdjustmentChange("brightness", event.target.value));
contrastInput.addEventListener("input", (event) => onImageAdjustmentChange("contrast", event.target.value));
saturationInput.addEventListener("input", (event) => onImageAdjustmentChange("saturation", event.target.value));
zoomInput.addEventListener("input", (event) => onImageAdjustmentChange("zoom", event.target.value));
offsetXInput.addEventListener("input", (event) => onImageAdjustmentChange("offsetX", event.target.value));
offsetYInput.addEventListener("input", (event) => onImageAdjustmentChange("offsetY", event.target.value));

resetImageEditsButton.addEventListener("click", () => {
  state.imageAdjustments = { ...defaultImageAdjustments };
  syncImageControls();
  if (state.sourceImageDataUrl) {
    applyImageAdjustments().then(() => setStatus("Reset image edits."));
  }
});

for (const toggle of stepToggles) {
  toggle.addEventListener("click", () => {
    const card = toggle.closest("[data-step-card]");
    const body = card?.querySelector("[data-step-body]");
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    body?.classList.toggle("is-collapsed", isExpanded);
  });
}

commentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = commentNameInput.value.trim() || "Anonymous Producer";
  const role = commentRoleInput.value.trim();
  const message = commentMessageInput.value.trim();

  if (!message) {
    commentStatus.textContent = "Add a feedback message before posting.";
    commentStatus.style.color = "#ff9ea8";
    return;
  }

  const comments = loadComments();
  comments.unshift({
    name,
    role,
    message,
    date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  });
  saveComments(comments.slice(0, 12));
  renderComments();

  commentForm.reset();
  commentStatus.textContent = "Feedback saved in this browser.";
  commentStatus.style.color = "";
});

clearCommentsButton.addEventListener("click", () => {
  window.localStorage.removeItem(COMMENTS_STORAGE_KEY);
  renderComments();
  commentStatus.textContent = "Saved feedback cleared from this browser.";
  commentStatus.style.color = "";
});

renderButton.addEventListener("click", async () => {
  if (!state.audioDataUrl || !state.imageDataUrl) {
    setStatus("Please choose both an audio file and an image.", true);
    return;
  }

  // Check if selected style requires Python
  const selectedStyle = styles.find(s => s.id === state.selectedStyle);
  if (selectedStyle && selectedStyle.engine === "python") {
    setStatus("This style requires Python which is not available. Please choose a different style like 'Bass Columns', 'Stereo Scope', 'Glass Bars', or 'Neon Wave'.", true);
    return;
  }

  // Check payload size (Vercel has ~5MB limit for serverless functions)
  const payload = {
    style: state.selectedStyle,
    format: state.selectedFormat,
    clipMode: state.selectedClipMode,
    title: titleInput.value.trim(),
    artist: artistInput.value.trim(),
    overlayDataUrl: await buildTextOverlayDataUrl(),
    audioDataUrl: state.audioDataUrl,
    imageDataUrl: state.imageDataUrl,
  };
  // Railway can handle larger payloads - no size limit needed

  stopPolling();
  state.activeJobId = null;
  renderButton.disabled = true;
  videoPreview.pause();
  videoPreview.removeAttribute("src");
  videoPreview.load();
  videoPreview.classList.add("hidden");
  videoPlaceholder.classList.remove("hidden");
  downloadLink.classList.add("hidden");
  updateProgress(0, "Submitting render job...");
  setStatus("Starting background render...");

  try {
    const backendUrl = window.BACKEND_URL || "";
    const response = await fetch(backendUrl + "/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.details || result.error || "Could not start render.");
    }

    state.activeJobId = result.job.id;
    updateProgress(result.job.progress, result.job.message);
    state.pollHandle = window.setInterval(() => pollJob(state.activeJobId), 1000);
    await pollJob(state.activeJobId);
  } catch (error) {
    renderButton.disabled = false;
    setStatus(error.message, true);
  }
});

for (const category of styleCategories) {
  const option = document.createElement("option");
  option.value = category.id;
  option.textContent = category.name;
  styleCategorySelect.appendChild(option);
}

syncImageControls();
renderStyleOptions();
renderStyleHero();
renderFormatCards();
renderClipCards();
syncRenderButtonLabel();
renderSetupSummary();
renderComments();
loadTopStyles();
