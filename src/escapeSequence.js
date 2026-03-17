import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function tween(duration, onTick) {
  return new Promise(resolve => {
    const start = performance.now();
    function tick() {
      const t = Math.min((performance.now() - start) / duration, 1);
      onTick(t);
      if (t < 1) requestAnimationFrame(tick); else resolve();
    }
    requestAnimationFrame(tick);
  });
}

// ─── Dialogue overlay ─────────────────────────────────────────────────────────
function showDialogue(text, speaker) {
  let d = document.getElementById('esc-dialogue');
  if (!d) {
    d = document.createElement('div');
    d.id = 'esc-dialogue';
    d.style.cssText = `
      position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.88);color:#fff;padding:14px 30px;
      border-radius:3px;font-family:'Courier New',monospace;font-size:17px;
      letter-spacing:2px;text-align:center;z-index:60;pointer-events:none;
      max-width:720px;white-space:pre-line;line-height:1.5;
      border:1px solid rgba(255,255,255,0.1);
    `;
    document.body.appendChild(d);
  }
  const color = speaker === 'timmy' ? '#88aaff' : '#ffaaaa';
  const name  = speaker === 'timmy' ? 'TIMMY'    : 'SCIENTIST';
  d.innerHTML = `<span style="color:${color}">[${name}]</span>  ${text}`;
}

function clearDialogue() {
  const d = document.getElementById('esc-dialogue');
  if (d) d.remove();
}

// ─── Timmy ────────────────────────────────────────────────────────────────────
function buildTimmy() {
  const g = new THREE.Group();
  const gray = new THREE.MeshLambertMaterial({ color: 0x999999 });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), gray));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), gray);
  head.position.set(0, 0.65, 0.1); g.add(head);
  const earMat = new THREE.MeshLambertMaterial({ color: 0xbbaaaa });
  [[-0.28, 0.98], [0.28, 0.98]].forEach(([x, y]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), earMat);
    e.position.set(x, y, 0.1); e.scale.z = 0.4; g.add(e);
  });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  [-0.14, 0.14].forEach(x => {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 20), glassMat);
    lens.position.set(x, 0.67, 0.46); g.add(lens);
  });
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), glassMat);
  bridge.rotation.z = Math.PI / 2; bridge.position.set(0, 0.67, 0.46); g.add(bridge);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.8, 8), gray);
  tail.position.set(-0.3, -0.3, -0.4); tail.rotation.z = 0.8; tail.rotation.x = 0.5; g.add(tail);
  return g;
}

// ─── Cardboard box ────────────────────────────────────────────────────────────
function buildBox() {
  const g = new THREE.Group();
  const brown = new THREE.MeshLambertMaterial({ color: 0xc8922a });
  const dark  = new THREE.MeshLambertMaterial({ color: 0x8b5e10 });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), brown));
  // Lid (slightly ajar)
  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 2.2), brown);
  lid.position.y = 1.13; g.add(lid);
  // Fold seams
  [-0.5, 0, 0.5].forEach(z => {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.06, 0.06), dark);
    seam.position.z = z; g.add(seam);
  });
  // Tape strip
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.22, 0.06), new THREE.MeshLambertMaterial({ color: 0xcccc88, transparent: true, opacity: 0.8 }));
  tape.position.z = 1.12; g.add(tape);
  return g;
}

// ─── Door in back wall ────────────────────────────────────────────────────────
function buildDoor(scene) {
  const z = -9.82;
  const cx = 0;
  const cy = -7.25; // centre of door (floor at -10, so bottom at ~-9, top at ~-5.5)

  // Dark opening plane (fake "hole" in wall)
  const openingMat = new THREE.MeshLambertMaterial({ color: 0x080808, side: THREE.DoubleSide });
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.8), openingMat);
  opening.position.set(cx, cy, z + 0.01);
  scene.add(opening);

  // Frame
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x553311 });
  const leftPost  = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.0, 0.25), frameMat);
  leftPost.position.set(cx - 1.6, cy, z);
  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.0, 0.25), frameMat);
  rightPost.position.set(cx + 1.6, cy, z);
  const topBar    = new THREE.Mesh(new THREE.BoxGeometry(3.64, 0.22, 0.25), frameMat);
  topBar.position.set(cx, cy + 2.5, z);
  scene.add(leftPost, rightPost, topBar);

  // Door panel — pivots at its left edge (cx - 1.5)
  const doorPanel = new THREE.Group();
  doorPanel.position.set(cx - 1.5, cy, z);

  const panelMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 4.8, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x7a4a1a, side: THREE.DoubleSide })
  );
  panelMesh.position.x = 1.5; // right half — left edge at x=0 (hinge)
  doorPanel.add(panelMesh);

  // Knob
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xddbb33, emissive: 0x998800, emissiveIntensity: 0.3 })
  );
  knob.position.set(2.7, 0, 0.08);
  doorPanel.add(knob);

  scene.add(doorPanel);
  return { doorPanel, opening };
}

