import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Utility: linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Utility: animate over duration using requestAnimationFrame
function animate(duration, onTick, onDone) {
  const start = performance.now();
  function tick() {
    const now = performance.now();
    const t = Math.min((now - start) / duration, 1);
    onTick(t);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      if (onDone) onDone();
    }
  }
  requestAnimationFrame(tick);
}

// Utility: ease in-out
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Utility: random in range
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// Utility: random color
function randomColor() {
  return new THREE.Color(Math.random(), Math.random(), Math.random());
}

// Utility: HSL rainbow at t (0-1)
function rainbowColor(t) {
  return new THREE.Color().setHSL(t, 1.0, 0.6);
}

// ─── Congratulations milestone event (triggered at exactly 30 clicks) ────────
export const congratsEvent = {
  id: 'congratulations_30',
  name: 'CONGRATULATIONS ON 30 CLICKS!',
  play(scene, camera) {
    const room = scene.getObjectByName('room');
    const ambient = scene.getObjectByName('ambientLight');
    const origRoomColor = room ? room.material.color.clone() : null;
    const origAmbientColor = ambient ? ambient.color.clone() : null;
    const origAmbientInt = ambient ? ambient.intensity : 0.6;

    let active = true;
    let hue = 0;

    function flash() {
      if (!active) return;
      hue = (hue + 0.08) % 1;
      if (room) room.material.color.setHSL(hue, 0.8, 0.7);
      if (ambient) { ambient.color.setHSL((hue + 0.5) % 1, 0.8, 0.6); ambient.intensity = 1.5; }
      setTimeout(flash, 80);
    }
    flash();

    // Four dancing cats
    const cats = [];
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([cx, cz]) => {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: 0xff8800 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), mat);
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), mat);
      head.position.set(0, 0.75, 0);
      g.add(head);
      const earGeo = new THREE.ConeGeometry(0.13, 0.28, 8);
      const earL = new THREE.Mesh(earGeo, mat);
      earL.position.set(-0.2, 1.2, 0); earL.rotation.z = -0.3;
      const earR = new THREE.Mesh(earGeo, mat);
      earR.position.set(0.2, 1.2, 0); earR.rotation.z = 0.3;
      g.add(earL, earR);
      const eyeMat = new THREE.MeshLambertMaterial({ color: 0x00ee00 });
      const eL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
      eL.position.set(-0.13, 0.82, 0.36);
      const eR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
      eR.position.set(0.13, 0.82, 0.36);
      g.add(eL, eR);
      g.position.set(cx, -8.5, cz);
      g.userData.offset = rand(0, Math.PI * 2);
      scene.add(g);
      cats.push(g);
    });

    const startTime = performance.now();
    function danceCats() {
      if (!active) return;
      const t = (performance.now() - startTime) / 1000;
      cats.forEach(cat => {
        cat.position.y = -8.5 + Math.abs(Math.sin(t * 4 + cat.userData.offset)) * 1.5;
        cat.rotation.y = t * 3 + cat.userData.offset;
      });
      requestAnimationFrame(danceCats);
    }
    danceCats();

    setTimeout(() => {
      active = false;
      if (room && origRoomColor) room.material.color.copy(origRoomColor);
      if (ambient && origAmbientColor) { ambient.color.copy(origAmbientColor); ambient.intensity = origAmbientInt; }
      cats.forEach(cat => scene.remove(cat));
    }, 4500);
  },
};

