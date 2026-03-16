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
];

export default events;