// ─── Scientist ────────────────────────────────────────────────────────────────
function buildScientist() {
  const g = new THREE.Group();
  const skin  = new THREE.MeshLambertMaterial({ color: 0xffddcc });
  const white = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
  const dark  = new THREE.MeshLambertMaterial({ color: 0x333333 });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), skin);
  head.position.y = 2.15; g.add(head);
  // Hair
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), dark);
  hair.position.set(0, 2.48, 0); hair.scale.y = 0.45; g.add(hair);
  // White coat body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.45, 0.42), white);
  body.position.y = 1.08; g.add(body);
  // Pants
  const pants = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.4), dark);
  pants.position.y = 0.17; g.add(pants);
  // Legs
  [[-0.22, -0.65], [0.22, -0.65]].forEach(([x, y]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.95, 8), dark);
    leg.position.set(x, y, 0); g.add(leg);
  });
  // Arms
  [[-0.58, 1.18, 0.28], [0.58, 1.18, -0.28]].forEach(([x, y, rz]) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.92, 8), white);
    arm.position.set(x, y, 0); arm.rotation.z = rz; g.add(arm);
  });
  // Glasses
  const gMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  [-0.13, 0.13].forEach(x => {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 16), gMat);
    lens.position.set(x, 2.15, 0.33); g.add(lens);
  });
  // Clipboard
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.04), white);
  clip.position.set(0.52, 1.0, 0.28); clip.rotation.y = -0.3; g.add(clip);

  g.scale.setScalar(1.5);
  return g;
}

