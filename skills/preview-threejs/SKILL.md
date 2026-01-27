---
name: preview-threejs
description: Create interactive 3D visualizations using Three.js with orbit controls, lighting, and animation
user-invocable: true
commands:
  - preview
  - preview-threejs
---

# Preview Three.js Skill

Interactive Three.js 3D visualization viewer with pre-configured scene, camera, lighting, and orbit controls.

## Usage

```bash
# Preview a Three.js visualization file
/preview solar-system.threejs

# Or use .3d extension
/preview model.3d

# Pipe Three.js code (preferred for temporary content)
cat visualization.js | /preview
echo "const cube = new THREE.Mesh(...);\nscene.add(cube);" | /preview
```

**Best Practice:** For temporary or generated 3D scenes, prefer piping over creating temporary files. This avoids cluttering your filesystem and the content is automatically cleaned up.

## Options

The script works with sensible defaults but supports these flags for flexibility:

- `-o, --output PATH` - Custom output path
- `--no-browser` - Skip browser, output file path only

## Features

- **3D rendering** with WebGL
- **Orbit controls** - Drag to rotate, scroll to zoom, right-click to pan
- **Pre-configured lighting** - Ambient + directional lights ready
- **Animation loop** with customAnimate callback
- **Reset view** button
- **Code viewer** toggle
- **Responsive design** adapts to window size

## When to Use This Skill

Use this skill when the user wants to:

- Create 3D visualizations and models
- Render geometric shapes and patterns
- Visualize 3D data
- Create interactive 3D scenes
- Prototype 3D animations

## Three.js Code Requirements

Your code should:

1. Create geometries and materials
2. Create meshes and add them to the `scene`
3. Optionally define `scene.userData.customAnimate` for animation

## Pre-initialized Variables

Your code runs with these variables ready to use:

```javascript
const THREE = THREE; // Three.js library (r160)
const scene = scene; // Scene object (ready)
const camera = camera; // PerspectiveCamera at (0, 0, 5)
const renderer = renderer; // WebGLRenderer (configured)
```

**Lighting already configured:**

- AmbientLight (soft overall lighting)
- DirectionalLight at (5, 5, 5) (main light source)

**Orbit controls enabled:**

- Drag to rotate view
- Scroll to zoom in/out
- Right-click drag to pan

## Complete Example - Rotating Cube

```javascript
// Create a simple cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0.3,
  roughness: 0.7,
});
const cube = new THREE.Mesh(geometry, material);

// Add to scene
scene.add(cube);

// Optional: Add animation
scene.userData.customAnimate = function () {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
};
```

## Common Patterns

### Basic Shapes

```javascript
// Sphere
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
scene.add(sphere);

// Cylinder
const cylinder = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 2, 32),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
scene.add(cylinder);

// Torus
const torus = new THREE.Mesh(
  new THREE.TorusGeometry(1, 0.3, 16, 100),
  new THREE.MeshStandardMaterial({ color: 0x0000ff })
);
scene.add(torus);
```

### Materials

```javascript
// Standard (responds to lighting) - RECOMMENDED
const standard = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.5,
});

// Basic (no lighting)
const basic = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// Wireframe
const wireframe = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});

// Phong (shiny)
const phong = new THREE.MeshPhongMaterial({
  color: 0x0000ff,
  shininess: 100,
});
```

### Groups

```javascript
const group = new THREE.Group();
group.add(mesh1);
group.add(mesh2);
group.position.set(0, 1, 0);
group.rotation.y = Math.PI / 4;
scene.add(group);
```

### Animation Loop

```javascript
scene.userData.customAnimate = function () {
  // Called every frame (~60fps)
  object.rotation.y += 0.01;
  object.position.x = Math.sin(Date.now() * 0.001) * 3;

  // Can access objects via scene
  scene.children.forEach((child) => {
    if (child.isMesh) {
      child.rotation.x += 0.005;
    }
  });
};
```

### Positioning Objects

