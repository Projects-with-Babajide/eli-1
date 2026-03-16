import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createRoom } from './room.js';
import { createButton } from './button.js';
import { EventManager } from './events/EventManager.js';
import { congratsEvent } from './events/events.js';

// ─── Renderer ────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ─── Scene ───────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// ─── Camera ──────────────────────────────────────────────────────────────────

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 8);
camera.lookAt(0, -7.5, 0); // Look slightly down toward button
scene.add(camera); // Add to scene so camera.add() works for message event

// ─── Room ────────────────────────────────────────────────────────────────────

createRoom(scene);

// ─── Button ──────────────────────────────────────────────────────────────────

const buttonObj = createButton(scene);

// ─── Event Manager ───────────────────────────────────────────────────────────

const eventManager = new EventManager();

// ─── HUD References ──────────────────────────────────────────────────────────

const counterEl = document.getElementById('counter');
const eventNameEl = document.getElementById('event-name');
const hintEl = document.getElementById('hint');

let clickCount = 0;
let rewardTriggered = false;
let eventNameTimeout = null;

function updateCounter() {
  counterEl.textContent = `${clickCount} / 100`;
  counterEl.classList.add('flash');
  setTimeout(() => counterEl.classList.remove('flash'), 300);
}

function showEventName(name) {
  if (eventNameTimeout) {
    clearTimeout(eventNameTimeout);
  }
  eventNameEl.textContent = name;
  eventNameEl.classList.add('visible');
  eventNameEl.style.transition = 'opacity 0.3s ease';

  eventNameTimeout = setTimeout(() => {
    eventNameEl.style.transition = 'opacity 0.8s ease';
    eventNameEl.classList.remove('visible');
  }, 2000);
}

// ─── Raycaster ───────────────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  if (rewardTriggered) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(buttonObj.clickTargets, false);

  if (intersects.length > 0) {
    handleButtonClick();
  }
}

function handleButtonClick() {
  // Resolve any persistent event (room flip, button chase) first
  if (window._persistentCleanup) {
    window._persistentCleanup();
    window._persistentCleanup = null;
  }

  clickCount++;
  updateCounter();

  // Hide the hint after first click
  if (clickCount === 1 && hintEl) {
    hintEl.style.transition = 'opacity 0.5s';
    hintEl.style.opacity = '0';
    setTimeout(() => { hintEl.style.display = 'none'; }, 500);
  }

  // Visual press feedback on button
  animateButtonPress();

  if (clickCount >= 100 && !rewardTriggered) {
    rewardTriggered = true;
    triggerReward();
  } else if (clickCount === 30) {
    // Milestone: congratulations at exactly 30 clicks
    congratsEvent.play(scene, camera, renderer);
    showEventName(congratsEvent.name);
  } else {
    // Trigger a random event
    const event = eventManager.triggerRandom(scene, camera, renderer);
    showEventName(event.name);
  }
}

function animateButtonPress() {
  // Quick squish animation on button
  const button = buttonObj.button;
  const dome = buttonObj.group.children.find(c => c.name === 'buttonDome');
  const origButtonY = button.position.y;

  const pressDuration = 120;
  const start = performance.now();

  function pressAnim() {
    const t = Math.min((performance.now() - start) / pressDuration, 1);
    const squish = t < 0.5
      ? 1 - t * 0.3
      : 0.85 + (t - 0.5) * 0.3;
    button.scale.y = squish;
    button.position.y = origButtonY - (1 - squish) * 0.15;
    if (dome) {
      dome.scale.y = squish;
      dome.position.y = -7.22 - (1 - squish) * 0.15;
    }
    if (t < 1) {
      requestAnimationFrame(pressAnim);
    } else {
      button.scale.y = 1;
      button.position.y = origButtonY;
      if (dome) {
        dome.scale.y = 1;
        dome.position.y = -7.22;
      }
    }
  }

  pressAnim();

  // Brief emissive flash on click
  buttonObj.buttonMaterial.emissiveIntensity = 1.0;
  buttonObj.domeMaterial.emissiveIntensity = 0.9;
  setTimeout(() => {
    buttonObj.buttonMaterial.emissiveIntensity = 0.4;
    buttonObj.domeMaterial.emissiveIntensity = 0.3;
  }, 200);
}

function triggerReward() {
  showEventName('YOU DID IT');

  // Screen flash white
  const flashEl = document.createElement('div');
  flashEl.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: white; opacity: 0; z-index: 50; pointer-events: none;
    transition: opacity 0.15s ease;
  `;
  document.body.appendChild(flashEl);

  setTimeout(() => {
    flashEl.style.opacity = '1';
    setTimeout(() => {
      flashEl.style.transition = 'opacity 1s ease';
      flashEl.style.opacity = '0';
      setTimeout(() => document.body.removeChild(flashEl), 1100);
    }, 300);
  }, 10);

  // Trigger the reward in 3D and show HUD overlay
  setTimeout(() => {
    eventManager.triggerReward(scene, camera, renderer);
  }, 400);
}

// ─── Window Resize ───────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Mouse Click Listener ────────────────────────────────────────────────────

window.addEventListener('click', onMouseClick);

// Cursor style — pointer when hovering button
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buttonObj.clickTargets, false);
  document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
});

// ─── Animation Loop ──────────────────────────────────────────────────────────

let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 0.016;

  // Subtle idle button glow pulse
  if (buttonObj.buttonGlow) {
    buttonObj.buttonGlow.intensity = 0.4 + Math.sin(time * 2) * 0.15;
  }

  renderer.render(scene, camera);
}

animate();
