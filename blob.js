import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.getElementById("bg");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5,5,5);
scene.add(dirLight);

const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  metalness: 0.7,
  roughness: 0.2,
  flatShading: false
});
const blob = new THREE.Mesh(geometry, material);
scene.add(blob);

const originalVertices = geometry.attributes.position.array.slice();

let mouseX = 0, mouseY = 0;
const halfX = window.innerWidth / 2;
const halfY = window.innerHeight / 2;

document.addEventListener('mousemove', e => {
  mouseX = (e.clientX - halfX) / halfX;
  mouseY = (e.clientY - halfY) / halfY;
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  blob.rotation.y += (mouseX * Math.PI - blob.rotation.y) * 0.05;
  blob.rotation.x += (mouseY * Math.PI - blob.rotation.x) * 0.05;

  const pos = geometry.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) {
    const ox = originalVertices[i];
    const oy = originalVertices[i + 1];
    const oz = originalVertices[i + 2];
    pos[i]   = ox + 0.1 * Math.sin(time * 3 + ox * 5);
    pos[i+1] = oy + 0.1 * Math.cos(time * 2 + oy * 5);
    pos[i+2] = oz + 0.1 * Math.sin(time * 4 + oz * 5);
  }
  geometry.attributes.position.needsUpdate = true;

  const scale = 1 + mouseY * 0.5;
  blob.scale.set(scale, scale, scale);

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
