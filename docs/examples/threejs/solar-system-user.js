/* eslint-disable no-unused-vars */
// User code - executes when dynamically loaded
// Create the Sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Add glow effect to the sun
const sunLight = new THREE.PointLight(0xffff00, 2, 100);
sun.add(sunLight);

// Planet data: name, color, size, distance from sun, orbit speed
const planets = [
  { name: 'Mercury', color: 0x8c7853, size: 0.4, distance: 4, speed: 0.04 },
  { name: 'Venus', color: 0xffc649, size: 0.9, distance: 6, speed: 0.03 },
  { name: 'Earth', color: 0x4169e1, size: 1, distance: 8, speed: 0.02 },
  { name: 'Mars', color: 0xcd5c5c, size: 0.5, distance: 10, speed: 0.018 },
  { name: 'Jupiter', color: 0xdaa520, size: 2, distance: 14, speed: 0.013 },
  { name: 'Saturn', color: 0xf4a460, size: 1.8, distance: 18, speed: 0.009 },
  { name: 'Uranus', color: 0x4fd0e0, size: 1.2, distance: 22, speed: 0.006 },
  { name: 'Neptune', color: 0x4169e1, size: 1.2, distance: 26, speed: 0.005 }
];

const planetObjects = [];

planets.forEach(planetData => {
  const planetGeometry = new THREE.SphereGeometry(planetData.size, 32, 32);
  const planetMaterial = new THREE.MeshStandardMaterial({
    color: planetData.color,
    metalness: 0.3,
    roughness: 0.7
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);

  const orbitGeometry = new THREE.RingGeometry(
    planetData.distance - 0.05,
    planetData.distance + 0.05,
    64
  );
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x444444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  if (planetData.name === 'Saturn') {
    const ringGeometry = new THREE.RingGeometry(
      planetData.size * 1.5,
      planetData.size * 2.5,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xdaa520,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);
  }

  planetObjects.push({
    mesh: planet,
    distance: planetData.distance,
    speed: planetData.speed,
    angle: Math.random() * Math.PI * 2
  });

  scene.add(planet);
});

// Stars background
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  sizeAttenuation: true
});

const starsVertices = [];
for (let i = 0; i < 5000; i++) {
  const x = (Math.random() - 0.5) * 200;
  const y = (Math.random() - 0.5) * 200;
  const z = (Math.random() - 0.5) * 200;
  starsVertices.push(x, y, z);
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

camera.position.set(0, 20, 35);
camera.lookAt(0, 0, 0);

scene.userData.customAnimate = function() {
  sun.rotation.y += 0.001;

  planetObjects.forEach(planetObj => {
    planetObj.angle += planetObj.speed * 0.01;

    planetObj.mesh.position.x = Math.cos(planetObj.angle) * planetObj.distance;
    planetObj.mesh.position.z = Math.sin(planetObj.angle) * planetObj.distance;

    planetObj.mesh.rotation.y += 0.01;
  });
};

setTimeout(() => {
  const controlsInfo = document.querySelector('.controls-info');
  if (controlsInfo) {
    controlsInfo.innerHTML = `
      <h4>Controls</h4>
      <p>🖱️ Drag: Rotate view</p>
      <p>🔍 Scroll: Zoom</p>
      <p>⭐ Watch the planets orbit!</p>
    `;
  }
}, 100);
