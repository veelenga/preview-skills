/* eslint-disable no-unused-vars, no-undef */

// SVG Animation Renderer
// Injects user SVG into the page, wires up animation controls (play/pause/
// restart/scrub), zoom & pan via viewBox manipulation, and SVG export.

const IDS = {
  scrub: 'svg-scrub',
  playBtn: 'svg-play-btn',
  codePanel: 'svg-code-panel',
};
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 20;
const ZOOM_STEP = 1.1;
const SCRUB_RESOLUTION = 1000;
const SCRUB_POLL_MS = 100;
const DEFAULT_DURATION_S = 5;
const DEFAULT_VIEWBOX = 400;
const EXPORT_FILENAME = 'animation.svg';

const ICON_PAUSE = '<span class="svg-icon-pause">‖</span>';
const ICON_PLAY = '<span class="svg-icon-play">▶</span>';

const __svgPreviewContainer = document.getElementById('content');
const __svgRawContent = base64DecodeUnicode('SVG_CONTENT_ENCODED');

function detectFeatures(src) {
  const features = [];
  if (/<animate\b|<animateTransform\b|<animateMotion\b|<set\b/.test(src)) {
    features.push('SMIL');
  }
  if (/@keyframes|animation\s*:|animation-name|transition\s*:/.test(src)) {
    features.push('CSS anim');
  }
  if (/<script\b/i.test(src)) {
    features.push('JS');
  }
  return features.length ? features.join(', ') : 'static';
}

function estimateDuration(src) {
  // Authors stagger restarts with begin="A;B;…". The gap B-A is the loop
  // period of that animation; when several animations share the same gap,
  // that gap IS the visible loop period. Otherwise fall back to maxBegin+maxDur.
  const re = /\b(begin|dur)\s*=\s*"([^"]+)"/g;
  let m;
  const durs = [];
  const beginListGaps = [];
  let maxFlatBegin = 0;
  while ((m = re.exec(src)) !== null) {
    if (m[1] === 'dur') {
      const t = parseTime(m[2]);
      if (t != null) durs.push(t);
      continue;
    }
    const beginValues = m[2]
      .split(';')
      .map((v) => parseTime(v.trim()))
      .filter((t) => t != null);
    if (beginValues.length === 0) continue;
    maxFlatBegin = Math.max(maxFlatBegin, ...beginValues);
    for (let i = 1; i < beginValues.length; i++) {
      const gap = beginValues[i] - beginValues[i - 1];
      if (gap > 0) beginListGaps.push(gap);
    }
  }

  const maxDur = durs.length ? Math.max(...durs) : 0;

  if (beginListGaps.length > 0) {
    const sorted = [...beginListGaps].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median > 0) return median;
  }

  const total = maxFlatBegin + maxDur;
  return total > 0 ? total : DEFAULT_DURATION_S;
}

function parseTime(value) {
  const v = String(value).trim();
  if (/^[\d.]+ms$/.test(v)) return parseFloat(v) / 1000;
  if (/^[\d.]+s$/.test(v)) return parseFloat(v);
  if (/^[\d.]+$/.test(v)) return parseFloat(v);
  return null;
}

function buildSvgElement(raw) {
  // Strip XML declaration; the browser DOM doesn't need it.
  let content = raw.replace(/<\?xml[^?]*\?>\s*/, '');

  // If the user gave us a fragment (no <svg> root), wrap it in a default SVG.
  if (!/<svg[\s>]/i.test(content)) {
    content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DEFAULT_VIEWBOX} ${DEFAULT_VIEWBOX}">${content}</svg>`;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('SVG parse error: ' + parseError.textContent);
  }
  const svgEl = doc.documentElement;
  if (svgEl.namespaceURI !== 'http://www.w3.org/2000/svg') {
    throw new Error('Root element is not an SVG.');
  }
  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  if (!svgEl.getAttribute('viewBox')) {
    const w = svgEl.getAttribute('width') || DEFAULT_VIEWBOX;
    const h = svgEl.getAttribute('height') || DEFAULT_VIEWBOX;
    svgEl.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
  }
  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
  svgEl.classList.add('preview-svg');
  return svgEl;
}

