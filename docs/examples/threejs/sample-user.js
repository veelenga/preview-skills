/* eslint-disable no-unused-vars */
// User code - executes when dynamically loaded
// Rubik's Cube Colors
const colors = {
  white: 0xffffff,
  yellow: 0xffff00,
  blue: 0x0000ff,
  green: 0x00ff00,
  red: 0xff0000,
  orange: 0xff8800,
  black: 0x000000
};

// Create a single cube piece (cubie)
function createCubie(x, y, z) {
  const size = 0.95;
  const geometry = new THREE.BoxGeometry(size, size, size);

  const materials = [
    new THREE.MeshStandardMaterial({ color: x === 1 ? colors.red : colors.black }),
    new THREE.MeshStandardMaterial({ color: x === -1 ? colors.orange : colors.black }),
    new THREE.MeshStandardMaterial({ color: y === 1 ? colors.white : colors.black }),
    new THREE.MeshStandardMaterial({ color: y === -1 ? colors.yellow : colors.black }),
    new THREE.MeshStandardMaterial({ color: z === 1 ? colors.blue : colors.black }),
    new THREE.MeshStandardMaterial({ color: z === -1 ? colors.green : colors.black })
  ];

  const cube = new THREE.Mesh(geometry, materials);
  cube.position.set(x, y, z);

  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
  );
  cube.add(line);

  return cube;
}

// Create the Rubik's cube
const rubiksCube = new THREE.Group();

for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      if (x === 0 && y === 0 && z === 0) continue;
      const cubie = createCubie(x, y, z);
      rubiksCube.add(cubie);
    }
  }
}

scene.add(rubiksCube);

// Animation variables
let autoRotate = true;
const rotationSpeed = 0.005;

// Custom animation function
scene.userData.customAnimate = function() {
  if (autoRotate) {
    rubiksCube.rotation.x += rotationSpeed;
    rubiksCube.rotation.y += rotationSpeed * 1.5;
  }
};

// Scramble animation
let scrambling = false;
let scrambleSteps = 0;
const maxScrambleSteps = 20;
let currentAxis = null;
let currentLayer = null;
let rotationProgress = 0;
const scrambleSpeed = 0.1;

function getRandomAxis() {
  const axes = ['x', 'y', 'z'];
  return axes[Math.floor(Math.random() * axes.length)];
}

function getRandomLayer() {
  return Math.floor(Math.random() * 3) - 1;
}

function getRandomDirection() {
  return Math.random() < 0.5 ? 1 : -1;
}

function scrambleCube() {
  if (scrambling) return;

  scrambling = true;
  scrambleSteps = 0;
  autoRotate = false;

  const scrambleInterval = setInterval(() => {
    if (scrambleSteps >= maxScrambleSteps) {
      scrambling = false;
      autoRotate = true;
      clearInterval(scrambleInterval);
      return;
    }

    if (!currentAxis) {
      currentAxis = getRandomAxis();
      currentLayer = getRandomLayer();
      currentDirection = getRandomDirection();
      rotationProgress = 0;
    }

    rotationProgress += scrambleSpeed;

    const cubies = rubiksCube.children;
    cubies.forEach(cubie => {
      const pos = cubie.position;
      let shouldRotate = false;

      if (currentAxis === 'x' && Math.abs(pos.x - currentLayer) < 0.1) {
        shouldRotate = true;
      } else if (currentAxis === 'y' && Math.abs(pos.y - currentLayer) < 0.1) {
        shouldRotate = true;
      } else if (currentAxis === 'z' && Math.abs(pos.z - currentLayer) < 0.1) {
        shouldRotate = true;
      }

      if (shouldRotate) {
        cubie.rotation[currentAxis] = rotationProgress * Math.PI / 2 * currentDirection;
      }
    });

    if (rotationProgress >= 1) {
      currentAxis = null;
      scrambleSteps++;
    }
  }, 50);
}

// Add keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    autoRotate = !autoRotate;
  } else if (e.code === 'KeyS') {
    scrambleCube();
  }
});

// Update controls info
setTimeout(() => {
  const controlsInfo = document.querySelector('.controls-info');
  if (controlsInfo) {
    controlsInfo.innerHTML = `
      <h4>Controls</h4>
      <p>🖱️ Drag: Rotate view</p>
      <p>🔍 Scroll: Zoom</p>
      <p>Space: Toggle auto-rotation</p>
      <p>S: Scramble cube</p>
    `;
  }
}, 100);
