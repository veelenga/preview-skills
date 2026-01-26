const container = document.getElementById('content');
const diagramCode = base64DecodeUnicode('DIAGRAM_ENCODED');
const currentTheme = 'MERMAID_THEME';

const lines = diagramCode.split('\n').length;
const chars = diagramCode.length;
const stats = `${lines} lines • ${chars} chars`;

const ZOOM_CONFIG = {
  DEFAULT: 1,
  STEP: 0.05,
  MIN: 0.5,
  MAX: 3,
};

const CURSOR_STATES = {
  GRAB: 'grab',
  GRABBING: 'grabbing',
};

const panState = {
  x: 0,
  y: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
};

let zoomLevel = ZOOM_CONFIG.DEFAULT;

const toolbarItems = [
  createButton('Reset View', 'resetView()', '⊙'),
  createButton('Copy Code', 'copyDiagram()', '📋'),
  createButton('Copy SVG', 'copySVG()', '🖼️'),
];

container.innerHTML =
  createHeader('Mermaid Diagram', stats, toolbarItems) +
  '<div class="preview-body">' +
  '  <div class="diagram-viewport">' +
  '    <div class="diagram-wrapper">' +
  '      <div class="mermaid" id="mermaid-diagram"></div>' +
  '    </div>' +
  '  </div>' +
  '</div>' +
  createFooter();

mermaid.initialize({
  startOnLoad: false,
  theme: currentTheme,
  securityLevel: 'strict',
  fontSize: 20,
  flowchart: {
    useMaxWidth: false,
  },
  sequence: {
    useMaxWidth: false,
  },
});

const diagramDiv = document.getElementById('mermaid-diagram');
diagramDiv.textContent = diagramCode;

mermaid
  .run({
    nodes: [diagramDiv],
  })
  .then(() => {
    initializePanZoom();
  });

function initializePanZoom() {
  const viewport = document.querySelector('.diagram-viewport');
  const wrapper = document.querySelector('.diagram-wrapper');

  if (!viewport || !wrapper) return;

  viewport.addEventListener('mousedown', (e) => {
    panState.isDragging = true;
    panState.dragStartX = e.clientX - panState.x;
    panState.dragStartY = e.clientY - panState.y;
    viewport.style.cursor = CURSOR_STATES.GRABBING;
  });

  viewport.addEventListener('mousemove', (e) => {
    if (panState.isDragging) {
      panState.x = e.clientX - panState.dragStartX;
      panState.y = e.clientY - panState.dragStartY;
      updateTransform();
    }
  });

  viewport.addEventListener('mouseup', () => {
    panState.isDragging = false;
    viewport.style.cursor = CURSOR_STATES.GRAB;
  });

  viewport.addEventListener('mouseleave', () => {
    panState.isDragging = false;
    viewport.style.cursor = CURSOR_STATES.GRAB;
  });

  viewport.addEventListener('selectstart', (e) => {
    if (panState.isDragging) {
      e.preventDefault();
    }
  });

  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();

      const delta = e.deltaY;
      const zoomAmount = delta > 0 ? -ZOOM_CONFIG.STEP : ZOOM_CONFIG.STEP;
      const newZoom = zoomLevel + zoomAmount;

      if (newZoom >= ZOOM_CONFIG.MIN && newZoom <= ZOOM_CONFIG.MAX) {
        zoomLevel = newZoom;
        updateTransform();
      }
    },
    { passive: false }
  );
}

function updateTransform() {
  const wrapper = document.querySelector('.diagram-wrapper');
  if (wrapper) {
    wrapper.style.transform = `translate(${panState.x}px, ${panState.y}px) scale(${zoomLevel})`;
  }
}

// eslint-disable-next-line no-unused-vars
function resetView() {
  panState.x = 0;
  panState.y = 0;
  zoomLevel = ZOOM_CONFIG.DEFAULT;
  updateTransform();
  showStatus('View reset');
}

// eslint-disable-next-line no-unused-vars
function copyDiagram() {
  copyToClipboard(diagramCode, 'Diagram code copied to clipboard!');
}

// eslint-disable-next-line no-unused-vars
function copySVG() {
  const svg = document.querySelector('#mermaid-diagram svg');
  if (svg) {
    const svgData = new XMLSerializer().serializeToString(svg);
    copyToClipboard(svgData, 'SVG copied to clipboard!');
  } else {
    showStatus('No SVG found to copy');
  }
}
