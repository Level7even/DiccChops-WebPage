// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("bg"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 1));

// Load FBX model
const loader = new THREE.FBXLoader();
loader.load('./models/background.fbx', (object) => {
  object.scale.set(0.01, 0.01, 0.01); // adjust if huge
  scene.add(object);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    object.rotation.y += 0.01; // slow spin
    renderer.render(scene, camera);
  }
  animate();
});

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