// ─── Main escape sequence ─────────────────────────────────────────────────────
export async function startEscapeSequence(scene, camera) {
  window._escapeActive = true;

  // ── Phase 1: Timmy scurries back in ──────────────────────────────────────
  const timmy = buildTimmy();
  timmy.position.set(-9.5, -8.8, -9.5);
  timmy.rotation.y = Math.PI / 4;
  timmy.scale.setScalar(1.4);
  scene.add(timmy);

  // Idle bob
  const tBob0 = performance.now();
  let timmyBobActive = true;
  function timmyBob() {
    if (!timmyBobActive) return;
    timmy.position.y = -8.8 + Math.sin((performance.now() - tBob0) / 1000 * 1.5) * 0.1;
    requestAnimationFrame(timmyBob);
  }
  timmyBob();

  // Scurry to his corner
  await tween(1200, t => {
    timmy.position.x = lerp(-9.5, -8.5, easeInOut(t));
    timmy.position.z = lerp(-9.5, -8.5, easeInOut(t));
  });

  await wait(600);
  showDialogue('PSST. HEY. OVER HERE.', 'timmy');
  await wait(2800);
  showDialogue('THERE IS AN ESCAPE FROM THIS ROOM.', 'timmy');
  await wait(3000);
  showDialogue('TRUST ME.', 'timmy');
  await wait(2500);
  clearDialogue();

  // ── Phase 2: Timmy hops to button ────────────────────────────────────────
  timmyBobActive = false;
  showDialogue('FOLLOW MY LEAD.', 'timmy');

  await tween(1800, t => {
    timmy.position.x = lerp(-8.5, 0, easeInOut(t));
    timmy.position.z = lerp(-8.5, 0.8, easeInOut(t));
    timmy.position.y = -8.8 + Math.abs(Math.sin(t * Math.PI * 4)) * 1.8;
    timmy.rotation.y = lerp(Math.PI / 4, Math.PI, easeInOut(t));
  });

  // Timmy perches on the button pedestal
  timmy.position.set(0, -7.0, 0.5);
  timmy.scale.setScalar(0.85);
  timmy.rotation.y = Math.PI;
  clearDialogue();
  await wait(600);

  // ── Phase 3: Box appears ─────────────────────────────────────────────────
  const box = buildBox();
  box.position.set(-5, -9.4, 4.5); // front-left corner, easy to reach
  box.scale.setScalar(0);
  scene.add(box);

  // Pop in
  await tween(400, t => { box.scale.setScalar(easeInOut(t)); });

  showDialogue('GET IN THE BOX. CLICK IT.', 'timmy');
  window._movementLocked = false;

  // Pulse until clicked
  let boxPulse = true;
  const bpT0 = performance.now();
  function pulseBox() {
    if (!boxPulse) return;
    box.scale.setScalar(1 + Math.sin((performance.now() - bpT0) / 1000 * 5) * 0.05);
    requestAnimationFrame(pulseBox);
  }
  pulseBox();

  // Wait for player to click box
  await new Promise(resolve => {
    window._escapeBoxActive = box;
    window._onBoxClick = () => { boxPulse = false; box.scale.setScalar(1); resolve(); };
  });

  clearDialogue();
  window._movementLocked = true;

  // ── Phase 4: Hide in box ─────────────────────────────────────────────────
  showDialogue('GOOD. STAY STILL. DO NOT MAKE A SOUND.', 'timmy');

  const origPos = camera.position.clone();
  const origYaw = window._camYaw || 0;
  window._camOverride = true;

  // Camera slides into box
  await tween(900, t => {
    camera.position.x = lerp(origPos.x, box.position.x, easeInOut(t));
    camera.position.y = lerp(origPos.y, box.position.y + 0.6, easeInOut(t));
    camera.position.z = lerp(origPos.z, box.position.z, easeInOut(t));
    camera.rotation.y = lerp(origYaw, 0, easeInOut(t));
    camera.rotation.x = lerp(window._camPitch || -0.75, 0, easeInOut(t));
  });
  window._camYaw   = 0;
  window._camPitch = 0;

  // Cardboard box vignette
  const vignette = document.createElement('div');
  vignette.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;
    background:radial-gradient(ellipse at center, transparent 18%, rgba(80,45,10,0.88) 100%);
    opacity:0;transition:opacity 0.6s;
  `;
  document.body.appendChild(vignette);
  await wait(50);
  vignette.style.opacity = '1';

  await wait(1200);
  clearDialogue();
  showDialogue('...', 'timmy');
  await wait(1500);
  clearDialogue();

  // ── Phase 5: Door appears ────────────────────────────────────────────────
  const { doorPanel } = buildDoor(scene);
  await wait(800);

  showDialogue('THEY ARE COMING.', 'timmy');
  await wait(1800);
  clearDialogue();

  // Door swings open (inward)
  await tween(1100, t => {
    doorPanel.rotation.y = lerp(0, -Math.PI * 0.78, easeInOut(t));
  });
  await wait(400);

  // ── Phase 6: Scientist enters ────────────────────────────────────────────
  const scientist = buildScientist();
  scientist.position.set(0, -8.5, -9.6);
  scientist.rotation.y = 0; // faces into room (forward)
  scene.add(scientist);

  await tween(2200, t => {
    scientist.position.z = lerp(-9.6, -3, easeInOut(t));
  });
  await wait(500);

  showDialogue('TIMMY. WHERE IS THE SUBJECT?', 'scientist');
  await wait(3000);
  clearDialogue();

  // Timmy hesitates
  timmy.rotation.y = lerp(Math.PI, Math.PI * 1.4, 0.7);
  await wait(600);
  showDialogue('THEY... VANISHED. INTO THIN AIR.', 'timmy');
  await wait(3200);
  clearDialogue();

  showDialogue('IMPOSSIBLE. I NEED THEM FOR THE EXPERIMENT.', 'scientist');
  await wait(2800);
  clearDialogue();

  // Scientist searches the room — walks around
  showDialogue('SEARCH EVERY CORNER.', 'scientist');
  await tween(2800, t => {
    scientist.position.x = lerp(0, 5, easeInOut(t));
    scientist.position.z = lerp(-3, 3, easeInOut(t));
    scientist.rotation.y = lerp(0, Math.PI * 1.5, t);
  });
  await wait(400);

  clearDialogue();
  // Scientist walks close to the box (tense moment) — stays in front so player can see
  await tween(1500, t => {
    scientist.position.x = lerp(5, -4, easeInOut(t));
    scientist.position.z = lerp(3, 2, easeInOut(t));
  });
  await wait(800);

  showDialogue('...INTERESTING. THE BOX.', 'scientist');
  await wait(2500);
  clearDialogue();

  // Scientist reaches for electrifier and advances on box — stays in front of box
  showDialogue('STEP ASIDE, TIMMY. I NEED TO OPEN IT.', 'scientist');
  await tween(1200, t => {
    scientist.position.x = lerp(-4, -4.8, easeInOut(t));
    scientist.position.z = lerp(2, 2.5, easeInOut(t));
  });
  await wait(2600);
  clearDialogue();

  // Scientist closes in — still in front of box (z < 4.5 = visible to player)
  showDialogue('THIS WILL ONLY TAKE A MOMENT.', 'scientist');
  await tween(1000, t => {
    scientist.position.x = lerp(-4.8, -5, easeInOut(t));
    scientist.position.z = lerp(2.5, 3.0, easeInOut(t));
  });
  await wait(2000);
  clearDialogue();

  // ── Timmy intercepts ─────────────────────────────────────────────────────
  showDialogue('NO! LEAVE THEM ALONE!', 'timmy');

  // Timmy leaps from pedestal to block the scientist
  timmyBobActive = false;
  await tween(700, t => {
    timmy.position.x = lerp(0, -5.0, easeInOut(t));
    timmy.position.z = lerp(0.5, 3.2, easeInOut(t));
    timmy.position.y = lerp(-7.0, -8.8, easeInOut(t)) + Math.abs(Math.sin(t * Math.PI)) * 3;
    timmy.rotation.y = lerp(Math.PI, Math.PI * 2.5, easeInOut(t));
  });
  timmy.position.set(-5.0, -8.8, 3.2);
  await wait(400);
  clearDialogue();

  // ── Electric shock ───────────────────────────────────────────────────────
  // Flash overlay — repeated pulses
  const flashEl = document.createElement('div');
  flashEl.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    pointer-events:none;z-index:50;
    background:rgba(100,180,255,0.0);transition:background 0.08s;
  `;
  document.body.appendChild(flashEl);

  for (let i = 0; i < 5; i++) {
    flashEl.style.background = `rgba(100,180,255,${0.5 + i * 0.1})`;
    await wait(80);
    flashEl.style.background = 'rgba(100,180,255,0)';
    await wait(80);
  }
  // Final big white-blue flash
  flashEl.style.transition = 'background 0.05s';
  flashEl.style.background = 'rgba(200,230,255,0.95)';
  await wait(300);
  flashEl.style.transition = 'background 0.5s';
  flashEl.style.background = 'rgba(100,180,255,0)';
  await wait(600);
  flashEl.remove();

  // Both Timmy and scientist crumple
  timmy.rotation.z = 1.1;
  timmy.position.y = -9.4;
  scientist.rotation.z = -0.9;
  scientist.position.y = -9.0;

  await wait(800);

  // ── Timmy's last words ───────────────────────────────────────────────────
  showDialogue('run.', 'timmy');
  await wait(3000);
  clearDialogue();
  await wait(400);

  // ── Camera bolts for the door ────────────────────────────────────────────
  const runStartX = camera.position.x;
  const runStartZ = camera.position.z;
  const runStartY = camera.position.y;

  await tween(2200, t => {
    const e = easeInOut(t);
    camera.position.x = lerp(runStartX, 0, e);
    camera.position.z = lerp(runStartZ, -9.0, e);
    camera.position.y = lerp(runStartY, -8.5, e);
    camera.rotation.y = lerp(0, 0, e);
    camera.rotation.x = lerp(0, -0.1, e);
  });

  await wait(600);

  // ── Fade to white ────────────────────────────────────────────────────────
  vignette.style.transition = 'opacity 3s ease, background 3s ease';
  vignette.style.background = 'white';
  await wait(100);
  vignette.style.opacity = '1';
  await wait(3200);

  // Final text overlay
  const endScreen = document.createElement('div');
  endScreen.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:white;display:flex;flex-direction:column;
    align-items:center;justify-content:center;z-index:300;
    opacity:0;transition:opacity 2s ease;
    font-family:'Courier New',monospace;
  `;
  endScreen.innerHTML = `
    <div style="font-size:30px;letter-spacing:7px;color:#111;text-transform:uppercase;text-align:center;margin-bottom:24px;">
      WHAT WAS BEHIND THAT DOOR?
    </div>
    <div style="font-size:13px;letter-spacing:4px;color:#888;margin-top:8px;">
      you never found out.
    </div>
  `;
  document.body.appendChild(endScreen);
  await wait(100);
  endScreen.style.opacity = '1';
  vignette.style.opacity = '0';
  setTimeout(() => vignette.remove(), 3100);
}