```javascript
// Position (x, y, z)
object.position.set(0, 2, 0);
object.position.x = 1;
object.position.y = 2;
object.position.z = 3;

// Rotation (in radians)
object.rotation.set(0, Math.PI / 4, 0);
object.rotation.y = Math.PI / 2; // 90 degrees

// Scale
object.scale.set(2, 2, 2); // Double size
```

## Complete Example - Solar System

```javascript
// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(sun);

// Earth
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x0000ff })
);
scene.add(earth);

// Moon
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xcccccc })
);
scene.add(moon);

// Animation
scene.userData.customAnimate = function () {
  const time = Date.now() * 0.001;

  // Earth orbits sun
  earth.position.x = Math.cos(time) * 4;
  earth.position.z = Math.sin(time) * 4;
  earth.rotation.y = time;

  // Moon orbits earth
  moon.position.x = earth.position.x + Math.cos(time * 4) * 0.8;
  moon.position.z = earth.position.z + Math.sin(time * 4) * 0.8;
};
```

## Built-in Features

- **Orbit controls** - Mouse drag to rotate, scroll to zoom
- **Lighting** - Pre-configured ambient + directional lights
- **Animation loop** - `customAnimate()` called every frame
- **Reset view** - Button to reset camera position
- **Code viewer** - Toggle to show/hide source code

## Pre-configured Settings

- **Camera**: PerspectiveCamera at (0, 0, 5) looking at origin
- **Renderer**: WebGLRenderer with antialiasing enabled
- **Lighting**:
  - AmbientLight (0x404040) - soft overall lighting
  - DirectionalLight (0xffffff) at (5, 5, 5) - main light
- **Background**: Black (#000000) by default
- **Orbit controls**: Enabled with damping for smooth movement

## Best Practices

1. **Use MeshStandardMaterial** - Works with lighting (recommended)
2. **Keep objects visible** - Objects should be between 0.1 and 10 units
3. **Use groups** - Organize related objects together
4. **Test animations** - Define `customAnimate` to see motion
5. **Embed data** - Include all data in the code file

## Troubleshooting

### Scene appears black/empty

- Verify objects are added to scene: `scene.add(object)`
- Check objects are within camera view (try moving camera)
- Use MeshStandardMaterial or MeshPhongMaterial (they respond to lighting)
- Verify geometries have valid dimensions

### Objects too small/large

- Adjust object scale: `object.scale.set(2, 2, 2)`
- Or adjust camera position: `camera.position.z = 10`
- Check units are reasonable (0.1 to 10 typically)

### Animation doesn't work

- Verify `scene.userData.customAnimate` is defined as a function
- Check browser console for JavaScript errors
- Ensure function syntax is correct
- Test with simple rotation first

### Objects appear flat/unlit

- Use MeshStandardMaterial or MeshPhongMaterial instead of MeshBasicMaterial
- Ensure normals are correct (automatic for built-in geometries)
- Check that lights are present (they're pre-configured)

## Technical Details

### File Requirements

- File extensions: `.threejs`, `.3d`
- Maximum size: 10MB (configurable)
- Valid JavaScript code
- Self-contained (no external dependencies)

### Browser Compatibility

- Modern browsers with WebGL support
- Requires JavaScript enabled
- CDN-dependent: Three.js r160 library

## Output

The skill generates a standalone HTML file at:

```
/tmp/preview-skills/preview-threejs-{filename}.html
```

## Development

This skill is standalone and includes all dependencies:

- Shared libraries bundled in `lib/`
- Templates bundled in `templates/`
- External CDN dependencies: Three.js r160

To modify the skill:

1. Edit `config.sh` for configuration
2. Edit `templates/scripts/threejs-renderer.js` for behavior
3. Edit `templates/styles/threejs.css` for styling
4. Run `run.sh` to test changes

## Learn More

- Three.js Documentation: https://threejs.org/docs/
- Three.js Examples: https://threejs.org/examples/
- Three.js Journey: https://threejs-journey.com/