// ─── Main event pool ─────────────────────────────────────────────────────────
const events = [
  {
    id: 'earthquake',
    name: 'EARTHQUAKE',
    play(scene, camera) {
      const originalPos = camera.position.clone();
      const duration = 1500;
      let done = false;

      function shake() {
        if (done) return;
        camera.position.set(
          originalPos.x + rand(-0.25, 0.25),
          originalPos.y + rand(-0.15, 0.15),
          originalPos.z + rand(-0.25, 0.25)
        );
        requestAnimationFrame(shake);
      }

      shake();
      setTimeout(() => {
        done = true;
        camera.position.copy(originalPos);
      }, duration);
    },
  },

  {
    id: 'lights_out',
    name: 'LIGHTS OUT',
    play(scene, camera) {
      const ambient = scene.getObjectByName('ambientLight');
      const ceiling = scene.getObjectByName('ceilingLight');
      const fill = scene.getObjectByName('fillLight');

      const origAmbient = ambient ? ambient.intensity : 0.6;
      const origCeiling = ceiling ? ceiling.intensity : 1.2;
      const origFill = fill ? fill.intensity : 0.3;

      // Dim lights
      if (ambient) ambient.intensity = 0.02;
      if (ceiling) ceiling.intensity = 0.0;
      if (fill) fill.intensity = 0.0;

      // Red glow from button
      const redLight = new THREE.PointLight(0xff0000, 2.5, 12);
      redLight.position.set(0, -7, 0);
      scene.add(redLight);

      setTimeout(() => {
        scene.remove(redLight);
        if (ambient) ambient.intensity = origAmbient;
        if (ceiling) ceiling.intensity = origCeiling;
        if (fill) fill.intensity = origFill;
      }, 2000);
    },
  },

  {
    id: 'room_color',
    name: 'CHROMATIC SHIFT',
    play(scene) {
      const room = scene.getObjectByName('room');
      if (!room) return;

      const targetColor = randomColor();
      const whiteColor = new THREE.Color(0xffffff);
      const origColor = room.material.color.clone();

      // Flash to color
      animate(500, (t) => {
        room.material.color.lerpColors(origColor, targetColor, easeInOut(t));
      }, () => {
        // Hold then fade back
        setTimeout(() => {
          animate(700, (t) => {
            room.material.color.lerpColors(targetColor, whiteColor, easeInOut(t));
          });
        }, 300);
      });
    },
  },

  {
    id: 'gravity_flip',
    name: 'GRAVITY FLIP',
    play(scene, camera) {
      const origZ = camera.rotation.z;
      // Rotate to 180 degrees
      animate(1000, (t) => {
        camera.rotation.z = lerp(origZ, origZ + Math.PI, easeInOut(t));
      }, () => {
        // Hold 800ms then rotate back
        setTimeout(() => {
          animate(1000, (t) => {
            camera.rotation.z = lerp(origZ + Math.PI, origZ, easeInOut(t));
          });
        }, 800);
      });
    },
  },

  {
    id: 'button_runs',
    name: 'IT RUNS',
    play(scene) {
      const buttonGroup = scene.children.find(
        (c) => c.isGroup && c.children.some((ch) => ch.name === 'redButton')
      );
      if (!buttonGroup) return;

      const origPos = buttonGroup.position.clone();
      const targetX = rand(-5, 5);
      const targetZ = rand(-5, 5);

      animate(600, (t) => {
        buttonGroup.position.x = lerp(origPos.x, targetX, easeInOut(t));
        buttonGroup.position.z = lerp(origPos.z, targetZ, easeInOut(t));
      }, () => {
        setTimeout(() => {
          animate(600, (t) => {
            buttonGroup.position.x = lerp(targetX, origPos.x, easeInOut(t));
            buttonGroup.position.z = lerp(targetZ, origPos.z, easeInOut(t));
          });
        }, 800);
      });
    },
  },

  {
    id: 'meteor',
    name: 'INCOMING',
    play(scene) {
      const geo = new THREE.SphereGeometry(0.8, 16, 16);
      const mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const meteor = new THREE.Mesh(geo, mat);

      const startX = rand(-4, 4);
      const startZ = rand(-4, 4);
      meteor.position.set(startX, 9.5, startZ);
      scene.add(meteor);

      // Trail light
      const trailLight = new THREE.PointLight(0xff6600, 1.5, 6);
      trailLight.position.copy(meteor.position);
      scene.add(trailLight);

      animate(800, (t) => {
        const y = lerp(9.5, -9.2, easeInOut(t));
        meteor.position.y = y;
        trailLight.position.y = y + 1;
      }, () => {
        // Impact flash
        const flashLight = new THREE.PointLight(0xffaa00, 4, 10);
        flashLight.position.set(startX, -9, startZ);
        scene.add(flashLight);

        scene.remove(meteor);
        scene.remove(trailLight);

        // Debris ring
        for (let i = 0; i < 8; i++) {
          const dGeo = new THREE.SphereGeometry(rand(0.1, 0.25), 8, 8);
          const dMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
          const debris = new THREE.Mesh(dGeo, dMat);
          const angle = (i / 8) * Math.PI * 2;
          debris.position.set(
            startX + Math.cos(angle) * rand(0.5, 2),
            -9.5,
            startZ + Math.sin(angle) * rand(0.5, 2)
          );
          scene.add(debris);
          setTimeout(() => scene.remove(debris), 1500);
        }

        setTimeout(() => {
          scene.remove(flashLight);
        }, 600);
      });
    },
  },

  {
    id: 'flood',
    name: 'FLOODING',
    play(scene) {
      const geo = new THREE.PlaneGeometry(20, 20);
      const mat = new THREE.MeshLambertMaterial({
        color: 0x1144ff,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const water = new THREE.Mesh(geo, mat);
      water.rotation.x = -Math.PI / 2;
      water.position.y = -10.5;
      scene.add(water);

      animate(2000, (t) => {
        water.position.y = lerp(-10.5, -2, easeInOut(t));
        mat.opacity = lerp(0.0, 0.5, t < 0.2 ? t / 0.2 : 1);
      }, () => {
        setTimeout(() => {
          animate(1500, (t) => {
            water.position.y = lerp(-2, -10.5, easeInOut(t));
            mat.opacity = lerp(0.5, 0, t);
          }, () => {
            scene.remove(water);
          });
        }, 500);
      });
    },
  },

  {
    id: 'disco',
    name: 'DISCO MODE',
    play(scene) {
      const ambient = scene.getObjectByName('ambientLight');
      const ceiling = scene.getObjectByName('ceilingLight');
      const origAmbientColor = ambient ? ambient.color.clone() : new THREE.Color(0xffffff);
      const origCeilingColor = ceiling ? ceiling.color.clone() : new THREE.Color(0xffffff);
      const origAmbientInt = ambient ? ambient.intensity : 0.6;
      const origCeilingInt = ceiling ? ceiling.intensity : 1.2;

      let active = true;
      let hue = 0;

      function cycle() {
        if (!active) return;
        hue = (hue + 0.04) % 1;
        const c = rainbowColor(hue);
        const c2 = rainbowColor((hue + 0.5) % 1);
        if (ambient) {
          ambient.color.copy(c);
          ambient.intensity = 1.2;
        }
        if (ceiling) {
          ceiling.color.copy(c2);
          ceiling.intensity = 2.0;
        }
        setTimeout(cycle, 60);
      }

      cycle();

      setTimeout(() => {
        active = false;
        if (ambient) {
          ambient.color.copy(origAmbientColor);
          ambient.intensity = origAmbientInt;
        }
        if (ceiling) {
          ceiling.color.copy(origCeilingColor);
          ceiling.intensity = origCeilingInt;
        }
      }, 2000);
    },
  },

  {
    id: 'shrink_room',
    name: 'WALLS CLOSING IN',
    play(scene) {
      const room = scene.getObjectByName('room');
      if (!room) return;

      animate(1000, (t) => {
        const s = lerp(1, 0.45, easeInOut(t));
        room.scale.setScalar(s);
      }, () => {
        setTimeout(() => {
          animate(1000, (t) => {
            const s = lerp(0.45, 1, easeInOut(t));
            room.scale.setScalar(s);
          });
        }, 700);
      });
    },
  },

  {
    id: 'ghost',
    name: 'YOU ARE NOT ALONE',
    play(scene) {
      const geo = new THREE.SphereGeometry(1.0, 24, 24);
      const mat = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        emissive: 0xaaaaaa,
        emissiveIntensity: 0.5,
      });
      const ghost = new THREE.Mesh(geo, mat);

      const startX = rand(-7, 7);
      const startZ = rand(-7, -3);
      ghost.position.set(startX, rand(-2, 3), startZ);
      scene.add(ghost);

      // Drift direction
      const driftX = rand(-0.02, 0.02);
      const driftY = rand(0.005, 0.015);

      let elapsed = 0;
      const totalDuration = 3000;
      let lastTime = performance.now();

      function driftTick() {
        const now = performance.now();
        const dt = now - lastTime;
        lastTime = now;
        elapsed += dt;

        const t = elapsed / totalDuration;
        if (t >= 1) {
          scene.remove(ghost);
          return;
        }

        // Fade in then fade out
        mat.opacity = t < 0.2 ? (t / 0.2) * 0.6 : (1 - t) * 0.6;
        ghost.position.x += driftX * dt;
        ghost.position.y += driftY * dt * 0.1;
        ghost.rotation.y += 0.005;

        requestAnimationFrame(driftTick);
      }

      driftTick();
    },
  },

  {
    id: 'stars',
    name: 'STARFALL',
    play(scene) {
      const spheres = [];

      for (let i = 0; i < 50; i++) {
        const geo = new THREE.SphereGeometry(rand(0.05, 0.18), 8, 8);
        const mat = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          emissive: 0xdddddd,
          emissiveIntensity: 0.8,
        });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.set(rand(-9, 9), rand(8, 10), rand(-9, 9));
        sphere.userData.speed = rand(0.03, 0.1);
        sphere.userData.delay = rand(0, 1500);
        sphere.userData.active = false;
        sphere.visible = false;
        scene.add(sphere);
        spheres.push(sphere);
      }

      let active = true;
      const startTime = performance.now();
      let lastT = startTime;

      function fallTick() {
        if (!active) return;
        const now = performance.now();
        const dt = now - lastT;
        lastT = now;

        spheres.forEach((s) => {
          if (now - startTime > s.userData.delay) {
            s.visible = true;
            s.position.y -= s.userData.speed * dt * 0.08;
            if (s.position.y < -10) {
              s.position.y = rand(8, 10);
            }
          }
        });

        requestAnimationFrame(fallTick);
      }

      fallTick();

      setTimeout(() => {
        active = false;
        spheres.forEach((s) => scene.remove(s));
      }, 3500);
    },
  },

  {
    id: 'zoom',
    name: 'ZOOM',
    play(scene, camera) {
      const origFOV = camera.fov;

      animate(500, (t) => {
        camera.fov = lerp(origFOV, 15, easeInOut(t));
        camera.updateProjectionMatrix();
      }, () => {
        animate(500, (t) => {
          camera.fov = lerp(15, origFOV, easeInOut(t));
          camera.updateProjectionMatrix();
        });
      });
    },
  },

  {
    id: 'spin',
    name: 'SPINNING',
    play(scene, camera) {
      const origY = camera.rotation.y;
      animate(2000, (t) => {
        camera.rotation.y = origY + Math.PI * 2 * t;
      }, () => {
        camera.rotation.y = origY;
      });
    },
  },

  {
    id: 'fire',
    name: 'FIRE',
    play(scene) {
      const room = scene.getObjectByName('room');
      const ambient = scene.getObjectByName('ambientLight');
      if (!room) return;

      const origColor = room.material.color.clone();
      const origAmbientColor = ambient ? ambient.color.clone() : new THREE.Color(0xffffff);

      const fireColors = [0xff4400, 0xff6600, 0xff2200, 0xff8800, 0xdd2200];
      let active = true;
      let count = 0;

      function strobe() {
        if (!active) return;
        const fc = fireColors[count % fireColors.length];
        room.material.color.set(fc);
        if (ambient) ambient.color.set(fc);
        count++;
        setTimeout(strobe, 80);
      }

      strobe();

      setTimeout(() => {
        active = false;
        room.material.color.copy(origColor);
        if (ambient) ambient.color.copy(origAmbientColor);
      }, 1200);
    },
  },

  {
    id: 'message',
    name: 'A MESSAGE',
    play(scene, camera) {
      const messages = [
        'YOU WERE NEVER HERE',
        'DO NOT PRESS AGAIN',
        'IT IS WATCHING',
        'THE ROOM REMEMBERS',
        'WHAT ARE YOU DOING',
        'ALMOST THERE... OR NOT',
        'HELLO FROM THE OTHER SIDE',
        'STOP. PLEASE.',
        'THIS MEANS NOTHING',
        'OR DOES IT?',
        'THE BUTTON CHOSE YOU',
        'TICK TOCK',
        'SYSTEM ERROR 404: REALITY',
        'YOU CANNOT LEAVE',
        'KEEP GOING',
      ];

      const text = messages[Math.floor(Math.random() * messages.length)];

      // Create canvas texture for text
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 72px Courier New, monospace';
      ctx.fillStyle = 'rgba(20,20,20,1)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const geo = new THREE.PlaneGeometry(8, 2);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const sprite = new THREE.Mesh(geo, mat);
      // Position it in front of the camera, floating in room center
      sprite.position.set(0, 0, -4);
      // Make it face the camera by adding to camera's children
      camera.add(sprite);

      animate(400, (t) => {
        mat.opacity = t;
      }, () => {
        setTimeout(() => {
          animate(600, (t) => {
            mat.opacity = 1 - t;
          }, () => {
            camera.remove(sprite);
            texture.dispose();
          });
        }, 1800);
      });
    },
  },
  // ── 21. Alien ───────────────────────────────────────────────────────────────
  {
    id: 'alien',
    name: 'DO NOT GIVE IT THE DONUT',
    play(scene) {
      const g = new THREE.Group();
      const greenMat = new THREE.MeshLambertMaterial({ color: 0x44ff44, emissive: 0x224422, emissiveIntensity: 0.4 });

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), greenMat);
      g.add(head);

      // Big black eyes
      const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
      const eL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), eyeMat);
      eL.position.set(-0.28, 0.1, 0.68);
      const eR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), eyeMat);
      eR.position.set(0.28, 0.1, 0.68);
      g.add(eL, eR);

      // Antennae
      const antMat = new THREE.MeshLambertMaterial({ color: 0x44ff44 });
      const tipMat = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xaaaa00, emissiveIntensity: 0.6 });
      const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
      const antL = new THREE.Mesh(antGeo, antMat);
      antL.position.set(-0.28, 1.1, 0); antL.rotation.z = 0.35;
      const antR = new THREE.Mesh(antGeo, antMat);
      antR.position.set(0.28, 1.1, 0); antR.rotation.z = -0.35;
      g.add(antL, antR);
      const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), tipMat);
      tipL.position.set(-0.5, 1.46, 0);
      const tipR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), tipMat);
      tipR.position.set(0.5, 1.46, 0);
      g.add(tipL, tipR);

      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), greenMat);
      body.position.set(0, -1.1, 0); body.scale.set(1, 0.65, 1);
      g.add(body);

      // Glow
      const glow = new THREE.PointLight(0x44ff44, 1.5, 5);
      g.add(glow);

      g.position.set(-9, 1, 0);
      scene.add(g);

      animate(1400, (t) => {
        g.position.x = lerp(-9, -2, easeInOut(t));
        g.position.y = 1 + Math.sin(t * Math.PI * 3) * 0.4;
      }, () => {
        const bobStart = performance.now();
        let bobbing = true;
        function bob() {
          if (!bobbing) return;
          const bt = (performance.now() - bobStart) / 1000;
          g.position.y = 1 + Math.sin(bt * 3) * 0.5;
          g.rotation.y = Math.sin(bt * 1.5) * 0.3;
          requestAnimationFrame(bob);
        }
        bob();
        setTimeout(() => {
          bobbing = false;
          animate(900, (t) => { g.position.x = lerp(-2, -10, easeInOut(t)); }, () => scene.remove(g));
        }, 2500);
      });
    },
  },

  // ── 22. Cat explodes ────────────────────────────────────────────────────────
  {
    id: 'cat_explodes',
    name: 'CAT EXPLOSION',
    play(scene) {
      const g = new THREE.Group();
      const catMat = new THREE.MeshLambertMaterial({ color: 0xff8800 });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), catMat);
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 12), catMat);
      head.position.set(0, 0.88, 0);
      g.add(head);
      const earGeo = new THREE.ConeGeometry(0.14, 0.3, 8);
      const earL = new THREE.Mesh(earGeo, catMat);
      earL.position.set(-0.23, 1.35, 0); earL.rotation.z = -0.3;
      const earR = new THREE.Mesh(earGeo, catMat);
      earR.position.set(0.23, 1.35, 0); earR.rotation.z = 0.3;
      g.add(earL, earR);
      const eyeMat = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x008800 });
      const eL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
      eL.position.set(-0.15, 0.94, 0.41);
      const eR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
      eR.position.set(0.15, 0.94, 0.41);
      g.add(eL, eR);

      const spawnX = rand(-3, 3);
      const spawnZ = rand(-3, 0);
      g.position.set(spawnX, -8.5, spawnZ);
      scene.add(g);

      setTimeout(() => {
        scene.remove(g);
        // Flash
        const flash = new THREE.PointLight(0xff6600, 10, 14);
        flash.position.set(spawnX, -7.5, spawnZ);
        scene.add(flash);
        setTimeout(() => scene.remove(flash), 500);

        // Room flash orange
        const room = scene.getObjectByName('room');
        if (room) {
          const orig = room.material.color.clone();
          room.material.color.set(0xff4400);
          setTimeout(() => room.material.color.copy(orig), 200);
        }

        // Particles
        for (let i = 0; i < 22; i++) {
          const pGeo = new THREE.SphereGeometry(rand(0.07, 0.2), 6, 6);
          const pMat = new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(rand(0, 0.12), 1, 0.55) });
          const p = new THREE.Mesh(pGeo, pMat);
          p.position.set(spawnX, -7.5, spawnZ);
          const vx = rand(-5, 5), vy = rand(1, 6), vz = rand(-5, 5);
          scene.add(p);
          animate(900, (t) => {
            p.position.x = spawnX + vx * t;
            p.position.y = -7.5 + vy * t - 8 * t * t;
            p.position.z = spawnZ + vz * t;
            pMat.opacity = 1 - t;
            pMat.transparent = true;
          }, () => scene.remove(p));
        }
      }, 1000);
    },
  },

  // ── 23. Room flips (persistent until next button press) ─────────────────────
  {
    id: 'room_flips',
    name: 'THE ROOM HAS FLIPPED',
    play(scene, camera) {
      animate(900, (t) => {
        camera.rotation.z = lerp(0, Math.PI, easeInOut(t));
      }, () => {
        window._persistentCleanup = () => {
          animate(900, (t) => {
            camera.rotation.z = lerp(Math.PI, 0, easeInOut(t));
          });
        };
      });
    },
  },

  // ── 24. Pitch black — you are not alone ─────────────────────────────────────
  {
    id: 'not_alone',
    name: 'YOU ARE NOT ALONE',
    play(scene, camera) {
      const ambient = scene.getObjectByName('ambientLight');
      const ceiling = scene.getObjectByName('ceilingLight');
      const fill = scene.getObjectByName('fillLight');
      const origA = ambient ? ambient.intensity : 0.6;
      const origC = ceiling ? ceiling.intensity : 1.2;
      const origF = fill ? fill.intensity : 0.3;

      if (ambient) ambient.intensity = 0;
      if (ceiling) ceiling.intensity = 0;
      if (fill) fill.intensity = 0;

      // Button red glow
      const redGlow = new THREE.PointLight(0xff0000, 3.5, 14);
      redGlow.position.set(0, -7, 0);
      scene.add(redGlow);

      // Two white "eyes" in the far corner
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
      eye1.position.set(-8.6, 2.2, -8.6);
      const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
      eye2.position.set(-7.8, 2.2, -8.6);
      scene.add(eye1, eye2);
      const eyeGlow = new THREE.PointLight(0xffffff, 0.6, 2.5);
      eyeGlow.position.set(-8.2, 2.2, -8.6);
      scene.add(eyeGlow);

      // Camera text: "YOU ARE NOT ALONE"
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 58px Courier New';
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU ARE NOT ALONE', 512, 100);
      const tex = new THREE.CanvasTexture(canvas);
      const tMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      const tMesh = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.4), tMat);
      tMesh.position.set(0, -0.5, -5);
      camera.add(tMesh);

      animate(600, (t) => { tMat.opacity = t; });

      setTimeout(() => {
        animate(600, (t) => { tMat.opacity = 1 - t; }, () => {
          camera.remove(tMesh);
          tex.dispose();
          scene.remove(redGlow, eye1, eye2, eyeGlow);
          if (ambient) ambient.intensity = origA;
          if (ceiling) ceiling.intensity = origC;
          if (fill) fill.intensity = origF;
        });
      }, 3500);
    },
  },

  // ── 25. Taco rain ───────────────────────────────────────────────────────────
  {
    id: 'taco_rain',
    name: 'IT IS RAINING TACOS',
    play(scene) {
      const tacos = [];
      for (let i = 0; i < 28; i++) {
        const g = new THREE.Group();
        // Shell (open torus arc)
        const shellGeo = new THREE.TorusGeometry(0.38, 0.13, 8, 16, Math.PI);
        const shell = new THREE.Mesh(shellGeo, new THREE.MeshLambertMaterial({ color: 0xd4a04a }));
        g.add(shell);
        // Lettuce
        const lettuce = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 8),
          new THREE.MeshLambertMaterial({ color: 0x44aa22 })
        );
        lettuce.position.set(0, 0.08, 0); lettuce.scale.set(1, 0.35, 0.8);
        g.add(lettuce);
        // Meat
        const meat = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshLambertMaterial({ color: 0x883300 })
        );
        meat.position.set(0.05, 0.05, 0); meat.scale.set(1, 0.3, 0.7);
        g.add(meat);

        g.position.set(rand(-8, 8), rand(11, 16), rand(-8, 8));
        g.rotation.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));
        g.userData.vy = rand(-0.06, -0.12);
        g.userData.rx = rand(-0.02, 0.02);
        g.userData.rz = rand(-0.02, 0.02);
        scene.add(g);
        tacos.push(g);
      }

      let active = true;
      let lastT = performance.now();
      function fall() {
        if (!active) return;
        const now = performance.now();
        const dt = now - lastT; lastT = now;
        tacos.forEach(t => {
          t.position.y += t.userData.vy * dt * 0.12;
          t.rotation.x += t.userData.rx * dt * 0.1;
          t.rotation.z += t.userData.rz * dt * 0.1;
        });
        requestAnimationFrame(fall);
      }
      fall();
      setTimeout(() => { active = false; tacos.forEach(t => scene.remove(t)); }, 3500);
    },
  },

  // ── 26. Dancing man ─────────────────────────────────────────────────────────
  {
    id: 'dancing_man',
    name: 'GET DOWN',
    play(scene) {
      const mat = new THREE.LineBasicMaterial({ color: 0x111111 });
      const g = new THREE.Group();

      // Head circle
      const headPts = [];
      for (let i = 0; i <= 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        headPts.push(new THREE.Vector3(Math.cos(a) * 0.32, 2.1 + Math.sin(a) * 0.32, 0));
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(headPts), mat));

      // Body
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.78, 0), new THREE.Vector3(0, 0.55, 0),
      ]), mat));

      // Arms (stored for animation)
      const leftArmGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(-0.85, 1.0, 0),
      ]);
      const leftArm = new THREE.Line(leftArmGeo, mat);
      g.add(leftArm);

      const rightArmGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0.85, 1.0, 0),
      ]);
      const rightArm = new THREE.Line(rightArmGeo, mat);
      g.add(rightArm);

      // Legs (stored for animation)
      const leftLegGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(-0.55, -0.55, 0),
      ]);
      const leftLeg = new THREE.Line(leftLegGeo, mat);
      g.add(leftLeg);

      const rightLegGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.55, -0.55, 0),
      ]);
      const rightLeg = new THREE.Line(rightLegGeo, mat);
      g.add(rightLeg);

      g.position.set(rand(-3, 3), -8.2, rand(-3, -1));
      g.scale.setScalar(1.8);
      scene.add(g);

      let active = true;
      const t0 = performance.now();
      function dance() {
        if (!active) return;
        const t = (performance.now() - t0) / 1000;

        // Bob body
        g.position.y = -8.2 + Math.abs(Math.sin(t * 5)) * 0.6;

        // Swing arms
        const swing = Math.sin(t * 5) * 0.55;
        const laPos = leftArm.geometry.attributes.position;
        laPos.setXYZ(1, -0.85, 1.0 + swing, 0); laPos.needsUpdate = true;
        const raPos = rightArm.geometry.attributes.position;
        raPos.setXYZ(1, 0.85, 1.0 - swing, 0); raPos.needsUpdate = true;

        // Swing legs
        const lSwing = Math.sin(t * 5) * 0.4;
        const llPos = leftLeg.geometry.attributes.position;
        llPos.setXYZ(1, -0.55 + lSwing * 0.3, -0.55, 0); llPos.needsUpdate = true;
        const rlPos = rightLeg.geometry.attributes.position;
        rlPos.setXYZ(1, 0.55 - lSwing * 0.3, -0.55, 0); rlPos.needsUpdate = true;

        requestAnimationFrame(dance);
      }
      dance();
      setTimeout(() => { active = false; scene.remove(g); }, 3500);
    },
  },

  // ── 27. Ball flood ──────────────────────────────────────────────────────────
  {
    id: 'ball_flood',
    name: 'BALL PIT',
    play(scene) {
      const balls = [];
      for (let i = 0; i < 55; i++) {
        setTimeout(() => {
          const r = rand(0.22, 0.55);
          const ball = new THREE.Mesh(
            new THREE.SphereGeometry(r, 10, 10),
            new THREE.MeshLambertMaterial({ color: randomColor() })
          );
          ball.position.set(rand(-7, 7), 12, rand(-7, 7));
          ball.userData.vy = 0;
          ball.userData.floor = -9.5 + r;
          scene.add(ball);
          balls.push(ball);
        }, i * 70);
      }

      let active = true;
      let lastT = performance.now();
      function update() {
        if (!active) return;
        const now = performance.now();
        const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
        balls.forEach(b => {
          b.userData.vy -= 18 * dt;
          b.position.y += b.userData.vy * dt;
          if (b.position.y <= b.userData.floor) {
            b.position.y = b.userData.floor;
            b.userData.vy = Math.abs(b.userData.vy) * 0.45;
          }
        });
        requestAnimationFrame(update);
      }
      update();
      setTimeout(() => { active = false; balls.forEach(b => scene.remove(b)); }, 5500);
    },
  },

  // ── 28. Button moves (persistent until next button press) ───────────────────
  {
    id: 'button_moves',
    name: 'CATCH IT',
    play(scene) {
      const buttonGroup = scene.children.find(
        c => c.isGroup && c.children.some(ch => ch.name === 'redButton')
      );
      if (!buttonGroup) return;

      const origX = buttonGroup.position.x;
      const origZ = buttonGroup.position.z;
      let active = true;
      let interval;

      function scurry() {
        if (!active) return;
        const tx = rand(-5.5, 5.5);
        const tz = rand(-5.5, 5.5);
        const sx = buttonGroup.position.x;
        const sz = buttonGroup.position.z;
        animate(380, (t) => {
          buttonGroup.position.x = lerp(sx, tx, easeInOut(t));
          buttonGroup.position.z = lerp(sz, tz, easeInOut(t));
        });
      }

      scurry();
      interval = setInterval(scurry, 550);

      window._persistentCleanup = () => {
        active = false;
        clearInterval(interval);
        const cx = buttonGroup.position.x;
        const cz = buttonGroup.position.z;
        animate(500, (t) => {
          buttonGroup.position.x = lerp(cx, origX, easeInOut(t));
          buttonGroup.position.z = lerp(cz, origZ, easeInOut(t));
        });
      };
    },
  },

  // ── 29. Nothing happens ─────────────────────────────────────────────────────
  {
    id: 'nothing_happens',
    name: 'nothing happens.',
    play() { /* intentionally empty */ },
  },

  // ── 31. Cat and dog chase each other ────────────────────────────────────────
  {
    id: 'cat_dog_chase',
    name: 'FIGHT FIGHT FIGHT',
    play(scene) {
      const cat = makeCatMesh(); cat.scale.setScalar(1.4); scene.add(cat);
      const dog = makeDogMesh(); dog.scale.setScalar(1.4); scene.add(dog);
      let active = true;
      const t0 = performance.now();
      const radius = 5;
      function chase() {
        if (!active) return;
        const t = (performance.now() - t0) / 1000;
        const dogAngle = t * 2.2;
        dog.position.set(Math.cos(dogAngle) * radius, -8.5, Math.sin(dogAngle) * radius);
        dog.rotation.y = -dogAngle + Math.PI / 2;
        const catAngle = dogAngle - 0.9;
        cat.position.set(Math.cos(catAngle) * radius, -8.5, Math.sin(catAngle) * radius);
        cat.rotation.y = -catAngle + Math.PI / 2;
        requestAnimationFrame(chase);
      }
      chase();
      setTimeout(() => { active = false; scene.remove(cat, dog); }, 4000);
    },
  },

  // ── 32. Button says its name is Bob ─────────────────────────────────────────
  {
    id: 'button_is_bob',
    name: 'MY NAME IS BOB',
    play(scene, camera) {
      const txt = makeTextOnCamera(camera, 'MY NAME IS BOB.\nPLEASE BE NICER TO ME.', 0, { color: '#cc3300', fontSize: 46 });
      txt.fadeIn(400); txt.fadeOut(700, 3000);
      const buttonGroup = scene.children.find(c => c.isGroup && c.children.some(ch => ch.name === 'redButton'));
      if (!buttonGroup) return;
      let active = true; const t0 = performance.now();
      function wobble() {
        if (!active) return;
        buttonGroup.rotation.y = Math.sin((performance.now() - t0) / 1000 * 8) * 0.35;
        requestAnimationFrame(wobble);
      }
      wobble();
      setTimeout(() => { active = false; buttonGroup.rotation.y = 0; }, 3500);
    },
  },

  // ── 33. We shrink (persistent) ───────────────────────────────────────────────
  {
    id: 'we_shrink',
    name: 'EVERYTHING IS HUGE NOW',
    play(scene, camera) {
      const origY = camera.position.y;
      const origFov = camera.fov;
      animate(1200, t => {
        camera.position.y = lerp(origY, -7.5, easeInOut(t));
        camera.fov = lerp(origFov, 88, easeInOut(t));
        camera.updateProjectionMatrix();
      }, () => {
        window._persistentCleanup = () => {
          animate(900, t => {
            camera.position.y = lerp(-7.5, origY, easeInOut(t));
            camera.fov = lerp(88, origFov, easeInOut(t));
            camera.updateProjectionMatrix();
          });
        };
      });
    },
  },

  // ── 34. Alien steals donut ───────────────────────────────────────────────────
  {
    id: 'alien_steals_donut',
    name: 'HEY!!',
    play(scene, camera) {
      const donut = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.15, 8, 20),
        new THREE.MeshLambertMaterial({ color: 0xffaa44 })
      );
      donut.position.set(1.5, -6.8, 0);
      scene.add(donut);

      const ag = new THREE.Group();
      const gMat = new THREE.MeshLambertMaterial({ color: 0x44ff44, emissive: 0x224422, emissiveIntensity: 0.4 });
      ag.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 14), gMat));
      const eyeMat2 = new THREE.MeshLambertMaterial({ color: 0x000000 });
      [[-0.26, 0.1, 0.64], [0.26, 0.1, 0.64]].forEach(([x, y, z]) => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), eyeMat2); e.position.set(x, y, z); ag.add(e);
      });
      const ab = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), gMat);
      ab.position.set(0, -1.05, 0); ab.scale.set(1, 0.6, 1); ag.add(ab);
      ag.position.set(-9, 1, -3); ag.scale.setScalar(0.5);
      scene.add(ag);

      animate(1200, t => {
        ag.position.x = lerp(-9, 1, easeInOut(t));
        ag.position.z = lerp(-3, 5, easeInOut(t));
        ag.scale.setScalar(lerp(0.5, 2.5, easeInOut(t)));
      }, () => {
        scene.remove(donut);
        donut.position.set(0.5, 0.5, 0);
        ag.add(donut);
        setTimeout(() => {
          animate(900, t => {
            ag.position.x = lerp(1, 10, easeInOut(t));
            ag.scale.setScalar(lerp(2.5, 0.3, easeInOut(t)));
          }, () => {
            scene.remove(ag);
            const txt = makeTextOnCamera(camera, 'I TOLD YOU NOT TO GIVE HIM THE DONUT!!', 0, { color: '#cc0000', fontSize: 36 });
            txt.fadeIn(300); txt.fadeOut(700, 3000);
          });
        }, 300);
      });
    },
  },

  // ── 35. Pizza delivery ───────────────────────────────────────────────────────
  {
    id: 'pizza_delivery',
    name: 'PIZZA DELIVERY',
    play(scene, camera) {
      const { g: manG } = makeStickFigure();
      manG.scale.setScalar(1.7);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), new THREE.MeshLambertMaterial({ color: 0xcc8833 }));
      box.position.set(0.5, 1.6, 0); manG.add(box);
      manG.position.set(-10, -8.5, 0);
      scene.add(manG);
      animate(1500, t => { manG.position.x = lerp(-10, -1, easeInOut(t)); }, () => {
        const txt = makeTextOnCamera(camera, 'PIZZA DELIVERY!', 0.5, { color: '#cc4400', fontSize: 58 });
        txt.fadeIn(400); txt.fadeOut(400, 2500);
        setTimeout(() => {
          animate(1200, t => { manG.position.x = lerp(-1, 10, easeInOut(t)); }, () => scene.remove(manG));
        }, 2800);
      });
    },
  },

  // ── 36. Boxer punches you ────────────────────────────────────────────────────
  {
    id: 'boxer_punch',
    name: 'OW.',
    play(scene, camera) {
      const glove = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0xcc0000 })
      );
      glove.position.set(0, 0, -3); glove.scale.setScalar(0.1);
      camera.add(glove);
      animate(300, t => {
        glove.scale.setScalar(lerp(0.1, 9, easeInOut(t)));
        glove.position.z = lerp(-3, -0.4, easeInOut(t));
      }, () => {
        camera.remove(glove);
        const origPos = camera.position.clone();
        let count = 0;
        function shake() {
          camera.position.set(origPos.x + rand(-0.6, 0.6), origPos.y + rand(-0.4, 0.4), origPos.z + rand(-0.5, 0.5));
          if (++count < 28) requestAnimationFrame(shake);
          else camera.position.copy(origPos);
        }
        shake();
        const v = document.createElement('div');
        v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:30;background:radial-gradient(ellipse at center,transparent 35%,rgba(255,255,255,0.9) 100%);transition:opacity 0.1s;';
        document.body.appendChild(v);
        setTimeout(() => { v.style.transition = 'opacity 1.8s ease'; v.style.opacity = '0'; setTimeout(() => document.body.removeChild(v), 1900); }, 150);
      });
    },
  },

  // ── 37. Job application ──────────────────────────────────────────────────────
  {
    id: 'job_application',
    name: 'RUN.',
    play(scene, camera) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 640;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f5f0e0'; ctx.fillRect(0, 0, 512, 640);
      ctx.fillStyle = '#222'; ctx.textAlign = 'center';
      ctx.font = 'bold 30px Courier New'; ctx.fillText('JOB APPLICATION', 256, 55);
      ctx.font = '17px Courier New'; ctx.textAlign = 'left';
      ['Name: ___________________', 'Experience: _____________', 'Skills: _________________',
        'Why this job? ___________', '________________________', 'Are you a robot?  Y / N',
        '', 'Signature: ______________', '', '— BUTTON PRESSER WANTED —',
        'Must click 100 times.', 'Pay: nothing.', 'Benefits: none.', 'Start: immediately.'
      ].forEach((line, i) => ctx.fillText(line, 35, 95 + i * 34));
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 4.4), mat);
      mesh.position.set(0, 0, -4); camera.add(mesh);
      animate(400, t => { mat.opacity = t; });
      setTimeout(() => { animate(500, t => { mat.opacity = 1 - t; }, () => { camera.remove(mesh); tex.dispose(); }); }, 3500);
    },
  },

  // ── 38. Button turns blue ────────────────────────────────────────────────────
  {
    id: 'button_turns_blue',
    name: 'BOB IS FEELING BLUE',
    play(scene) {
      const btn = scene.getObjectByName('redButton');
      if (!btn) return;
      const origColor = btn.material.color.clone();
      const origEmissive = btn.material.emissive.clone();
      const blue = new THREE.Color(0x0055ff);
      const blueE = new THREE.Color(0x002299);
      animate(500, t => {
        btn.material.color.lerpColors(origColor, blue, easeInOut(t));
        btn.material.emissive.lerpColors(origEmissive, blueE, easeInOut(t));
      }, () => {
        setTimeout(() => {
          animate(500, t => {
            btn.material.color.lerpColors(blue, origColor, easeInOut(t));
            btn.material.emissive.lerpColors(blueE, origEmissive, easeInOut(t));
          });
        }, 2500);
      });
    },
  },

  // ── 39. You jump ─────────────────────────────────────────────────────────────
  {
    id: 'you_jump',
    name: 'BOING',
    play(scene, camera) {
      const origY = camera.position.y;
      animate(380, t => { camera.position.y = lerp(origY, origY + 7, easeInOut(t)); }, () => {
        animate(450, t => { camera.position.y = lerp(origY + 7, origY - 0.9, easeInOut(t)); }, () => {
          animate(180, t => { camera.position.y = lerp(origY - 0.9, origY + 1.4, easeInOut(t)); }, () => {
            animate(140, t => { camera.position.y = lerp(origY + 1.4, origY, easeInOut(t)); });
          });
        });
      });
    },
  },

  // ── 40. Microwave appears ────────────────────────────────────────────────────
  {
    id: 'microwave',
    name: 'WHAT IS THIS DOING HERE',
    play(scene, camera) {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.4), bodyMat));
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.05), new THREE.MeshLambertMaterial({ color: 0x888888 }));
      door.position.set(-0.25, 0, 0.73); g.add(door);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.05), new THREE.MeshLambertMaterial({ color: 0x333333 }));
      panel.position.set(0.65, 0, 0.73); g.add(panel);
      const display = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.05), new THREE.MeshLambertMaterial({ color: 0x00ff44, emissive: 0x00aa22, emissiveIntensity: 0.8 }));
      display.position.set(0.65, 0.22, 0.76); g.add(display);
      g.position.set(4, -8.5, -3);
      scene.add(g);
      const txt = makeTextOnCamera(camera, 'WHAT IS THIS DOING HERE', -1, { color: '#333333', fontSize: 48 });
      txt.fadeIn(400); txt.fadeOut(600, 3000);
      setTimeout(() => scene.remove(g), 6000);
    },
  },

  // ── 41. Timmy the mouse (stays until 100) ───────────────────────────────────
  {
    id: 'timmy',
    name: 'MEET TIMMY THE MOUSE',
    play(scene, camera) {
      if (window._timmyGroup) return; // already here
      const g = new THREE.Group();
      const grayMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), grayMat));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), grayMat);
      head.position.set(0, 0.65, 0.1); g.add(head);
      const earMat = new THREE.MeshLambertMaterial({ color: 0xbbaaaa });
      [[-0.28, 0.98], [0.28, 0.98]].forEach(([x, ey]) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), earMat);
        ear.position.set(x, ey, 0.1); ear.scale.z = 0.4; g.add(ear);
      });
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      [-0.14, 0.14].forEach(x => {
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 20), glassMat);
        lens.position.set(x, 0.67, 0.46); g.add(lens);
      });
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), glassMat);
      bridge.rotation.z = Math.PI / 2; bridge.position.set(0, 0.67, 0.46); g.add(bridge);
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.05), new THREE.MeshLambertMaterial({ color: 0x3355aa }));
      book.position.set(0.5, 0.1, 0.3); book.rotation.y = -0.4; g.add(book);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.8, 8), grayMat);
      tail.position.set(-0.3, -0.3, -0.4); tail.rotation.z = 0.8; tail.rotation.x = 0.5; g.add(tail);
      g.position.set(-8.5, -8.8, -8.5); g.rotation.y = Math.PI / 4; g.scale.setScalar(1.4);
      scene.add(g);
      window._timmyGroup = g;

      const txt = makeTextOnCamera(camera, 'CONGRATULATIONS! YOU HAVE CLICKED\nENOUGH TO MEET TIMMY THE MOUSE.', 0.5, { color: '#224488', fontSize: 38 });
      txt.fadeIn(400); txt.fadeOut(700, 4000);

      const t0 = performance.now();
      function timmyIdle() {
        if (!window._timmyGroup) return;
        const t = (performance.now() - t0) / 1000;
        g.position.y = -8.8 + Math.sin(t * 1.5) * 0.12;
        g.rotation.y = Math.PI / 4 + Math.sin(t * 0.8) * 0.15;
        requestAnimationFrame(timmyIdle);
      }
      timmyIdle();
    },
  },

  // ── 42. Pet rock Pig ─────────────────────────────────────────────────────────
  {
    id: 'pet_rock',
    name: 'IN LOVING MEMORY OF PIG',
    play(scene, camera) {
      const g = new THREE.Group();
      const rock = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshLambertMaterial({ color: 0x888077 }));
      rock.scale.set(1.2, 0.85, 1.0); g.add(rock);
      const bowMat = new THREE.MeshLambertMaterial({ color: 0xff66aa });
      const bowL = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 16, Math.PI), bowMat);
      bowL.position.set(-0.15, 0.52, 0); bowL.rotation.z = Math.PI / 4; g.add(bowL);
      const bowR = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 16, Math.PI), bowMat);
      bowR.position.set(0.15, 0.52, 0); bowR.rotation.z = -Math.PI / 4 + Math.PI; g.add(bowR);
      const bowC = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), bowMat);
      bowC.position.set(0, 0.52, 0); g.add(bowC);
      g.position.set(0, -8.5, -1.5);
      scene.add(g);
      const txt = makeTextOnCamera(camera, 'IN LOVING MEMORY OF PIG\nTHE PET ROCK  2019—2024', 0, { color: '#555555', fontSize: 42 });
      txt.fadeIn(500); txt.fadeOut(700, 4000);
      setTimeout(() => scene.remove(g), 6000);
    },
  },

  // ── 43. Two dancing men ──────────────────────────────────────────────────────
  {
    id: 'two_dancing_men',
    name: 'DANCE PARTY',
    play(scene) {
      const man1 = makeStickFigure(); man1.g.position.set(-2.5, -8.2, -1); man1.g.scale.setScalar(1.8);
      const man2 = makeStickFigure(); man2.g.position.set(2.5, -8.2, -1); man2.g.scale.setScalar(1.8);
      scene.add(man1.g, man2.g);
      let active = true; const t0 = performance.now();
      function dance() {
        if (!active) return;
        const t = (performance.now() - t0) / 1000;
        [[man1, 0], [man2, Math.PI]].forEach(([man, offset]) => {
          man.g.position.y = -8.2 + Math.abs(Math.sin(t * 5 + offset)) * 0.7;
          const sw = Math.sin(t * 5 + offset) * 0.6;
          const la = man.leftArm.geometry.attributes.position; la.setXYZ(1, -0.85, 1.0 + sw, 0); la.needsUpdate = true;
          const ra = man.rightArm.geometry.attributes.position; ra.setXYZ(1, 0.85, 1.0 - sw, 0); ra.needsUpdate = true;
          const ll = man.leftLeg.geometry.attributes.position; ll.setXYZ(1, -0.55 + sw * 0.4, -0.55, 0); ll.needsUpdate = true;
          const rl = man.rightLeg.geometry.attributes.position; rl.setXYZ(1, 0.55 - sw * 0.4, -0.55, 0); rl.needsUpdate = true;
        });
        requestAnimationFrame(dance);
      }
      dance();
      setTimeout(() => { active = false; scene.remove(man1.g, man2.g); }, 4000);
    },
  },

  // ── 44. Lucky number 44 ──────────────────────────────────────────────────────
  {
    id: 'lucky_44',
    name: '44 — YOUR LUCKY NUMBER',
    play(scene, camera) {
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          const spark = new THREE.Mesh(
            new THREE.SphereGeometry(rand(0.05, 0.15), 6, 6),
            new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xaa9900, emissiveIntensity: 0.9 })
          );
          spark.position.set(rand(-6, 6), 9.5, rand(-6, 6));
          scene.add(spark);
          animate(1600, t => { spark.position.y = lerp(9.5, -10, t); }, () => scene.remove(spark));
        }, i * 80);
      }
      const txt = makeTextOnCamera(camera, '44 — YOUR LUCKY NUMBER', 0, { color: '#aa8800', fontSize: 52 });
      txt.fadeIn(400); txt.fadeOut(700, 3000);
    },
  },

  // ── 45. Snow and snowman ─────────────────────────────────────────────────────
  {
    id: 'snow_and_snowman',
    name: 'LET IT SNOW',
    play(scene) {
      const flakes = [];
      for (let i = 0; i < 60; i++) {
        const f = new THREE.Mesh(
          new THREE.SphereGeometry(rand(0.04, 0.12), 6, 6),
          new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xaaaaff, emissiveIntensity: 0.5 })
        );
        f.position.set(rand(-9, 9), rand(10, 15), rand(-9, 9));
        f.userData.speed = rand(0.04, 0.09);
        scene.add(f); flakes.push(f);
      }
      const sg = new THREE.Group();
      const smat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      [0.8, 0.58, 0.4].forEach((r, i) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), smat);
        s.position.y = [0, 1.25, 2.25][i]; sg.add(s);
      });
      const eyeMat3 = new THREE.MeshLambertMaterial({ color: 0x111111 });
      [[-0.15, 2.35], [0.15, 2.35]].forEach(([x, y]) => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat3); e.position.set(x, y, 0.37); sg.add(e);
      });
      const nose2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), new THREE.MeshLambertMaterial({ color: 0xff6600 }));
      nose2.rotation.x = Math.PI / 2; nose2.position.set(0, 2.22, 0.48); sg.add(nose2);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.55, 12), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      hat.position.y = 2.72; sg.add(hat);
      sg.position.set(3, -9.3, -3); scene.add(sg);
      const ambient = scene.getObjectByName('ambientLight');
      const origAColor = ambient ? ambient.color.clone() : null;
      if (ambient) ambient.color.setRGB(0.7, 0.85, 1.0);
      let active = true; let lastT3 = performance.now();
      function fall() {
        if (!active) return;
        const now = performance.now(); const dt = now - lastT3; lastT3 = now;
        flakes.forEach(f => { f.position.y -= f.userData.speed * dt * 0.1; if (f.position.y < -10) f.position.y = 10; });
        requestAnimationFrame(fall);
      }
      fall();
      setTimeout(() => {
        active = false; flakes.forEach(f => scene.remove(f)); scene.remove(sg);
        if (ambient && origAColor) ambient.color.copy(origAColor);
      }, 5500);
    },
  },

  // ── 46. Cow appears ──────────────────────────────────────────────────────────
  {
    id: 'cow',
    name: 'MOOO',
    play(scene, camera) {
      const g = new THREE.Group();
      const cmat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), cmat);
      body.scale.set(1.8, 1.0, 1.0); g.add(body);
      const spotMat2 = new THREE.MeshLambertMaterial({ color: 0x222222 });
      [[-0.5, 0.4, 0.9], [0.4, -0.2, 0.92], [-0.1, 0.6, 0.93]].forEach(([x, y, z]) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), spotMat2);
        s.position.set(x, y, z); s.scale.z = 0.12; g.add(s);
      });
      const head2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), cmat);
      head2.position.set(1.55, 0.35, 0); head2.scale.set(1.1, 0.9, 0.9); g.add(head2);
      const snout2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), new THREE.MeshLambertMaterial({ color: 0xffbbaa }));
      snout2.position.set(2.05, 0.2, 0); snout2.scale.set(0.9, 0.65, 0.8); g.add(snout2);
      [0.28, -0.28].forEach(z => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), cmat);
        ear.position.set(1.45, 0.8, z); ear.scale.set(0.4, 0.8, 0.4); g.add(ear);
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 8), new THREE.MeshLambertMaterial({ color: 0xddcc88 }));
        horn.position.set(1.4, 1.05, z); horn.rotation.z = 0.4 * (z > 0 ? 1 : -1); g.add(horn);
      });
      [[-0.6, 0.5], [-0.6, -0.5], [0.6, 0.5], [0.6, -0.5]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.9, 8), cmat);
        leg.position.set(x, -1.1, z); g.add(leg);
      });
      g.position.set(10, -8.0, 1); g.rotation.y = Math.PI; scene.add(g);
      const txt = makeTextOnCamera(camera, 'MOOO', 0.5, { color: '#225500', fontSize: 72 });
      txt.fadeIn(300); txt.fadeOut(500, 2000);
      animate(2000, t => { g.position.x = lerp(10, -2, easeInOut(t)); }, () => {
        setTimeout(() => {
          animate(1500, t => { g.position.x = lerp(-2, -11, easeInOut(t)); }, () => scene.remove(g));
        }, 2500);
      });
    },
  },

  // ── 47. We grow (persistent) ─────────────────────────────────────────────────
  {
    id: 'we_grow',
    name: 'WE ARE GROWING',
    play(scene, camera) {
      const origY = camera.position.y;
      const origFov = camera.fov;
      animate(1200, t => {
        camera.position.y = lerp(origY, 6.5, easeInOut(t));
        camera.fov = lerp(origFov, 45, easeInOut(t));
        camera.updateProjectionMatrix();
      }, () => {
        window._persistentCleanup = () => {
          animate(900, t => {
            camera.position.y = lerp(6.5, origY, easeInOut(t));
            camera.fov = lerp(45, origFov, easeInOut(t));
            camera.updateProjectionMatrix();
          });
        };
      });
    },
  },

  // ── 48. We are getting closer ────────────────────────────────────────────────
  {
    id: 'getting_closer',
    name: 'WE ARE GETTING CLOSER',
    play(scene, camera) {
      const txt = makeTextOnCamera(camera, 'WE ARE GETTING CLOSER', 0, { color: '#550000', fontSize: 52 });
      txt.fadeIn(500); txt.fadeOut(700, 3000);
      const room = scene.getObjectByName('room');
      if (room) {
        const orig = room.material.color.clone();
        animate(3500, t => {
          const pulse = Math.sin(t * Math.PI) * 0.2;
          room.material.color.setRGB(1, 1 - pulse, 1 - pulse);
        }, () => { room.material.color.copy(orig); });
      }
    },
  },

  // ── 49. Flood with goldfish ──────────────────────────────────────────────────
  {
    id: 'flood_goldfish',
    name: 'THE FISH ARE FREE',
    play(scene) {
      const waterMat2 = new THREE.MeshLambertMaterial({ color: 0x1144ff, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const water2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), waterMat2);
      water2.rotation.x = -Math.PI / 2; water2.position.y = -10.5; scene.add(water2);
      const fish = [];
      for (let i = 0; i < 8; i++) {
        const fg = new THREE.Group();
        const fmat = new THREE.MeshLambertMaterial({ color: 0xff8822, emissive: 0x882200, emissiveIntensity: 0.3 });
        const fbody = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), fmat);
        fbody.scale.set(1.6, 0.8, 0.9); fg.add(fbody);
        const ftail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 8), fmat);
        ftail.position.set(-0.65, 0, 0); ftail.rotation.z = Math.PI / 2; fg.add(ftail);
        fg.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshLambertMaterial({ color: 0x000000 })), { position: new THREE.Vector3(0.42, 0.1, 0.22) }));
        fg.position.set(rand(-5, 5), -3, rand(-5, 5));
        fg.userData.speed = rand(0.02, 0.05); fg.userData.dir = Math.random() * Math.PI * 2;
        fg.userData.bobOffset = rand(0, Math.PI * 2); fg.visible = false;
        scene.add(fg); fish.push(fg);
      }
      let active2 = true; const t0f = performance.now(); let lastTf = t0f;
      animate(2500, t => {
        water2.position.y = lerp(-10.5, -2.5, easeInOut(t));
        waterMat2.opacity = lerp(0, 0.48, Math.min(t * 5, 1));
        if (t > 0.3) fish.forEach(f => { f.visible = true; });
      });
      function swimTick() {
        if (!active2) return;
        const now = performance.now(); const dt = (now - lastTf) / 1000; lastTf = now;
        const elapsed = (now - t0f) / 1000;
        fish.forEach(f => {
          f.userData.dir += rand(-0.04, 0.04);
          f.position.x += Math.cos(f.userData.dir) * f.userData.speed * dt * 60;
          f.position.z += Math.sin(f.userData.dir) * f.userData.speed * dt * 60;
          f.position.y = -3 + Math.sin(elapsed * 2 + f.userData.bobOffset) * 0.4;
          f.rotation.y = -f.userData.dir;
          if (Math.abs(f.position.x) > 8) f.userData.dir = Math.PI - f.userData.dir;
          if (Math.abs(f.position.z) > 8) f.userData.dir = -f.userData.dir;
        });
        requestAnimationFrame(swimTick);
      }
      swimTick();
      setTimeout(() => {
        animate(1500, t => {
          water2.position.y = lerp(-2.5, -10.5, easeInOut(t));
          waterMat2.opacity = lerp(0.48, 0, t);
        }, () => { active2 = false; scene.remove(water2); fish.forEach(f => scene.remove(f)); });
      }, 4500);
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeTextOnCamera(camera, text, y = 0, opts = {}) {
  const fontSize = opts.fontSize || 52;
  const color = opts.color || '#111111';
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 300;
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${fontSize}px Courier New, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  const lineH = fontSize + 10;
  lines.forEach((line, i) => ctx.fillText(line, 512, 150 + (i - (lines.length - 1) / 2) * lineH));
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.5), mat);
  mesh.position.set(0, y, -5);
  camera.add(mesh);
  return {
    mat,
    fadeIn(dur = 400) { animate(dur, t => { mat.opacity = t; }); },
    fadeOut(dur = 600, delay = 2000, cb) {
      setTimeout(() => animate(dur, t => { mat.opacity = 1 - t; }, () => { camera.remove(mesh); tex.dispose(); if (cb) cb(); }), delay);
    },
    remove() { camera.remove(mesh); tex.dispose(); },
  };
}

