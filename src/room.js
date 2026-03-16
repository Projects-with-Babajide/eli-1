import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function createRoom(scene) {
  // Single box geometry with BackSide so interior looks like a white room
  const roomGeometry = new THREE.BoxGeometry(20, 20, 20);
  const roomMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    side: THREE.BackSide,
  });

  const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
  roomMesh.name = 'room';
  scene.add(roomMesh);

  // Soft ambient light - slightly warm white
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  ambientLight.name = 'ambientLight';
  scene.add(ambientLight);

  // Main point light near ceiling center
  const ceilingLight = new THREE.PointLight(0xffffff, 1.2, 40);
  ceilingLight.position.set(0, 8, 0);
  ceilingLight.name = 'ceilingLight';
  scene.add(ceilingLight);

  // Secondary fill light from below to reduce harshness
  const fillLight = new THREE.PointLight(0xffffff, 0.3, 30);
  fillLight.position.set(0, -6, 0);
  fillLight.name = 'fillLight';
  scene.add(fillLight);

  return roomMesh;
}