function buildShell(duration) {
  // Header keeps view/meta controls only — playback lives next to the scrubber.
  const toolbarItems = [
    createButton('Reset Zoom', 'svgResetZoom()', '⊙'),
    createButton('Code', 'svgToggleCode()', '⟨⟩'),
    createButton('Export', 'svgExport()', '⬇'),
  ];

  return (
    createHeader('SVG Animation', stats, toolbarItems) +
    '<div class="preview-body">' +
    '  <div class="svg-stage"></div>' +
    '  <div class="svg-timeline-wrap">' +
    `    <button class="svg-play-btn" id="${IDS.playBtn}" title="Play / Pause" aria-label="Play / Pause" onclick="svgTogglePlay()">${ICON_PAUSE}</button>` +
    '    <button class="svg-play-btn" id="svg-restart-btn" title="Restart" aria-label="Restart" onclick="svgRestart()">' +
    '      <span>⟲</span>' +
    '    </button>' +
    '    <span class="svg-time svg-time-start">0.0s</span>' +
    '    <div class="svg-scrub-wrap">' +
    `      <input type="range" min="0" max="${SCRUB_RESOLUTION}" value="0" step="1" class="svg-scrub" id="${IDS.scrub}">` +
    '    </div>' +
    `    <span class="svg-time svg-time-end">${duration.toFixed(1)}s</span>` +
    '  </div>' +
    `  <pre class="svg-code-panel" id="${IDS.codePanel}" hidden></pre>` +
    '</div>' +
    createFooter()
  );
}

const features = detectFeatures(__svgRawContent);
const duration = estimateDuration(__svgRawContent);
const lines = __svgRawContent.split('\n').length;
const chars = __svgRawContent.length;
const stats = `${lines} lines • ${chars} chars • ${features} • ~${duration.toFixed(1)}s`;

__svgPreviewContainer.innerHTML = buildShell(duration);

// Cache element references after the shell is in the DOM.
const __scrubEl = document.getElementById(IDS.scrub);
const __playBtnEl = document.getElementById(IDS.playBtn);
const __codePanelEl = document.getElementById(IDS.codePanel);

let __svgEl;
let __zoomCtrl;
let __cssAnimNodes = []; // cached once after SVG injection; see collectCssAnimNodes
try {
  __svgEl = buildSvgElement(__svgRawContent);
  document.querySelector('.svg-stage').appendChild(__svgEl);
} catch (err) {
  showError(err.message);
}

if (__svgEl) {
  __zoomCtrl = setupZoomAndPan(__svgEl);
  __cssAnimNodes = collectCssAnimNodes(__svgEl);
  wireScrub(__svgEl, duration);
  if (__codePanelEl) __codePanelEl.textContent = __svgRawContent;
}

// ---- Playback controls -----------------------------------------------------

let __svgPaused = false;

function svgTogglePlay() {
  if (!__svgEl) return;
  if (__svgPaused) {
    if (typeof __svgEl.unpauseAnimations === 'function') __svgEl.unpauseAnimations();
    setCssPlayState('running');
    __svgPaused = false;
    if (__playBtnEl) __playBtnEl.innerHTML = ICON_PAUSE;
  } else {
    if (typeof __svgEl.pauseAnimations === 'function') __svgEl.pauseAnimations();
    setCssPlayState('paused');
    __svgPaused = true;
    if (__playBtnEl) __playBtnEl.innerHTML = ICON_PLAY;
  }
}

function svgRestart() {
  if (!__svgEl) return;
  if (typeof __svgEl.setCurrentTime === 'function') {
    __svgEl.setCurrentTime(0);
  }
  restartCssAnimations();
  if (__scrubEl) __scrubEl.value = 0;
}

