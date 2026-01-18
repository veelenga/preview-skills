/* global d3 */
/* eslint-disable no-undef */

// D3.js Visualization Renderer
// Supports both custom D3 code and pre-defined visualization types
// User code and metadata are loaded from script tags injected during HTML generation

// Use unique variable name to avoid collision with user code
const __d3PreviewContainer = document.getElementById('content');

// Load metadata from script tag
const d3CodeMetadata = JSON.parse(document.getElementById('d3-metadata').textContent);

// Stats for the header
const stats = `${d3CodeMetadata.lines} lines • ${d3CodeMetadata.chars} chars • ${d3CodeMetadata.type}`;

// Toolbar items
const toolbarItems = [
  createButton('Reset Zoom', 'resetZoom()', '⊙'),
  createButton('Export SVG', 'exportSVG()', '⬇'),
];

// Create the UI structure with an empty viz-container
// Containers will be dynamically created based on what the user's code needs
__d3PreviewContainer.innerHTML =
  createHeader('D3.js Visualization', stats, toolbarItems) +
  '<div class="preview-body">' +
  '  <div class="viz-container"></div>' +
  '</div>' +
  createFooter();

/**
 * Dynamically creates containers based on what selectors the user's code uses
 * This allows any D3 code to work without modification
 */
function setupDynamicContainers(code) {
  const vizContainer = document.querySelector('.viz-container');
  const selectors = extractD3Selectors(code);

  // Create containers for each unique selector found in the code
  selectors.forEach((selector) => {
    if (selector.type === 'id') {
      createIdContainer(vizContainer, selector.value);
    } else if (selector.type === 'class') {
      vizContainer.classList.add(selector.value);
    }
  });

  // Always provide common fallback containers for compatibility
  const fallbackIds = ['visualization', 'chart', 'container'];
  fallbackIds.forEach((id) => createIdContainer(vizContainer, id));
}

/**
 * Extracts D3 selectors from code using regex patterns
 */
function extractD3Selectors(code) {
  const selectors = [];
  const seen = new Set();

  // Match d3.select('#id') or d3.select('.class')
  const patterns = [
    /d3\.select\s*\(\s*['"`]([#.])(\w[\w-]*)['"`]\s*\)/g,
    /d3\.selectAll\s*\(\s*['"`]([#.])(\w[\w-]*)['"`]\s*\)/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const prefix = match[1];
      const value = match[2];
      const key = `${prefix}${value}`;

      if (!seen.has(key)) {
        seen.add(key);
        selectors.push({
          type: prefix === '#' ? 'id' : 'class',
          value: value,
        });
      }
    }
  });

  return selectors;
}

/**
 * Creates a container div with the specified ID if it doesn't exist
 */
function createIdContainer(parent, id) {
  if (!document.getElementById(id)) {
    const div = document.createElement('div');
    div.id = id;
    // IMPORTANT: pointer-events: none allows mouse/wheel events to pass through to elements below
    div.style.cssText =
      'width: 100%; height: 100%; position: absolute; top: 0; left: 0; pointer-events: none;';
    parent.appendChild(div);
  }
}

// Setup containers based on user code
setupDynamicContainers(d3CodeMetadata.code);

// Initialize D3 visualization
try {
  initializeVisualization();
  setupZoomAndPan();
} catch (error) {
  showError(error);
}

function initializeVisualization() {
  // Execute the D3 code directly
  // The user code is self-contained and creates its own SVG and elements
  // Available variables: d3
  // Available selectors: #visualization (created dynamically based on code analysis)
  try {
    // Dynamically load user code after setup is complete
    // User code executes in global scope with access to d3
    const userCodeSrc = JSON.parse(document.getElementById('d3-user-code-src').textContent);
    const script = document.createElement('script');
    script.src = userCodeSrc;
    script.onerror = function (error) {
      console.error('Failed to load user code:', error);
    };
    document.head.appendChild(script);
  } catch (error) {
    console.error('D3 visualization error:', error);

    // Show error message in the container
    const errorContainer = d3
      .select('#visualization')
      .append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('height', '100%')
      .style('text-align', 'center')
      .style('padding', '20px');

    errorContainer
      .append('div')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('color', '#e74c3c')
      .style('margin-bottom', '10px')
      .text('Visualization Error');

    errorContainer
      .append('div')
      .style('font-size', '14px')
      .style('color', '#666')
      .text(error.message);
  }
}

/**
 * Setup zoom and pan for any SVG elements created by the visualization
 * Uses viewBox manipulation to avoid breaking existing transforms and interactions
 */
function setupZoomAndPan() {
  const svgElement = document.querySelector('.viz-container svg');
  if (!svgElement) return;

  // Don't set up zoom twice
  if (svgElement._zoomSetup) return;

  const svg = d3.select(svgElement);

  // Get original dimensions
  const width = parseFloat(svg.attr('width'));
  const height = parseFloat(svg.attr('height'));

  if (!width || !height) return;

  // Store original viewBox or create one
  const originalViewBox = svg.attr('viewBox') || `0 0 ${width} ${height}`;
  const [origX, origY, origWidth, origHeight] = originalViewBox.split(' ').map(Number);

  // Ensure SVG has proper styling for interaction
  svg.style('pointer-events', 'all');

  // Add a transparent background rectangle for panning
  // This allows panning when dragging on empty space without interfering with chart elements
  const background = svg
    .insert('rect', ':first-child')
    .attr('class', 'zoom-background')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'transparent')
    .style('cursor', 'grab');

  // Create zoom behavior that manipulates viewBox
  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 10])
    .translateExtent([
      [-width * 0.5, -height * 0.5],
      [width * 1.5, height * 1.5],
    ])
    .filter((event) => {
      // Allow wheel zoom
      if (event.type === 'wheel') {
        if (event.ctrlKey) {
          event.preventDefault();
        }
        return true;
      }

      // For drag panning: only allow if clicking on the background rectangle
      if (event.type === 'mousedown') {
        // Check if clicking on the zoom-background rect
        return event.target.classList.contains('zoom-background');
      }

      // Allow mousemove and mouseup during drag
      if (event.type === 'mousemove' || event.type === 'mouseup') {
        return true;
      }

      // Block dblclick
      if (event.type === 'dblclick') {
        return false;
      }

      return false;
    })
    .on('start', (event) => {
      if (event.sourceEvent && event.sourceEvent.type === 'mousedown') {
        if (event.sourceEvent.target.classList.contains('zoom-background')) {
          background.style('cursor', 'grabbing');
        }
      }
    })
    .on('zoom', (event) => {
      const { k, x, y } = event.transform;

      // Calculate new viewBox based on zoom and pan
      const newX = origX - x / k;
      const newY = origY - y / k;
      const newWidth = origWidth / k;
      const newHeight = origHeight / k;

      svg.attr('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
    })
    .on('end', () => {
      background.style('cursor', 'grab');
    });

  // Apply zoom behavior to SVG
  svg.call(zoom);

  // Store zoom behavior, background, and original viewBox for reset function
  svgElement._zoom = zoom;
  svgElement._zoomBackground = background;
  svgElement._originalViewBox = originalViewBox;
  svgElement._zoomSetup = true;
}