function makeCatMesh(color = 0xff8800) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), mat));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), mat);
  head.position.set(0, 0.75, 0); g.add(head);
  const earGeo = new THREE.ConeGeometry(0.13, 0.28, 8);
  [[-0.2, -0.3], [0.2, 0.3]].forEach(([x, rz]) => {
    const ear = new THREE.Mesh(earGeo, mat); ear.position.set(x, 1.2, 0); ear.rotation.z = rz; g.add(ear);
  });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x00cc00 });
  [[-0.13, 0.81], [0.13, 0.81]].forEach(([x, ey]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat); e.position.set(x, ey, 0.35); g.add(e);
  });
  return g;
}

function makeDogMesh(color = 0xc8a060) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), mat);
  body.scale.set(1.4, 0.85, 1); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), mat);
  head.position.set(0.65, 0.38, 0); g.add(head);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat);
  snout.position.set(0.95, 0.28, 0); snout.scale.set(1, 0.65, 0.8); g.add(snout);
  const earMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.65) });
  [0.3, -0.3].forEach(z => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), earMat);
    ear.position.set(0.52, 0.12, z); ear.scale.set(0.45, 0.75, 0.3); g.add(ear);
  });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.55, 8), mat);
  tail.position.set(-0.68, 0.38, 0); tail.rotation.z = -0.8; g.add(tail);
  return g;
}

