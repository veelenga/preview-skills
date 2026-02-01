/* global THREE */
/* eslint-disable no-undef */

// Three.js 3D Visualization Renderer
// User code and metadata are loaded from script tags injected during HTML generation

// Use unique variable name to avoid collision with user code
const __threejsPreviewContainer = document.getElementById('content');

// Load metadata from script tag
const threeJSMetadata = JSON.parse(document.getElementById('threejs-metadata').textContent);

// Stats for the header (handle missing metadata gracefully)
const stats = threeJSMetadata.lines
  ? `${threeJSMetadata.lines} lines • ${threeJSMetadata.chars} chars • 3D`
  : '3D';

const toolbarItems = [createButton('Reset View', 'resetView()', '⊙')];

__threejsPreviewContainer.innerHTML =
  createHeader('Three.js 3D Visualization', stats, toolbarItems) +
  '<div class="preview-body">' +
  '  <div class="viz-container">' +
  '    <div id="canvas-container"></div>' +
  '    <div class="controls-info">' +
  '      <h4>Controls</h4>' +
  '      <p>🖱️ Drag: Rotate</p>' +
  '      <p>🔍 Scroll: Zoom</p>' +
  '    </div>' +
  '  </div>' +
  '</div>' +
  createFooter();

let scene, camera, renderer, animationId;
const canvasContainer = document.getElementById('canvas-container');

function initThreeJS() {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  canvasContainer.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const mouse = { x: 0, y: 0, down: false, prevX: 0, prevY: 0 };
  scene.userData.rotation = { x: 0, y: 0 };

  renderer.domElement.addEventListener('mousedown', (e) => {
    mouse.down = true;
    mouse.prevX = e.clientX;
    mouse.prevY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (mouse.down) {
      const deltaX = e.clientX - mouse.prevX;
      const deltaY = e.clientY - mouse.prevY;
      scene.userData.rotation.y += deltaX * 0.005;
      scene.userData.rotation.x += deltaY * 0.005;
      mouse.prevX = e.clientX;
      mouse.prevY = e.clientY;
    }
  });

  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  renderer.domElement.addEventListener('mouseleave', () => {
    mouse.down = false;
  });

  renderer.domElement.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.01;
      camera.position.z = Math.max(2, Math.min(20, camera.position.z));
    },
    { passive: false }
  );

  try {
    // Dynamically load user code after setup is complete
    // User code executes in global scope with access to scene, camera, renderer
    const userCodeSrc = JSON.parse(document.getElementById('threejs-user-code-src').textContent);
    const script = document.createElement('script');
    script.src = userCodeSrc;
    script.onerror = function (error) {
      console.error('Failed to load user code:', error);
      showError('Failed to load visualization code');
    };
    document.head.appendChild(script);
  } catch (error) {
    console.error('Three.js error:', error);
    showError(error.message);
    return;
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    if (scene.userData.customAnimate) {
      scene.userData.customAnimate();
    }

    scene.rotation.x = scene.userData.rotation.x;
    scene.rotation.y = scene.userData.rotation.y;

    renderer.render(scene, camera);
  }

  animate();
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(231, 76, 60, 0.9);
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-family: sans-serif;
    max-width: 80%;
    text-align: center;
    z-index: 1000;
  `;
  errorDiv.innerHTML = `<h3>Visualization Error</h3><p>${message}</p>`;
  canvasContainer.appendChild(errorDiv);
}

try {
  initThreeJS();
} catch (error) {
  showError(error.message);
}

// eslint-disable-next-line no-unused-vars
function resetView() {
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  showStatus('View reset');
}

window.addEventListener('resize', () => {
  if (!renderer) return;

  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

window.addEventListener('beforeunload', () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
});
