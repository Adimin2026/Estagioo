var Models = Models || {};

Models.createDetailedTree = function (opts) {
  opts = opts || {};
  var s = opts.scale || 1;
  var gr = new THREE.Group();

  // Trunk – tapered cylinder with slight twist
  var trunkH = (0.8 + Math.random() * 0.7) * s;
  var trunkR1 = 0.08 * s;
  var trunkR2 = 0.14 * s;
  var barkColor = [0x8B6914, 0x6B4914, 0x7B5924, 0x5B3910][Math.floor(Math.random() * 4)];
  var trunkMat = new THREE.MeshStandardMaterial({ color: barkColor, roughness: 0.9 });

  var trunkGeo = new THREE.CylinderGeometry(trunkR1 * 0.6, trunkR2, trunkH, 7, 3);
  var trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  gr.add(trunk);

  // Branches
  var branchCount = 2 + Math.floor(Math.random() * 3);
  for (var bi = 0; bi < branchCount; bi++) {
    var by = trunkH * (0.35 + bi * 0.18);
    var bLen = (0.15 + Math.random() * 0.2) * s;
    var bAngle = Math.random() * 6.28;
    var bUp = 0.3 + Math.random() * 0.4;
    var branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02 * s, 0.035 * s, bLen, 4),
      trunkMat
    );
    branch.position.set(Math.cos(bAngle) * 0.05 * s, by, Math.sin(bAngle) * 0.05 * s);
    branch.rotation.z = Math.cos(bAngle) * (1.2 - bUp);
    branch.rotation.x = Math.sin(bAngle) * (1.2 - bUp);
    branch.castShadow = true;
    gr.add(branch);

    // Leaf clump at branch tip
    var lc = [0x2d5a27, 0x3a7d44, 0x1e4d1e, 0x4a8c3f, 0x5a9c4f][Math.floor(Math.random() * 5)];
    var lMat = new THREE.MeshStandardMaterial({ color: lc, roughness: 0.7, flatShading: true });
    var clumpR = (0.12 + Math.random() * 0.12) * s;
    var clump = new THREE.Mesh(new THREE.SphereGeometry(clumpR, 5, 5), lMat);
    var tipX = Math.cos(bAngle) * bLen * 0.9;
    var tipZ = Math.sin(bAngle) * bLen * 0.9;
    clump.position.set(tipX + (Math.random() - 0.5) * 0.05, by + bLen * bUp * 0.7, tipZ + (Math.random() - 0.5) * 0.05);
    clump.scale.y = 0.7 + Math.random() * 0.3;
    clump.castShadow = true;
    gr.add(clump);
  }

  // Main canopy – multiple spheres
  var leafColors = [0x2d5a27, 0x3a7d44, 0x1e4d1e, 0x4a8c3f, 0x5a9c4f];
  var mainColor = leafColors[Math.floor(Math.random() * 5)];
  var accentColor = leafColors[Math.floor(Math.random() * 5)];
  var mainMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.7, flatShading: true });
  var accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.8, flatShading: true });

  var canopyRadius = (0.4 + Math.random() * 0.35) * s;
  var canopyBase = trunkH * 0.7;

  for (var ci = 0; ci < 5 + Math.floor(Math.random() * 4); ci++) {
    var a = Math.random() * 6.28;
    var r = Math.random() * canopyRadius * 0.7;
    var cr = (0.1 + Math.random() * 0.15) * s;
    var cy = canopyBase + Math.random() * canopyRadius * 0.6;
    var mat = Math.random() > 0.3 ? mainMat : accentMat;
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(cr, 6, 6), mat);
    sphere.position.set(
      Math.cos(a) * r,
      cy,
      Math.sin(a) * r
    );
    sphere.scale.y = 0.6 + Math.random() * 0.4;
    sphere.castShadow = true;
    gr.add(sphere);
  }

  // Top crown
  var top = new THREE.Mesh(new THREE.SphereGeometry(canopyRadius * 0.35, 6, 6), mainMat);
  top.position.y = trunkH + canopyRadius * 0.5;
  top.scale.y = 0.5;
  top.castShadow = true;
  gr.add(top);

  return gr;
};

Models.createCrystalOrb = function () {
  var gr = new THREE.Group();
  var crystalMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xFFA500,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 0.9
  });
  var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), crystalMat);
  crystal.castShadow = true;
  gr.add(crystal);

  // Inner glow core
  var coreMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    emissive: 0xFFDD44,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.6
  });
  var core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), coreMat);
  gr.add(core);

  // Outer glow aura (sprite)
  var glowCanvas = document.createElement('canvas');
  glowCanvas.width = 32; glowCanvas.height = 32;
  var gctx = glowCanvas.getContext('2d');
  var grad = gctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,220,100,0.6)');
  grad.addColorStop(0.3, 'rgba(255,200,50,0.3)');
  grad.addColorStop(1, 'rgba(255,200,50,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 32, 32);
  var glowTex = new THREE.CanvasTexture(glowCanvas);
  var glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  var glow = new THREE.Sprite(glowMat);
  glow.scale.set(1.2, 1.2, 1);
  gr.add(glow);

  // Hover animation data
  gr.userData = { floatPhase: Math.random() * 6.28, rotSpeed: 0.5 + Math.random() * 0.5 };
  return gr;
};

