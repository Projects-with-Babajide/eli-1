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
    play() {
      // intentionally empty
    },
  },
];

export default events;