function svgToggleCode() {
  if (__codePanelEl) __codePanelEl.hidden = !__codePanelEl.hidden;
}

function svgResetZoom() {
  if (__zoomCtrl) {
    __zoomCtrl.reset();
    showStatus('Zoom reset');
  }
}

function svgExport() {
  if (!__svgEl) return;
  const serializer = new XMLSerializer();
  let data = serializer.serializeToString(__svgEl);
  if (!data.startsWith('<?xml')) {
    data = '<?xml version="1.0" encoding="UTF-8"?>\n' + data;
  }
  const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = EXPORT_FILENAME;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showStatus('SVG exported');
}

// ---- CSS animation handling ------------------------------------------------

// Cache nodes with active CSS animations once — walking all descendants and
// calling getComputedStyle on every play/pause/restart is O(N) layout work.
function collectCssAnimNodes(root) {
  const all = [root, ...root.querySelectorAll('*')];
  return all.filter((el) => {
    const name = getComputedStyle(el).animationName;
    return name && name !== 'none';
  });
}

function setCssPlayState(state) {
  __cssAnimNodes.forEach((el) => {
    el.style.animationPlayState = state;
  });
}

function restartCssAnimations() {
  __cssAnimNodes.forEach((el) => {
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow so the next assignment restarts
    el.style.animation = '';
  });
}

// ---- Scrubber --------------------------------------------------------------

function wireScrub(svgEl, total) {
  if (!__scrubEl) return;

  __scrubEl.addEventListener('input', () => {
    const t = (__scrubEl.value / SCRUB_RESOLUTION) * total;
    if (typeof svgEl.setCurrentTime === 'function') {
      svgEl.setCurrentTime(t);
    }
  });

  // Visual-only sync of the thumb with SMIL playback (no numeric label).
  // Programmatic assignment doesn't fire 'input', so no event loop.
  if (typeof svgEl.getCurrentTime === 'function') {
    setInterval(() => {
      if (__svgPaused) return;
      const t = svgEl.getCurrentTime() % (total || 1);
      const next = String(Math.min(SCRUB_RESOLUTION, Math.round((t / total) * SCRUB_RESOLUTION)));
      if (next !== __scrubEl.value) __scrubEl.value = next;
    }, SCRUB_POLL_MS);
  }
}

// ---- Zoom & pan via viewBox manipulation -----------------------------------

function setupZoomAndPan(svgEl) {
  const viewBox = svgEl.getAttribute('viewBox');
  if (!viewBox) return null;
  const [ox, oy, ow, oh] = viewBox.split(/\s+/).map(Number);

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startTx = 0;
  let startTy = 0;

  function apply() {
    const w = ow / scale;
    const h = oh / scale;
    const x = ox - tx / scale + (ow - w) / 2;
    const y = oy - ty / scale + (oh - h) / 2;
    svgEl.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }

  svgEl.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale * factor));
      apply();
    },
    { passive: false }
  );

  svgEl.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startTx = tx;
    startTy = ty;
    svgEl.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx = startTx + (e.clientX - startX);
    ty = startTy + (e.clientY - startY);
    apply();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    svgEl.style.cursor = 'grab';
  });

  svgEl.style.cursor = 'grab';

  return {
    reset() {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    },
  };
}

// ---- Error helper ----------------------------------------------------------

function showError(message) {
  const stage = document.querySelector('.svg-stage') || __svgPreviewContainer;
  const box = document.createElement('div');
  box.className = 'svg-error';
  const title = document.createElement('div');
  title.className = 'svg-error-title';
  title.textContent = 'SVG Render Error';
  const msg = document.createElement('div');
  msg.className = 'svg-error-msg';
  msg.textContent = message;
  box.appendChild(title);
  box.appendChild(msg);
  stage.appendChild(box);
  console.error('SVG preview error:', message);
}
