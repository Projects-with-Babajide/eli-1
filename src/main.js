import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createRoom } from './room.js';
import { createButton } from './button.js';
import { EventManager } from './events/EventManager.js';
import { congratsEvent, congrats50Event } from './events/events.js';
import { startEscapeSequence } from './escapeSequence.js';
import { openTimmyDialogue } from './timmyDialogue.js';

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
camera.rotation.order = 'YXZ'; // Standard FPS rotation order
// Initial look: slightly down toward button (matches old lookAt(0,-7.5,0))
window._camYaw   = 0;
window._camPitch = -0.75;
window._camOverride = false;
camera.rotation.set(window._camPitch, window._camYaw, 0);
scene.add(camera);

// ─── Room ────────────────────────────────────────────────────────────────────

createRoom(scene);

// ─── Button ──────────────────────────────────────────────────────────────────

const buttonObj = createButton(scene);

// ─── Event Manager ───────────────────────────────────────────────────────────

const eventManager = new EventManager();

// ─── HUD References ──────────────────────────────────────────────────────────

const counterEl  = document.getElementById('counter');
const eventNameEl = document.getElementById('event-name');
const hintEl      = document.getElementById('hint');
const crosshairEl = document.getElementById('crosshair');

// Timmy interact hint
const interactHintEl = document.createElement('div');
interactHintEl.style.cssText = `
  position:fixed;top:calc(50% + 22px);left:50%;transform:translateX(-50%);
  color:rgba(255,255,255,0.85);font-family:'Courier New',monospace;
  font-size:11px;letter-spacing:3px;text-transform:uppercase;
  background:rgba(0,0,0,0.55);padding:4px 12px;border-radius:2px;
  pointer-events:none;display:none;z-index:15;
`;
interactHintEl.textContent = 'click to interact';
document.body.appendChild(interactHintEl);

// ─── Pointer Lock Mouse Look ──────────────────────────────────────────────────

let pointerLocked = false;
const SENSITIVITY = 0.0018;

if (hintEl) hintEl.textContent = 'CLICK TO LOOK AROUND';

renderer.domElement.addEventListener('click', () => {
  if (!pointerLocked) renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  if (crosshairEl) crosshairEl.style.opacity = pointerLocked ? '0.7' : '0.3';
  if (hintEl && !pointerLocked) hintEl.textContent = 'CLICK TO LOOK AROUND';
});

document.addEventListener('mousemove', (e) => {
  if (!pointerLocked) return;
  window._camYaw   -= e.movementX * SENSITIVITY;
  window._camPitch -= e.movementY * SENSITIVITY;
  window._camPitch  = Math.max(-1.4, Math.min(0.5, window._camPitch));
});

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
  // Escape sequence: box click works even after reward
  if (window._escapeBoxActive && pointerLocked) {
    mouse.set(0, 0);
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObject(window._escapeBoxActive, true);
    if (hit.length > 0 && window._onBoxClick) {
      window._onBoxClick();
      window._escapeBoxActive = null;
    }
    return;
  }

  if (rewardTriggered) return;

  // Monster fight: any click = sword swing regardless of lock state
  if (window._monsterFight && window._monsterFight.active) {
    if (window._monsterFight.onSwing) window._monsterFight.onSwing();
    return;
  }

  // While pointer is not locked the click was used to lock — don't fire button
  if (!pointerLocked) return;

  // Pointer is locked: aim is always the crosshair (screen centre)
  mouse.set(0, 0);
  raycaster.setFromCamera(mouse, camera);

  // Check Timmy first — clicking him opens dialogue instead of pressing the button
  if (window._timmyGroup && !window._timmyDialogueActive) {
    const timmyHit = raycaster.intersectObject(window._timmyGroup, true);
    if (timmyHit.length > 0) {
      openTimmyDialogue();
      return;
    }
  }

  const intersects = raycaster.intersectObjects(buttonObj.clickTargets, false);
  if (intersects.length > 0) handleButtonClick();
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
    congratsEvent.play(scene, camera, renderer);
    showEventName(congratsEvent.name);
  } else if (clickCount === 41) {
    // Timmy always appears at click 41
    const e = eventManager.triggerById('timmy', scene, camera, renderer);
    if (e) showEventName(e.name);
  } else if (clickCount === 50) {
    congrats50Event.play(scene, camera, renderer);
    showEventName(congrats50Event.name);
  } else if (clickCount === 59) {
    // Monster always attacks at click 59 — save Timmy!
    const e = eventManager.triggerById('monster_fight', scene, camera, renderer);
    if (e) showEventName(e.name);
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

  // Remove Timmy and banana if they made it this far
  if (window._timmyGroup) { scene.remove(window._timmyGroup); window._timmyGroup = null; }
  if (window._bananaGroup) { scene.remove(window._bananaGroup); window._bananaGroup = null; }

  // Trigger the reward in 3D and show HUD overlay
  setTimeout(() => {
    eventManager.triggerReward(scene, camera, renderer);
  }, 400);

  // Fade in the secret ending button after a short delay
  setTimeout(() => {
    const secretBtn = document.getElementById('secret-btn');
    if (secretBtn) {
      secretBtn.style.opacity = '1';
      secretBtn.addEventListener('click', () => {
        if (window._escapeActive) return;
        secretBtn.style.display = 'none';
        document.getElementById('reward-overlay').classList.remove('visible');
        startEscapeSequence(scene, camera);
      });
    }
  }, 3000);
}

