/* eslint-disable no-undef */

// Leaflet Map Visualization Renderer
// Supports custom Leaflet code for maps, markers, routes, etc.
// User code and metadata are loaded from script tags injected during HTML generation

// Use unique variable name to avoid collision with user code
const __leafletPreviewContainer = document.getElementById('content');

// Load metadata from script tag
const leafletCodeMetadata = JSON.parse(document.getElementById('leaflet-metadata').textContent);

// Stats for the header
const stats = `${leafletCodeMetadata.lines} lines • ${leafletCodeMetadata.chars} chars • ${leafletCodeMetadata.type}`;

// Toolbar items
const toolbarItems = [createButton('Reset View', 'resetView()', '⊙')];

// Create the UI structure with a map container
__leafletPreviewContainer.innerHTML =
  createHeader('Leaflet Map', stats, toolbarItems) +
  '<div class="preview-body">' +
  '  <div id="map" class="map-container"></div>' +
  '</div>' +
  createFooter();

// Store initial view for reset
let initialView = null;

// Initialize Leaflet visualization
try {
  initializeMap();
} catch (error) {
  showError(error);
}

function initializeMap() {
  // Execute the Leaflet code directly
  // The user code is self-contained and creates markers, layers, etc.
  // Available variables: L (Leaflet), map (initialized map object)
  // Available elements: #map (map container)
  try {
    // Dynamically load user code after setup is complete
    // User code executes in global scope with access to L (Leaflet) and map
    const userCodeSrc = JSON.parse(document.getElementById('leaflet-user-code-src').textContent);
    const script = document.createElement('script');
    script.src = userCodeSrc;
    script.onerror = function (error) {
      console.error('Failed to load user code:', error);
    };
    document.head.appendChild(script);

    // Store initial view after user code has set the map
    if (typeof map !== 'undefined' && map.getCenter) {
      setTimeout(() => {
        initialView = {
          center: map.getCenter(),
          zoom: map.getZoom(),
        };
      }, 100);
    }
  } catch (error) {
    console.error('Leaflet visualization error:', error);

    // Show error message in the container
    showError(error);
  }
}

function showError(error) {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('Cannot show error - map container not found');
    return;
  }

  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 40px;
    background: #f5f5f5;
  `;

  const errorTitle = document.createElement('div');
  errorTitle.style.cssText = `
    font-size: 24px;
    font-weight: bold;
    color: #e74c3c;
    margin-bottom: 20px;
  `;
  errorTitle.textContent = 'Map Visualization Error';

  const errorMessage = document.createElement('div');
  errorMessage.style.cssText = `
    font-size: 16px;
    color: #666;
    max-width: 600px;
  `;
  errorMessage.textContent = error.message;

  errorContainer.appendChild(errorTitle);
  errorContainer.appendChild(errorMessage);
  mapContainer.appendChild(errorContainer);

  console.error('Leaflet Error:', error);
}

// Toolbar functions
// eslint-disable-next-line no-unused-vars
function resetView() {
  if (typeof map !== 'undefined' && initialView) {
    map.setView(initialView.center, initialView.zoom, {
      animate: true,
      duration: 0.5,
    });
    showStatus('View reset');
  } else {
    showStatus('No initial view to reset to');
  }
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (typeof map !== 'undefined' && map.invalidateSize) {
      map.invalidateSize();
    }
  }, 250);
});
