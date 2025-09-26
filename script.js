// Canvas
const canvas = document.getElementById("bg");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x00ffff, 0.5, 15);
pointLight.position.set(2, 2, 2);
scene.add(pointLight);

// Sphere
const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  roughness: 0.2,
  metalness: 0.8,
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Animate
let t = 0;
function animate() {
  requestAnimationFrame(animate);

  sphere.rotation.y += 0.003;
  sphere.rotation.x += 0.0015;

  t += 0.03;
  pointLight.intensity = 0.3 + Math.sin(t) * 0.2;
  scene.rotation.y = Math.sin(t * 0.05) * 0.01;

  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