Models.createSlime = function (scale) {
  scale = scale || 1;
  var gr = new THREE.Group();
  var bodyColor = [0x44dd88, 0x66ddaa, 0x88ddaa, 0x55cc88][Math.floor(Math.random() * 4)];
  var bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.15,
    metalness: 0.0,
    emissive: bodyColor,
    emissiveIntensity: 0.05,
    transparent: true,
    opacity: 0.92
  });
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 14, 12), bodyMat);
  body.scale.y = 0.5;
  body.position.y = 0.15 * scale;
  body.castShadow = true;
  gr.add(body);

  // Eyes
  var eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0 });
  var pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0 });
  for (var ei = -1; ei <= 1; ei += 2) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 8, 8), eyeMat);
    eye.position.set(ei * 0.1 * scale, 0.22 * scale, 0.22 * scale);
    gr.add(eye);
    var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.025 * scale, 6, 6), pupilMat);
    pupil.position.set(ei * 0.1 * scale, 0.22 * scale, 0.26 * scale);
    gr.add(pupil);
  }

  gr.userData = { squishPhase: Math.random() * 6.28, speed: 1 + Math.random() };
  return gr;
};

Models.createButterfly = function () {
  var gr = new THREE.Group();
  var wingMat = new THREE.MeshStandardMaterial({
    color: [0xFF69B4, 0xFFA500, 0x87CEEB, 0xDDA0DD, 0x90EE90][Math.floor(Math.random() * 5)],
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 6), bodyMat);
  body.position.y = 0.04;
  gr.add(body);

  for (var si = -1; si <= 1; si += 2) {
    var wing = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), wingMat);
    wing.position.set(si * 0.07, 0.04, 0);
    wing.rotation.z = si * 0.3;
    gr.add(wing);
  }

  gr.userData = { wingPhase: Math.random() * 6.28 };
  return gr;
};

Models.createFlower = function () {
  var gr = new THREE.Group();
  var stemMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d });
  var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.15, 4), stemMat);
  stem.position.y = 0.075;
  gr.add(stem);

  var petalColor = [0xFF69B4, 0xFFD700, 0xFF6347, 0xDA70D6, 0xFF1493, 0xFFA500][Math.floor(Math.random() * 6)];
  var petalMat = new THREE.MeshStandardMaterial({ color: petalColor, side: THREE.DoubleSide });
  for (var pi = 0; pi < 5; pi++) {
    var a = (pi / 5) * 6.28;
    var petal = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), petalMat);
    petal.position.set(Math.cos(a) * 0.025, 0.16, Math.sin(a) * 0.025);
    petal.rotation.x = Math.sin(a) * 0.4;
    petal.rotation.z = Math.cos(a) * -0.4;
    gr.add(petal);
  }
  return gr;
};

Models.createLanternPost = function (scale) {
  scale = scale || 1;
  var gr = new THREE.Group();
  var postMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.3, roughness: 0.6 });
  var post = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.04 * scale, 0.8 * scale, 6), postMat);
  post.position.y = 0.4 * scale;
  post.castShadow = true;
  gr.add(post);

  var arm = new THREE.Mesh(new THREE.BoxGeometry(0.15 * scale, 0.02 * scale, 0.02 * scale), postMat);
  arm.position.set(0, 0.8 * scale, 0);
  gr.add(arm);

  var lampMat = new THREE.MeshStandardMaterial({
    color: 0xffdd44,
    emissive: 0xffaa00,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8
  });
  var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 8, 8), lampMat);
  lamp.position.set(0.12 * scale, 0.78 * scale, 0);
  gr.add(lamp);

  return gr;
};

// GLTF Model loader helper
Models.loadGLTF = function (url) {
  return new Promise (function (resolve, reject) {
    if (!THREE.GLTFLoader) {
      reject(new Error('GLTFLoader not loaded. Add GLTFLoader.js to your page.'));
      return;
    }
    var loader = new THREE.GLTFLoader();
    loader.load(url, function (gltf) {
      resolve(gltf.scene);
    }, undefined, reject);
  });
};

// Preload cache for downloaded models
Models.cache = {};
Models.preload = function (urls) {
  var keys = Object.keys(urls);
  var promises = [];
  keys.forEach(function (key) {
    var p = Models.loadGLTF(urls[key]).then(function (scene) {
      Models.cache[key] = scene;
    }).catch(function () {
      // per-model failure is OK — procedural fallback will be used
    });
    promises.push(p);
  });
  // Always resolve so the game starts even if every model fails
  return Promise.all(promises);
};
