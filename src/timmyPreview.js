import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function initTimmyPreview(canvasEl) {
  const W = 200, H = 200;
  canvasEl.width = W;
  canvasEl.height = H;

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.set(0, 1, 4);
  camera.lookAt(0, 0.3, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(2, 4, 3);
  scene.add(dir);

  // Build Timmy
  const g = new THREE.Group();
  const gray = new THREE.MeshLambertMaterial({ color: 0x999999 });

  // Body
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), gray));

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), gray);
  head.position.set(0, 0.65, 0.1);
  g.add(head);

  // Ears
  const earMat = new THREE.MeshLambertMaterial({ color: 0xbbaaaa });
  [[-0.28, 0.98], [0.28, 0.98]].forEach(([x, y]) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), earMat);
    ear.position.set(x, y, 0.1);
    ear.scale.z = 0.4;
    g.add(ear);
  });

  // Glasses
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  [-0.14, 0.14].forEach(x => {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 20), glassMat);
    lens.position.set(x, 0.67, 0.46);
    g.add(lens);
  });
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), glassMat);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.67, 0.46);
  g.add(bridge);

  // Book
  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.4, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x3355aa })
  );
  book.position.set(0.5, 0.1, 0.3);
  book.rotation.y = -0.4;
  g.add(book);

  // Tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.8, 8), gray);
  tail.position.set(-0.3, -0.3, -0.4);
  tail.rotation.z = 0.8;
  tail.rotation.x = 0.5;
  g.add(tail);

  g.scale.setScalar(1.2);
  scene.add(g);

  let running = true;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    const t = performance.now() / 1000;
    // Bounce
    g.position.y = Math.abs(Math.sin(t * 3)) * 0.8;
    // Gentle spin
    g.rotation.y = t * 0.8;
    renderer.render(scene, camera);
  }

  animate();

  return () => { running = false; renderer.dispose(); };
}
