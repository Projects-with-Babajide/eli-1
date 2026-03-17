import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import events from './events.js';

export class EventManager {
  constructor() {
    this.allEvents = [...events];
    this.pool = [];
    this._refillPool();
    this.isEventActive = false;
  }

  _refillPool() {
    // Shuffle a fresh copy
    this.pool = [...this.allEvents].sort(() => Math.random() - 0.5);
  }

  triggerRandom(scene, camera, renderer) {
    if (this.pool.length === 0) {
      this._refillPool();
    }

    const event = this.pool.pop();
    event.play(scene, camera, renderer);
    return event;
  }

  triggerById(id, scene, camera, renderer) {
    const event = this.allEvents.find(e => e.id === id);
    if (event) event.play(scene, camera, renderer);
    return event;
  }

  triggerReward(scene, camera, renderer) {
    // Colorful point lights pulsing
    const lights = [];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x88ff00];

    colors.forEach((color, i) => {
      const light = new THREE.PointLight(color, 2.5, 20);
      const angle = (i / colors.length) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 6, Math.sin(angle) * 3, Math.sin(angle) * 6);
      scene.add(light);
      lights.push(light);
    });

    // Golden spinning torus in center
    const torusGeo = new THREE.TorusGeometry(2.5, 0.5, 24, 64);
    const torusMat = new THREE.MeshLambertMaterial({
      color: 0xffd700,
      emissive: 0xaa8800,
      emissiveIntensity: 0.6,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(0, 0, 0);
    scene.add(torus);

    // Second torus ring perpendicular
    const torus2Geo = new THREE.TorusGeometry(2.5, 0.3, 24, 64);
    const torus2Mat = new THREE.MeshLambertMaterial({
      color: 0xffaa00,
      emissive: 0x996600,
      emissiveIntensity: 0.6,
    });
    const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
    torus2.position.set(0, 0, 0);
    torus2.rotation.x = Math.PI / 2;
    scene.add(torus2);

    // Central glow
    const centerGlow = new THREE.PointLight(0xffd700, 3, 15);
    centerGlow.position.set(0, 0, 0);
    scene.add(centerGlow);

    // Animate the reward
    let startTime = performance.now();
    let active = true;

    function rewardTick() {
      if (!active) return;
      const t = (performance.now() - startTime) / 1000;

      // Spin tori
      torus.rotation.y = t * 1.5;
      torus.rotation.x = t * 0.8;
      torus2.rotation.z = t * 1.2;
      torus2.rotation.y = t * 0.5;

      // Pulse lights
      lights.forEach((light, i) => {
        light.intensity = 2.5 + Math.sin(t * 4 + i) * 1.5;
      });
      centerGlow.intensity = 2 + Math.sin(t * 6) * 1.5;

      requestAnimationFrame(rewardTick);
    }

    rewardTick();

    // Show the HUD reward message
    const overlay = document.getElementById('reward-overlay');
    if (overlay) {
      overlay.classList.add('visible');
    }

    // After 6 seconds, fade everything out and reset
    setTimeout(() => {
      // Fade lights
      let fadeStart = performance.now();
      function fadeOut() {
        const ft = Math.min((performance.now() - fadeStart) / 2000, 1);
        lights.forEach((l) => {
          l.intensity = 2.5 * (1 - ft);
        });
        centerGlow.intensity = 3 * (1 - ft);
        torus.rotation.y += 0.02;
        torus2.rotation.z += 0.015;

        if (ft < 1) {
          requestAnimationFrame(fadeOut);
        } else {
          active = false;
          lights.forEach((l) => scene.remove(l));
          scene.remove(torus);
          scene.remove(torus2);
          scene.remove(centerGlow);

          // Restore room and lights to clean state
          const room = scene.getObjectByName('room');
          if (room) room.material.color.set(0xffffff);
          const ambient = scene.getObjectByName('ambientLight');
          if (ambient) {
            ambient.color.set(0xffffff);
            ambient.intensity = 0.6;
          }
          const ceiling = scene.getObjectByName('ceilingLight');
          if (ceiling) {
            ceiling.color.set(0xffffff);
            ceiling.intensity = 1.2;
          }
        }
      }
      fadeOut();
    }, 6000);
  }
}