function showError(error) {
  const vizContainer = document.querySelector('.viz-container');

  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 40px;
  `;

  const errorTitle = document.createElement('div');
  errorTitle.style.cssText = `
    font-size: 24px;
    font-weight: bold;
    color: #e74c3c;
    margin-bottom: 20px;
  `;
  errorTitle.textContent = 'Visualization Error';

  const errorMessage = document.createElement('div');
  errorMessage.style.cssText = `
    font-size: 16px;
    color: #666;
    max-width: 600px;
  `;
  errorMessage.textContent = error.message;

  errorContainer.appendChild(errorTitle);
  errorContainer.appendChild(errorMessage);
  vizContainer.appendChild(errorContainer);

  console.error('D3 Error:', error);
}

// Toolbar functions
// eslint-disable-next-line no-unused-vars
function resetZoom() {
  // Find any SVG element in the visualization container
  const svgElement = document.querySelector('.viz-container svg');
  if (svgElement && svgElement._zoom && svgElement._originalViewBox) {
    const svg = d3.select(svgElement);

    // Reset zoom transform
    svg.transition().duration(750).call(svgElement._zoom.transform, d3.zoomIdentity);

    // Reset viewBox
    svg.transition().duration(750).attr('viewBox', svgElement._originalViewBox);

    showStatus('Zoom reset');
  } else {
    showStatus('No zoomable SVG found');
  }
}

// eslint-disable-next-line no-unused-vars
function exportSVG() {
  // Find any SVG element created by user code
  const svg = document.querySelector('.viz-container svg');
  if (svg) {
    const svgData = new XMLSerializer().serializeToString(svg);

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'visualization.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showStatus('SVG exported successfully!');
  } else {
    showStatus('No SVG found to export');
  }
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Clear and reinitialize
    const svg = d3.select('#visualization');
    svg.selectAll('*').remove();

    try {
      initializeVisualization();
      setupZoomAndPan();
    } catch (error) {
      showError(error);
    }
  }, 250);
});