function makeStickFigure() {
  const mat = new THREE.LineBasicMaterial({ color: 0x111111 });
  const g = new THREE.Group();
  const hPts = Array.from({ length: 21 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 0.32, 2.1 + Math.sin(a) * 0.32, 0);
  });
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPts), mat));
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.78, 0), new THREE.Vector3(0, 0.55, 0)]), mat));
  const leftArm = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(-0.85, 1.0, 0)]), mat);
  const rightArm = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0.85, 1.0, 0)]), mat);
  const leftLeg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(-0.55, -0.55, 0)]), mat);
  const rightLeg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0.55, -0.55, 0)]), mat);
  g.add(leftArm, rightArm, leftLeg, rightLeg);
  return { g, leftArm, rightArm, leftLeg, rightLeg };
}

// ─── 50-click milestone ───────────────────────────────────────────────────────
export const congrats50Event = {
  id: 'congratulations_50',
  name: 'CONGRATULATIONS ON 50 CLICKS!',
  play(scene, camera) {
    const room = scene.getObjectByName('room');
    const ambient = scene.getObjectByName('ambientLight');
    const origRoomColor = room ? room.material.color.clone() : null;
    const origAmbientColor = ambient ? ambient.color.clone() : null;
    const origAmbientInt = ambient ? ambient.intensity : 0.6;
    let active = true; let hue = 0;
    function flash() {
      if (!active) return;
      hue = (hue + 0.1) % 1;
      if (room) room.material.color.setHSL(hue, 0.9, 0.65);
      if (ambient) { ambient.color.setHSL((hue + 0.5) % 1, 0.9, 0.6); ambient.intensity = 1.8; }
      setTimeout(flash, 70);
    }
    flash();
    const cat = makeCatMesh(); cat.position.set(-3, -8.5, -2); scene.add(cat);
    const dog = makeDogMesh(); dog.position.set(3, -8.5, -2); scene.add(dog);
    const { g: manG, leftArm, rightArm, leftLeg, rightLeg } = makeStickFigure();
    manG.position.set(0, -8.2, -2); manG.scale.setScalar(1.5); scene.add(manG);
    const txt = makeTextOnCamera(camera, 'CONGRATULATIONS ON 50 CLICKS!', 1.2, { color: '#cc0000', fontSize: 44 });
    txt.fadeIn(400); txt.fadeOut(700, 4500);
    const t0 = performance.now();
    function tick() {
      if (!active) return;
      const t = (performance.now() - t0) / 1000;
      cat.position.y = -8.5 + Math.abs(Math.sin(t * 4)) * 1.4; cat.rotation.y = t * 3;
      dog.position.y = -8.5 + Math.abs(Math.sin(t * 4 + 1.1)) * 1.4; dog.rotation.y = -t * 3;
      manG.position.y = -8.2 + Math.abs(Math.sin(t * 5)) * 0.6;
      const sw = Math.sin(t * 5);
      const la = leftArm.geometry.attributes.position; la.setXYZ(1, -0.85, 1.0 + sw * 0.5, 0); la.needsUpdate = true;
      const ra = rightArm.geometry.attributes.position; ra.setXYZ(1, 0.85, 1.0 - sw * 0.5, 0); ra.needsUpdate = true;
      const ll = leftLeg.geometry.attributes.position; ll.setXYZ(1, -0.55 + sw * 0.3, -0.55, 0); ll.needsUpdate = true;
      const rl = rightLeg.geometry.attributes.position; rl.setXYZ(1, 0.55 - sw * 0.3, -0.55, 0); rl.needsUpdate = true;
      requestAnimationFrame(tick);
    }
    tick();
    setTimeout(() => {
      active = false;
      if (room && origRoomColor) room.material.color.copy(origRoomColor);
      if (ambient && origAmbientColor) { ambient.color.copy(origAmbientColor); ambient.intensity = origAmbientInt; }
      scene.remove(cat, dog, manG);
    }, 5500);
  },
};

export default events;