// ─── Window Resize ───────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Mouse Click Listener ────────────────────────────────────────────────────

window.addEventListener('click', onMouseClick);

// ─── Keyboard Movement ───────────────────────────────────────────────────────

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  // Prevent arrow keys from scrolling the page
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── Animation Loop ──────────────────────────────────────────────────────────

const MOVE_SPEED = 0.1;
const ROOM_LIMIT = 8.5; // stay inside ±8.5 on X and Z (walls at ±10)

let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 0.016;

  // Apply mouse-look (events can set window._camOverride to take control)
  if (!window._camOverride) {
    camera.rotation.y = window._camYaw;
    camera.rotation.x = window._camPitch;
  }

  // ── WASD / Arrow key movement ─────────────────────────────────────────────
  const yaw = window._camYaw || 0;
  // Forward vector on the XZ plane based on current yaw
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  // Right-strafe vector (perpendicular to forward)
  const rx =  Math.cos(yaw);
  const rz = -Math.sin(yaw);

  if (!window._movementLocked) {
    if (keys['ArrowUp']    || keys['KeyW']) { camera.position.x += fx * MOVE_SPEED; camera.position.z += fz * MOVE_SPEED; }
    if (keys['ArrowDown']  || keys['KeyS']) { camera.position.x -= fx * MOVE_SPEED; camera.position.z -= fz * MOVE_SPEED; }
    if (keys['ArrowRight'] || keys['KeyD']) { camera.position.x += rx * MOVE_SPEED; camera.position.z += rz * MOVE_SPEED; }
    if (keys['ArrowLeft']  || keys['KeyA']) { camera.position.x -= rx * MOVE_SPEED; camera.position.z -= rz * MOVE_SPEED; }
  }

  // Clamp inside the room
  camera.position.x = Math.max(-ROOM_LIMIT, Math.min(ROOM_LIMIT, camera.position.x));
  camera.position.z = Math.max(-ROOM_LIMIT, Math.min(ROOM_LIMIT, camera.position.z));

  // Subtle idle button glow pulse
  if (buttonObj.buttonGlow) {
    buttonObj.buttonGlow.intensity = 0.4 + Math.sin(time * 2) * 0.15;
  }

  // Show "click to interact" when crosshair is over Timmy
  if (window._timmyGroup && !window._timmyDialogueActive && pointerLocked && !rewardTriggered) {
    const hoverMouse = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(hoverMouse, camera);
    const tHit = raycaster.intersectObject(window._timmyGroup, true);
    interactHintEl.style.display = tHit.length > 0 ? 'block' : 'none';
  } else {
    interactHintEl.style.display = 'none';
  }

  renderer.render(scene, camera);
}

animate();
