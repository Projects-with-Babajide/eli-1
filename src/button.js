import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function createButton(scene) {
  const group = new THREE.Group();

  // Pedestal - tall-ish cylinder, light gray
  const pedestalGeometry = new THREE.CylinderGeometry(0.9, 1.1, 2.2, 32);
  const pedestalMaterial = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
  const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
  pedestal.position.set(0, -8.9, 0); // sits on floor at y=-10, top at ~-7.8
  pedestal.name = 'pedestal';
  group.add(pedestal);

  // Pedestal top cap - flat disk
  const capGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.12, 32);
  const capMaterial = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.set(0, -7.74, 0);
  cap.name = 'pedestalCap';
  group.add(cap);

  // Button base ring
  const baseRingGeometry = new THREE.CylinderGeometry(1.65, 1.65, 0.18, 32);
  const baseRingMaterial = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
  const baseRing = new THREE.Mesh(baseRingGeometry, baseRingMaterial);
  baseRing.position.set(0, -7.6, 0);
  baseRing.name = 'buttonBaseRing';
  group.add(baseRing);

  // Red button - flat cylinder, slightly domed appearance using a sphere segment
  const buttonGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32);
  const buttonMaterial = new THREE.MeshLambertMaterial({
    color: 0xff1111,
    emissive: 0x330000,
    emissiveIntensity: 0.4,
  });
  const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
  button.position.set(0, -7.38, 0);
  button.name = 'redButton';
  group.add(button);

  // Button top dome for visual polish
  const domeGeometry = new THREE.SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.3);
  const domeMaterial = new THREE.MeshLambertMaterial({
    color: 0xff2222,
    emissive: 0x440000,
    emissiveIntensity: 0.3,
  });
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.position.set(0, -7.22, 0);
  dome.name = 'buttonDome';
  group.add(dome);

  // Subtle glow point light on button
  const buttonGlow = new THREE.PointLight(0xff0000, 0.4, 8);
  buttonGlow.position.set(0, -7, 0);
  buttonGlow.name = 'buttonGlow';
  group.add(buttonGlow);

  scene.add(group);

  // Return the clickable button meshes (raycaster targets)
  return {
    group,
    clickTargets: [button, dome],
    button,
    buttonMaterial,
    domeMaterial,
    buttonGlow,
  };
}
