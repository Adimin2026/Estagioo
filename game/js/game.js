// ===== CONFIG =====
var CFG = {
  mode: 'free', total: 15, timerMax: 180, sensitivity: 10,
  volume: 0.5, musicVol: 0.3, soundOn: true, musicOn: true
};
try {
  var saved = localStorage.getItem('sim3d_cfg');
  if (saved) { var p = JSON.parse(saved); for (var k in p) CFG[k] = p[k]; }
} catch(e) {}

// ===== STATE =====
var scene, camera, renderer, clock, vel, dir, euler;
var keys = { w: false, a: false, s: false, d: false, f: false, space: false, shift: false, e: false, b: false, p: false };
var locked = false, started = false, ended = false, paused = false;
var score = 0, time = 0, timer = 180, timerOn = false, fps = 60;
var orbs = [], trees = [], grasses = [], clouds = [], rng = 42;
var nearStarDist = 0, powerupActive = '', powerupTime = 0;
var targetHeight = 1.7, currentHeight = 1.7;
var grounded = true, jumpVel = 0, jumpCount = 0, maxJumps = 1;
var stamina = 100, sprinting = false;
var combo = 0, comboTimer = 0, comboCount = 0, comboElapsed = 0;
var dashTimer = 0, dashCooldown = 0, dashDir = null;
var dashKeyTime = { w: 0, a: 0, s: 0, d: 0 };
var invincible = 0;
var slimes = [], animals = [];
var interactHint = '', interactTimer = 0;
var totalStarsEver = 0;
try { var tse = localStorage.getItem('sim3d_total'); if (tse) totalStarsEver = parseInt(tse); } catch(e) {}
var upgrades = { jumpBonus: 0, staminaBonus: 0, speedBonus: 0, magnetPerm: false };
try { var u = localStorage.getItem('sim3d_upg'); if (u) upgrades = JSON.parse(u); } catch(e) {}
var playerArms = null;

// Day/Night cycle
var dayTime = 0.35;
var daySpeed = 1 / 240;
var sunLight = null, hemiLight = null, ambLight = null, skyMat = null;

// Weather
var weather = 'clear';
var weatherTimer = 60 + rr(0, 30);
var rainDrops = [], rainTotal = 400;
var lightningFlash = 0, lightningTimer = 20 + rr(0, 15);

// River & bridges
var riverMeshes = [], bridgeMeshes = [];
var achievements = {};
try {
  var a = localStorage.getItem('sim3d_ach');
  if (a) achievements = JSON.parse(a);
} catch(e) {}
try {
  var c = localStorage.getItem('sim3d_collected');
  if (c) { var cc = parseInt(c); if (cc > score) score = cc; }
} catch(e) {}

// ===== DOM REFS =====
var $ = function(id) { return document.getElementById(id); };
var menu = $('menu-screen'), startOv = $('start-overlay'), hud = $('hud');
var winOv = $('win-overlay'), loseOv = $('lose-overlay');
var pauseMenu = $('pause-menu'), achPopup = $('achievement-popup');
var scoreEl = $('score'), timerEl = $('timer'), fpsEl = $('fps-counter');
var distEl = $('hud-distance'), compass = $('compass-arrow');
var hintEl = $('hud-hint'), powerupEl = $('powerup-indicator');
var startName = $('start-mode-name'), startDesc = $('start-mode-desc');
var sensInp = $('setting-sensitivity'), sensVal = $('setting-sensitivity-val');
var volInp = $('setting-volume'), volVal = $('setting-volume-val');
var musicInp = $('setting-music'), musicVal = $('setting-music-val');
var staminaEl = $('stamina-bar-fill'), staminaText = $('stamina-text');
var comboEl = $('combo-display'), dashEl = $('dash-indicator');
var interactEl = $('interact-hint');

// ===== PROTOCOL CHECK =====
if (location.protocol === 'file:') {
  document.getElementById('game-container').innerHTML =
    '<div style="color:#fff;padding:60px 20px;text-align:center;font-size:18px;font-family:sans-serif;background:#111;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
    '<div style="font-size:48px;margin-bottom:16px">&#9888;</div>' +
    '<h2 style="color:#FFD700;margin-bottom:12px">Abra pelo servidor local</h2>' +
    '<p style="max-width:400px;line-height:1.6">Este jogo precisa ser servido via HTTP para carregar os modelos 3D.</p>' +
    '<p style="max-width:400px;line-height:1.6">No terminal, execute <code style="background:#333;padding:2px 8px;border-radius:4px">npm run dev</code> na raiz do projeto e acesse a página normalmente.</p>' +
    '<a href="../index.html" style="margin-top:20px;display:inline-block;padding:12px 24px;background:#FFD700;color:#000;text-decoration:none;border-radius:8px;font-weight:700">Voltar ao Portal</a>' +
    '</div>';
}

// ===== AUDIO =====
var actx = null;
function initAudio() {
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
}
function playTone(freq, dur, vol, type) {
  if (!actx || !CFG.soundOn || CFG.volume <= 0) return;
  try {
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol * CFG.volume * 0.3, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch(e) {}
}
function playCollect() { playTone(880, 0.1, 1, 'sine'); setTimeout(function() { playTone(1100, 0.15, 0.8, 'sine'); }, 80); }
function playPowerup() { playTone(440, 0.15, 1, 'triangle'); setTimeout(function() { playTone(660, 0.2, 0.8, 'triangle'); }, 120); }
function playAchieve() {
  [0,100,200,300,400].forEach(function(d,i) {
    setTimeout(function() { playTone(660 + i * 110, 0.2, 0.7, 'sine'); }, d);
  });
}
function playClick() { playTone(600, 0.05, 0.5, 'square'); }
function playMenuOpen() { playTone(400, 0.1, 0.5, 'triangle'); setTimeout(function() { playTone(500, 0.1, 0.5, 'triangle'); }, 80); }

// ===== RNG =====
function sr() { rng = (rng * 16807) % 2147483647; return (rng - 1) / 2147483646; }
function rr(a, b) { return a + sr() * (b - a); }
function ri(a, b) { return Math.floor(rr(a, b + 1)); }

// ===== UTILS =====
function dist(x1, z1, x2, z2) { return Math.sqrt((x1-x2)*(x1-x2) + (z1-z2)*(z1-z2)); }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function saveCfg() {
  try { localStorage.setItem('sim3d_cfg', JSON.stringify({ sensitivity: CFG.sensitivity, volume: CFG.volume, musicVol: CFG.musicVol })); } catch(e) {}
}

// ===== TERRAIN HEIGHT =====
function getHeight(x, z) {
  var d = Math.sqrt(x * x + z * z);
  var edge = Math.min(d / 100, 1) * 0.6;
  var h = edge;
  h += Math.sin(x * 0.04 + z * 0.035) * 0.6;
  h += Math.sin(x * 0.09 - z * 0.06) * 0.35;
  h += Math.cos(x * 0.13 + z * 0.11) * 0.2;
  h += Math.sin(x * 0.025 + z * 0.07) * 0.25;
  h += Math.sin(x * 0.18 + z * 0.22) * 0.1;
  return Math.max(0.05, h);
}

// ===== ACHIEVEMENTS =====
function unlockAch(id, name) {
  if (achievements[id]) return;
  achievements[id] = true;
  try { localStorage.setItem('sim3d_ach', JSON.stringify(achievements)); } catch(e) {}
  playAchieve();
  $('achievement-desc').textContent = name;
  achPopup.style.display = 'flex';
  achPopup.className = 'ach-show';
  setTimeout(function() { achPopup.className = ''; setTimeout(function() { achPopup.style.display = 'none'; }, 400); }, 3000);
}
function countAch() { var n = 0; for (var k in achievements) if (achievements[k]) n++; return n; }

// ===== MENU EVENTS =====
document.querySelectorAll('.mode-btn').forEach(function(b) {
  b.addEventListener('click', function() {
    if (typeof THREE === 'undefined') return;
    CFG.mode = this.dataset.mode;
    menu.style.display = 'none';
    playClick();
    setTimeout(startGame, 100);
  });
});

// ===== SETTINGS =====
sensInp.addEventListener('input', function() { CFG.sensitivity = parseInt(this.value); sensVal.textContent = this.value; saveCfg(); });
volInp.addEventListener('input', function() { CFG.volume = parseInt(this.value) / 100; volVal.textContent = this.value + '%'; saveCfg(); });
musicInp.addEventListener('input', function() { CFG.musicVol = parseInt(this.value) / 100; musicVal.textContent = this.value + '%'; saveCfg(); });
$('btn-settings-toggle').addEventListener('click', function() {
  var p = $('settings-panel');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
  sensInp.value = CFG.sensitivity; sensVal.textContent = CFG.sensitivity;
  volInp.value = CFG.volume * 100; volVal.textContent = Math.round(CFG.volume * 100) + '%';
  musicInp.value = CFG.musicVol * 100; musicVal.textContent = Math.round(CFG.musicVol * 100) + '%';
  playClick();
});
$('btn-resume').addEventListener('click', function() { togglePause(); playClick(); });
$('btn-quit').addEventListener('click', function() { location.reload(); });
$('btn-fullscreen').addEventListener('click', function() { toggleFullscreen(); });

// ===== FULLSCREEN =====
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function(){});
  } else {
    document.exitFullscreen().catch(function(){});
  }
}

// ===== PAUSE =====
function togglePause() {
  if (ended || !started) return;
  paused = !paused;
  pauseMenu.style.display = paused ? 'flex' : 'none';
  if (paused && document.pointerLockElement) document.exitPointerLock();
  if (!paused && locked) renderer.domElement.requestPointerLock();
  if (!paused) playMenuOpen();
}

// ===== GRASS TEXTURE =====
var grassTexCache = null;
function getGrassTexture() {
  if (grassTexCache) return grassTexCache;
  var canvas = document.createElement('canvas');
  canvas.width = 16; canvas.height = 32;
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(8, 32);
  ctx.quadraticCurveTo(2, 16, 8, -2);
  ctx.quadraticCurveTo(14, 16, 8, 32);
  ctx.fillStyle = '#4a9c4a';
  ctx.fill();
  grassTexCache = new THREE.CanvasTexture(canvas);
  return grassTexCache;
}

// ===== FIRST PERSON ARMS =====
function createArms() {
  var grp = new THREE.Group();
  var skin = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.8 });
  var shirt = new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.7 });
  var handMat = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.7 });

  // Left arm (upper)
  var lu = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.22, 6), shirt);
  lu.position.set(-0.22, -0.12, -0.15);
  lu.rotation.z = 0.35; lu.rotation.x = -0.6;
  grp.add(lu);
  // Left forearm
  var lf = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 6), skin);
  lf.position.set(-0.27, -0.3, -0.08);
  lf.rotation.z = 0.15;
  grp.add(lf);
  // Left hand
  var lh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), handMat);
  lh.position.set(-0.3, -0.42, -0.06);
  grp.add(lh);

  // Right arm (upper)
  var ru = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.22, 6), shirt);
  ru.position.set(0.22, -0.12, -0.15);
  ru.rotation.z = -0.35; ru.rotation.x = -0.6;
  grp.add(ru);
  // Right forearm
  var rf = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 6), skin);
  rf.position.set(0.27, -0.3, -0.08);
  rf.rotation.z = -0.15;
  grp.add(rf);
  // Right hand
  var rh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), handMat);
  rh.position.set(0.3, -0.42, -0.06);
  grp.add(rh);

  // Gold orb in right hand (collect hint)
  var orbHint = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFA500, emissiveIntensity: 0.3 }));
  orbHint.position.set(0.33, -0.42, -0.06);
  grp.add(orbHint);

  grp.position.set(0, -0.2, -0.4);
  grp.userData = { swing: 0 };
  camera.add(grp);
  return grp;
}

// ===== START GAME =====
function startGame() {
  try {
    if (!actx) initAudio();
    var w = window.innerWidth, h = window.innerHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 400);
    camera.position.set(0, 1.7, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = 4;
    renderer.toneMappingExposure = 1;
    $('game-container').appendChild(renderer.domElement);
    clock = new THREE.Clock();
    vel = new THREE.Vector3();
    dir = new THREE.Vector3();
    euler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Show loading
    var loadingEl = document.createElement('div');
    loadingEl.id = 'loading-models';
    loadingEl.style.cssText = 'position:absolute;bottom:30px;left:50%;transform:translateX(-50%);color:#FFD700;font-size:14px;font-family:sans-serif;text-shadow:0 0 10px rgba(0,0,0,0.5)';
    loadingEl.textContent = 'Carregando modelos...';
    $('game-container').appendChild(loadingEl);

    Models.preload({
      orb: 'models/crystal-cluster.glb',
      enemy: 'models/scifi-drone.glb',
      column: 'models/column.glb',
      machine: 'models/scifi-machine.glb',
      platform: 'models/platform.glb'
    }).then(function () {
      if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      buildWorld();
      setupLights();
      setupControls();
      playerArms = createArms();

      var names = { free: 'Exploração Livre', night: 'Modo Noturno', time: 'Corrida contra o Tempo' };
      var descs = { free: 'Colete todas as 15 estrelas sem pressão!', night: 'Mundo escuro. As estrelas brilham mais!', time: 'Você tem 3 minutos!' };
      startName.innerHTML = names[CFG.mode];
      startDesc.innerHTML = descs[CFG.mode];
      startOv.style.display = 'flex';
      if (CFG.mode === 'time') { timer = CFG.timerMax; timerOn = true; timerEl.style.display = 'inline'; }
      scoreEl.innerHTML = '&#11088; ' + score + '/' + CFG.total;
      updateAchDisplay();
      animate();
      setTimeout(function() { hintEl.style.opacity = 0; }, 5000);
    }).catch(function () {
      if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      buildWorld();
      setupLights();
      setupControls();
      playerArms = createArms();
      var names = { free: 'Exploração Livre', night: 'Modo Noturno', time: 'Corrida contra o Tempo' };
      var descs = { free: 'Colete todas as 15 estrelas sem pressão!', night: 'Mundo escuro. As estrelas brilham mais!', time: 'Você tem 3 minutos!' };
      startName.innerHTML = names[CFG.mode];
      startDesc.innerHTML = descs[CFG.mode];
      startOv.style.display = 'flex';
      if (CFG.mode === 'time') { timer = CFG.timerMax; timerOn = true; timerEl.style.display = 'inline'; }
      scoreEl.innerHTML = '&#11088; ' + score + '/' + CFG.total;
      updateAchDisplay();
      animate();
      setTimeout(function() { hintEl.style.opacity = 0; }, 5000);
    });
  } catch (e) {
    $('game-container').innerHTML = '<div style="color:#f44;padding:40px;text-align:center;font-size:16px">Erro: ' + e.message +
      '<br><br><button onclick="location.reload()" style="padding:10px 24px;background:#FFD700;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer">Tentar novamente</button></div>';
  }
}

// ===== BUILD WORLD =====
var waterMesh = null;
var waterVerts = null;
var fireflies = [];
function buildWorld() {
  var bgColor = CFG.mode === 'night' ? 0x0a0a2e : 0x7ec8e3;
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.Fog(bgColor, 120, 280);

  // ---- SKY GRADIENT SPHERE ----
  (function() {
    var skyGeo = new THREE.SphereGeometry(350, 32, 32);
    skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(CFG.mode === 'night' ? 0x000033 : 0x0066ff) },
        midColor: { value: new THREE.Color(CFG.mode === 'night' ? 0x0a0a2e : 0x4499ee) },
        botColor: { value: new THREE.Color(CFG.mode === 'night' ? 0x1a1a3a : 0xeeccaa) },
        offset: { value: 20 },
        exponent: { value: 0.6 }
      },
      vertexShader: [
        'varying vec3 vWP;',
        'void main(){',
        '  vec4 wp = modelMatrix * vec4(position,1.0);',
        '  vWP = wp.xyz;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 topColor;',
        'uniform vec3 midColor;',
        'uniform vec3 botColor;',
        'uniform float offset;',
        'uniform float exponent;',
        'varying vec3 vWP;',
        'void main(){',
        '  float h = normalize(vWP + offset).y;',
        '  vec3 col;',
        '  if(h > 0.3) col = mix(midColor, topColor, (h-0.3)/0.7);',
        '  else col = mix(botColor, midColor, h/0.3);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    var sky = new THREE.Mesh(skyGeo, skyMat);
    sky.renderOrder = -100;
    scene.add(sky);
  })();

  grasses = []; slimes = []; animals = []; clouds = []; fireflies = []; waterMesh = null;

  // ---- CLOUDS ----
  (function() {
    var cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 1, metalness: 0, depthWrite: false });
    var isNight = CFG.mode === 'night';
    var clr = isNight ? 0x333355 : 0xffffff;
    var cloudMat2 = new THREE.MeshStandardMaterial({ color: clr, transparent: true, opacity: isNight ? 0.25 : 0.5, roughness: 1, metalness: 0, depthWrite: false });
    for (var ci = 0; ci < 18; ci++) {
      var gr = new THREE.Group();
      var cx = rr(-180, 180), cz = rr(-180, 180), cy = 25 + rr(0, 10);
      var s = 4 + rr(0, 8);
      var offs = [
        [0,0,0,1],[0.7*s,0.08*s,0.25*s,0.7],[-0.6*s,0.04*s,-0.15*s,0.6],
        [0.25*s,0.12*s,-0.4*s,0.5],[-0.2*s,-0.04*s,0.5*s,0.45],[0.4*s,-0.08*s,-0.25*s,0.4]
      ];
      offs.forEach(function(o) {
        var sp = new THREE.Mesh(new THREE.SphereGeometry(o[3]*s*0.4, 7, 7), ci % 3 === 0 ? cloudMat : cloudMat2);
        sp.position.set(o[0], o[1], o[2]);
        gr.add(sp);
      });
      gr.position.set(cx, cy, cz);
      gr.userData = { driftX: rr(-0.2, 0.2), driftZ: rr(-0.2, 0.2) };
      scene.add(gr);
      clouds.push(gr);
    }
  })();

  // ---- TERRAIN WITH HEIGHT ----
  var gs = 300, segs = 100;
  var tGeo = new THREE.PlaneGeometry(gs, gs, segs, segs);
  tGeo.rotateX(-Math.PI / 2);
  var pos = tGeo.attributes.position.array;
  var cols = new Float32Array(pos.length);
  var minH = Infinity, maxH = -Infinity;
  for (var i = 0; i < pos.length; i += 3) {
    var h = getHeight(pos[i], pos[i + 2]);
    pos[i + 1] = h;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }
  for (i = 0; i < pos.length; i += 3) {
    var t = clamp((pos[i + 1] - minH) / (maxH - minH + 0.001), 0, 1);
    var g = 0.25 + t * 0.25;
    cols[i] = 0.15 + t * 0.4;
    cols[i + 1] = g + t * 0.1;
    cols[i + 2] = 0.08 + t * 0.12;
  }
  tGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  tGeo.computeVertexNormals();
  var groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  var ground = new THREE.Mesh(tGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- WATER ----
  (function() {
    var ws = 30, wSegs = 30;
    var wGeo = new THREE.PlaneGeometry(ws, ws, wSegs, wSegs);
    wGeo.rotateX(-Math.PI / 2);
    wGeo.translate(0, 0.5, 0);
    var wPos = wGeo.attributes.position.array;
    var wColors = new Float32Array(wPos.length);
    for (i = 0; i < wPos.length; i += 3) {
      wColors[i] = 0.1; wColors[i + 1] = 0.3; wColors[i + 2] = 0.6;
    }
    wGeo.setAttribute('color', new THREE.BufferAttribute(wColors, 3));
    var wMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      roughness: 0.05,
      metalness: 0.3,
      envMapIntensity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    waterMesh = new THREE.Mesh(wGeo, wMat);
    waterMesh.position.set(0, minH + 0.5, 0);
    waterMesh.renderOrder = 1;
    scene.add(waterMesh);
    waterVerts = wGeo.attributes.position;
  })();

  // ---- MOUNTAINS (background edge) ----
  (function() {
    var mMat = new THREE.MeshStandardMaterial({ color: 0x4a6a5a, roughness: 0.95, flatShading: true, vertexColors: false });
    var mMat2 = new THREE.MeshStandardMaterial({ color: 0x3a5a4a, roughness: 0.95, flatShading: true });
    for (var mi = 0; mi < 28; mi++) {
      var ang = rr(0, 6.28);
      var rad = 110 + rr(0, 25);
      var mx = Math.cos(ang) * rad;
      var mz = Math.sin(ang) * rad;
      var mh = 12 + rr(0, 18);
      var mRad = 6 + rr(0, 6);
      var m = new THREE.Mesh(new THREE.ConeGeometry(mRad, mh, ri(6, 9)), mi % 2 === 0 ? mMat : mMat2);
      m.position.set(mx, getHeight(mx, mz), mz);
      m.castShadow = true;
      scene.add(m);
      if (mi % 3 === 0) {
        var small = new THREE.Mesh(new THREE.ConeGeometry(mRad * 0.6, mh * 0.5, ri(5, 7)), mMat2);
        small.position.set(mx + rr(-6, 6), getHeight(mx, mz), mz + rr(-6, 6));
        small.castShadow = true;
        scene.add(small);
      }
    }
  })();

  // ---- RIVER + BRIDGES ----
  if (CFG.mode !== 'night') {
    (function() {
      var rSegs = 20, rWidth = 2;
      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-90, 0, -30),
        new THREE.Vector3(-50, 0, -20),
        new THREE.Vector3(-20, 0, -10),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(20, 0, 10),
        new THREE.Vector3(50, 0, 20),
        new THREE.Vector3(90, 0, 30)
      ]);
      var rMat = new THREE.MeshPhysicalMaterial({
        color: 0x3388cc, transparent: true, opacity: 0.5,
        roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false
      });
      for (var ri = 0; ri < rSegs; ri++) {
        var t = ri / (rSegs - 1);
        var p1 = curve.getPoint(t);
        var p2 = curve.getPoint(Math.min(t + 0.001, 1));
        var ang = Math.atan2(p2.z - p1.z, p2.x - p1.x);
        var seg = new THREE.Mesh(new THREE.PlaneGeometry(rWidth, 3), rMat);
        seg.rotation.x = -Math.PI / 2;
        seg.position.set(p1.x, 0.15, p1.z);
        seg.rotation.z = -ang;
        seg.renderOrder = 1;
        scene.add(seg);
        riverMeshes.push(seg);
      }
      // Bridges
      var bPositions = [0.2, 0.5, 0.8];
      var bMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 });
      var bMat2 = new THREE.MeshStandardMaterial({ color: 0x6B4914, roughness: 0.9 });
      bPositions.forEach(function(bt) {
        var bp = curve.getPoint(bt);
        var bNext = curve.getPoint(Math.min(bt + 0.02, 1));
        var bAngle = Math.atan2(bNext.z - bp.z, bNext.x - bp.x);
        var bg = new THREE.Group();
        for (var bi = 0; bi < 6; bi++) {
          var plank = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 1.5), bi % 2 === 0 ? bMat : bMat2);
          plank.position.set(-0.6 + bi * 0.25, 0.1, 0);
          bg.add(plank);
        }
        // Railings
        var railMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8 });
        for (var ri2 = 0; ri2 < 2; ri2++) {
          var rail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.04), railMat);
          rail.position.set(0, 0.25, ri2 === 0 ? -0.7 : 0.7);
          bg.add(rail);
        }
        bg.position.set(bp.x, 0.3, bp.z);
        bg.rotation.y = -bAngle;
        scene.add(bg);
        bridgeMeshes.push(bg);
      });
    })();
  }

  // ---- OBJECT PLACEMENT ----
  var placed = [];
  function canPlace(x, z, d) {
    for (var pi = 0; pi < placed.length; pi++) {
      var dx = placed[pi][0] - x, dz = placed[pi][1] - z;
      if (dx * dx + dz * dz < d * d) return false;
    }
    return true;
  }
  trees = [];

  // ---- IMPROVED TREES (multi-layer canopy) ----
  for (var ti = 0; ti < 180; ti++) {
    var tx = rr(-85, 85), tz = rr(-85, 85);
    if (tx * tx + tz * tz < 30) continue;
    if (!canPlace(tx, tz, 1.8)) continue;
    placed.push([tx, tz]);
    var gr = Models.createDetailedTree({ scale: 1.0 + rr(0, 1.8) });
    gr.position.set(tx, getHeight(tx, tz), tz);
    gr.rotation.y = sr() * 6.28;
    gr.scale.set(1, 1, 1);
    scene.add(gr);
    trees.push(gr);
  }

  // ---- HOUSES (big — larger than the player) ----
  for (var hi = 0; hi < 10; hi++) {
    var hx = rr(-70, 70), hz = rr(-70, 70);
    if (hx * hx + hz * hz < 36 || !canPlace(hx, hz, 7)) continue;
    placed.push([hx, hz]);
    var gr2 = new THREE.Group();
    var w = 4.0 + rr(0, 1.5), h = 2.5 + rr(0, 1.0), d = 4.0 + rr(0, 1.5);
    var wc = [0xDEB887, 0xF5DEB3, 0xD2B48C, 0xE8D5B7][ri(0, 3)];
    var rc = [0x8B4513, 0xA0522D, 0xCD853F, 0xBC8F8F][ri(0, 3)];
    var roofC = new THREE.MeshStandardMaterial({ color: rc, roughness: 0.7 });
    var wallC = new THREE.MeshStandardMaterial({ color: wc, roughness: 0.8 });

    var walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallC);
    walls.position.y = h / 2; walls.castShadow = true; walls.receiveShadow = true; gr2.add(walls);

    var roofH = h * 0.6 + rr(0, 0.15);
    var roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 1.0, roofH, 4), roofC);
    roof.position.y = h + roofH * 0.2; roof.rotation.y = Math.PI / 4; roof.castShadow = true; gr2.add(roof);

    var winMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, emissive: 0x1a2a4a, emissiveIntensity: 0.2 });
    var winW = w * 0.18, winH = h * 0.2;
    var win1 = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMat);
    win1.position.set(w * 0.2, h * 0.45, d / 2 + 0.005); gr2.add(win1);
    var win2 = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMat);
    win2.position.set(-w * 0.2, h * 0.45, d / 2 + 0.005); gr2.add(win2);
    var door = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.14, h * 0.5), new THREE.MeshStandardMaterial({ color: 0x5a3a1a }));
    door.position.set(0, h * 0.18, d / 2 + 0.005); gr2.add(door);

    if (CFG.mode === 'night') {
      var wlMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xffaa00, emissiveIntensity: 0.3 });
      var wl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), wlMat);
      wl.position.set(w * 0.15, h * 0.45, d / 2 + 0.02); gr2.add(wl);
      var wl2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), wlMat);
      wl2.position.set(-w * 0.15, h * 0.45, d / 2 + 0.02); gr2.add(wl2);
    }

    var hy = getHeight(hx, hz);
    gr2.position.set(hx, hy, hz);
    gr2.rotation.y = sr() * 6.28;
    scene.add(gr2);
  }

  // ---- ROCKS ----
  for (var ri2 = 0; ri2 < 60; ri2++) {
    var rx = rr(-85, 85), rz = rr(-85, 85);
    if (rx * rx + rz * rz < 30 || !canPlace(rx, rz, 1.2)) continue;
    placed.push([rx, rz]);
    var rockMat = new THREE.MeshStandardMaterial({ color: [0x808080, 0x707070, 0x909080, 0x686868][ri(0, 3)], roughness: 0.9, flatShading: true });
    var rRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + rr(0, 0.5), 0), rockMat);
    var rh = getHeight(rx, rz);
    rRock.position.set(rx, rh + 0.1, rz);
    rRock.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6));
    rRock.scale.y = rr(0.4, 1.2);
    rRock.castShadow = true; rRock.receiveShadow = true;
    scene.add(rRock);
  }

  // ---- DOWNLOADED MODEL DECORATIONS (column, machine) ----
  if (Models.cache.column) {
    for (var di = 0; di < 12; di++) {
      var dx2 = rr(-80, 80), dz2 = rr(-80, 80);
      if (dx2 * dx2 + dz2 * dz2 < 30 || !canPlace(dx2, dz2, 3)) continue;
      placed.push([dx2, dz2]);
      var col = Models.cache.column.clone();
      var colScale = 0.3 + rr(0, 0.2);
      col.scale.set(colScale, colScale, colScale);
      col.position.set(dx2, getHeight(dx2, dz2), dz2);
      col.rotation.y = rr(0, 6.28);
      col.traverse(function (c) { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      scene.add(col);
    }
  }
  if (Models.cache.machine) {
    for (var mi3 = 0; mi3 < 4; mi3++) {
      var mx2 = rr(-60, 60), mz2 = rr(-60, 60);
      if (mx2 * mx2 + mz2 * mz2 < 30 || !canPlace(mx2, mz2, 4)) continue;
      placed.push([mx2, mz2]);
      var mach = Models.cache.machine.clone();
      var machScale = 0.15 + rr(0, 0.1);
      mach.scale.set(machScale, machScale, machScale);
      mach.position.set(mx2, getHeight(mx2, mz2), mz2);
      mach.rotation.y = rr(0, 6.28);
      mach.traverse(function (c) { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      scene.add(mach);
    }
  }

  // ---- GRASS SPRITES ----
  (function() {
    var gTex = getGrassTexture();
    var gMat = new THREE.SpriteMaterial({ map: gTex, transparent: true, depthWrite: false, opacity: 0.8 });
    for (var gi = 0; gi < 250; gi++) {
      var gx = rr(-88, 88), gz = rr(-88, 88);
      if (gx * gx + gz * gz < 25) continue;
      var gh = getHeight(gx, gz);
      var sprite = new THREE.Sprite(gMat);
      sprite.position.set(gx, gh + 0.15, gz);
      var rS = 0.2 + rr(0, 0.3);
      sprite.scale.set(rS * 0.5, rS, 1);
      sprite.material = gMat.clone();
      sprite.material.opacity = 0.3 + rr(0, 0.6);
      sprite.material.color.setHSL(0.25 + rr(0, 0.08), 0.5 + rr(0, 0.3), 0.25 + rr(0, 0.15));
      scene.add(sprite);
      grasses.push(sprite);
    }
  })();

  // ---- FIREFLIES (night mode) ----
  if (CFG.mode === 'night') {
    (function() {
      var ffMat = new THREE.SpriteMaterial({
        map: (function() {
          var c = document.createElement('canvas');
          c.width = 16; c.height = 16;
          var ctx = c.getContext('2d');
          var g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
          g.addColorStop(0, 'rgba(255,255,200,1)');
          g.addColorStop(0.3, 'rgba(255,255,150,0.8)');
          g.addColorStop(0.6, 'rgba(200,200,50,0.3)');
          g.addColorStop(1, 'rgba(200,200,50,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 16, 16);
          return new THREE.CanvasTexture(c);
        })(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      for (var fi = 0; fi < 40; fi++) {
        var fx = rr(-70, 70), fz = rr(-70, 70);
        if (fx * fx + fz * fz < 36) continue;
        var fh = getHeight(fx, fz) + 0.5 + rr(0, 1.5);
        var sprite = new THREE.Sprite(ffMat.clone());
        sprite.position.set(fx, fh, fz);
        var fs = 0.1 + rr(0, 0.2);
        sprite.scale.set(fs, fs, 1);
        sprite.userData = {
          phase: rr(0, 6.28),
          speed: 0.5 + rr(0, 1.5),
          baseY: fh,
          driftX: rr(-0.2, 0.2),
          driftZ: rr(-0.2, 0.2)
        };
        scene.add(sprite);
        fireflies.push(sprite);
      }
    })();
  }

  // ---- ORBS ----
  orbs = [];
  var orbCount = 0, attempts = 0;
  while (orbCount < CFG.total && attempts < 2000) {
    attempts++;
    var ox, oz;
    if (orbCount < 10) { var a = sr() * 6.28, r = 8 + sr() * 20; ox = Math.cos(a) * r; oz = Math.sin(a) * r; }
    else { ox = rr(-85, 85); oz = rr(-85, 85); }
    if (ox * ox + oz * oz <= 12 || !canPlace(ox, oz, 4)) continue;
    placed.push([ox, oz]);

    var oy = getHeight(ox, oz) + 0.6 + rr(0, 0.5);
    var crystal;
    if (Models.cache.orb) {
      crystal = Models.cache.orb.clone();
      crystal.scale.set(0.15, 0.15, 0.15);
      crystal.position.y += 0.1;
    } else {
      crystal = Models.createCrystalOrb();
    }
    crystal.position.set(ox, oy, oz);

    var glowR = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 16), new THREE.MeshBasicMaterial({
      color: 0xFFD700, transparent: true, opacity: CFG.mode === 'night' ? 0.5 : 0.25, side: THREE.DoubleSide
    }));
    glowR.position.set(ox, oy, oz); glowR.rotation.x = -Math.PI / 2;

    var beamH = oy + 0.3;
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.15, beamH, 6), new THREE.MeshBasicMaterial({
      color: 0xFFD700, transparent: true, opacity: CFG.mode === 'night' ? 0.3 : 0.15
    }));
    beam.position.set(ox, beamH / 2 - 0.15, oz);

    var pulsePhase = sr() * 6.28;
    scene.add(crystal); scene.add(glowR); scene.add(beam);
    orbs.push({ orb: crystal, glow: glowR, beam: beam, col: false, x: ox, z: oz, y: oy, pulsePhase: pulsePhase });
    orbCount++;
  }

  // ---- ENEMIES (Slimes) ----
  if (CFG.mode !== 'time') {
    (function() {
      for (var si = 0; si < 8; si++) {
        var sx = rr(-70, 70), sz = rr(-70, 70);
        if (sx * sx + sz * sz < 40) continue;
        var sh2 = getHeight(sx, sz) + 0.3;
        var body;
        if (Models.cache.enemy) {
          body = Models.cache.enemy.clone();
          body.scale.set(0.12, 0.12, 0.12);
          body.rotation.y = rr(0, 6.28);
        } else {
          body = Models.createSlime(1 + rr(0, 0.4));
        }
        body.position.set(sx, sh2, sz);
        body.userData = {
          homeX: sx, homeZ: sz, homeY: sh2,
          targetX: sx + rr(-10, 10), targetZ: sz + rr(-10, 10),
          speed: 1 + rr(0, 1.5),
          phase: rr(0, 6.28),
          radius: 0.35 + rr(0, 0.15),
          alive: true, respawnTimer: 0,
          procedural: !Models.cache.enemy
        };
        scene.add(body);
        slimes.push(body);
      }
    })();
  }

  // ---- ANIMALS (rabbits/birds) ----
  (function() {
    var furMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.9 });
    var furMat2 = new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.9 });
    var birdMat = new THREE.MeshStandardMaterial({ color: 0x445588, roughness: 0.7 });
    for (var ai = 0; ai < 10; ai++) {
      var ax = rr(-60, 60), az = rr(-60, 60);
      if (ax * ax + az * az < 36) continue;
      var isBird = ai < 3;
      var group = new THREE.Group();
      var ah = getHeight(ax, az);
      if (isBird) {
        var bBody = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), birdMat);
        bBody.scale.y = 0.6; group.add(bBody);
        group.position.set(ax, ah + 1.5 + rr(0, 0.5), az);
        group.userData = {
          type: 'bird', homeX: ax, homeZ: az, homeY: ah + 1.5 + rr(0, 0.5),
          speed: 1 + rr(0, 0.5), radius: 3 + rr(0, 3), phase: rr(0, 6.28),
          fleeTimer: 0
        };
      } else {
        var body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), ri(0,1) ? furMat : furMat2);
        body.scale.set(1, 0.7, 1.2);
        body.position.y = 0.15; group.add(body);
        group.position.set(ax, ah, az);
        group.userData = {
          type: 'rabbit', homeX: ax, homeZ: az, homeY: ah,
          speed: 2 + rr(0, 1), radius: 4 + rr(0, 3), phase: rr(0, 6.28),
          fleeDir: null, fleeTimer: 0
        };
      }
      scene.add(group);
      animals.push(group);
    }
  })();

  // ---- NIGHT MODE: Stars, Moon, Lamps ----
  if (CFG.mode === 'night') {
    var starsGeo = new THREE.BufferGeometry();
    var sp = new Float32Array(6000);
    for (var si = 0; si < 6000; si += 3) {
      var theta = rr(0, 6.28), phi = rr(0, 3.14), r = 220;
      sp[si] = r * Math.sin(phi) * Math.cos(theta);
      sp[si + 1] = Math.abs(r * Math.cos(phi));
      sp[si + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8, sizeAttenuation: true });
    scene.add(new THREE.Points(starsGeo, starMat));

    var starGlowMat = new THREE.SpriteMaterial({
      map: (function() {
        var c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        var ctx = c.getContext('2d');
        var g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.2, 'rgba(255,255,200,0.6)');
        g.addColorStop(0.5, 'rgba(200,200,255,0.2)');
        g.addColorStop(1, 'rgba(200,200,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(c);
      })(),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    for (var sg = 0; sg < 10; sg++) {
      var sAngle = rr(0, 6.28), sPhi = rr(0.2, 2.8);
      var sr2 = 180 + rr(0, 30);
      var sx = sr2 * Math.sin(sPhi) * Math.cos(sAngle);
      var sy = Math.abs(sr2 * Math.cos(sPhi));
      var sz = sr2 * Math.sin(sPhi) * Math.sin(sAngle);
      var glowStar = new THREE.Sprite(starGlowMat.clone());
      glowStar.position.set(sx, sy, sz);
      var ss = 2 + rr(0, 3);
      glowStar.scale.set(ss, ss, 1);
      glowStar.userData = { pulsePhase: rr(0, 6.28) };
      scene.add(glowStar);
    }

    var moon = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 20), new THREE.MeshStandardMaterial({
      color: 0xeeeeff, emissive: 0x8888ff, emissiveIntensity: 0.15, roughness: 0.3
    }));
    moon.position.set(50, 80, -80); scene.add(moon);

    var moonGlow = new THREE.Sprite(starGlowMat.clone());
    moonGlow.material.color.setHex(0xaaaaff);
    moonGlow.position.set(50, 80, -80);
    moonGlow.scale.set(12, 12, 1);
    scene.add(moonGlow);

    for (var p = 0; p < 12; p++) {
      var lx = rr(-65, 65), lz = rr(-65, 65);
      if (lx * lx + lz * lz <= 20 || !canPlace(lx, lz, 8)) continue;
      placed.push([lx, lz]);
      var gr3 = new THREE.Group(), ph = 2.5;
      var lh = getHeight(lx, lz);
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, ph, 6), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 }));
      pole.position.y = ph / 2; pole.castShadow = true; gr3.add(pole);
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 }));
      arm.position.set(0.17, ph - 0.02, 0); gr3.add(arm);
      var lb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xffaa00, emissiveIntensity: 2 }));
      lb.position.set(0.3, ph - 0.1, 0); gr3.add(lb);
      var pl = new THREE.PointLight(0xffaa44, 1.5, 12, 2);
      pl.position.set(0.3, ph - 0.1, 0); gr3.add(pl);
      gr3.position.set(lx, lh, lz); scene.add(gr3);
    }
  }
}

// ===== LIGHTS =====
function setupLights() {
  if (CFG.mode === 'night') {
    var ml = new THREE.DirectionalLight(0x8888ff, 0.4); ml.position.set(-40, 80, -30); scene.add(ml);
    ambLight = new THREE.AmbientLight(0x202060, 0.15); scene.add(ambLight);
  } else {
    hemiLight = new THREE.HemisphereLight(0x7ec8e3, 0x3a7d44, 0.5); scene.add(hemiLight);
    sunLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    sunLight.position.set(60, 100, 40); sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048; sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -100; sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100; sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
    var fill = new THREE.DirectionalLight(0x4488ff, 0.3);
    fill.position.set(-40, 60, -30);
    scene.add(fill);
    ambLight = new THREE.AmbientLight(0x404060, 0.3); scene.add(ambLight);
  }
}

// ===== DASH =====
var photoModeActive = false;
var savedPhotoHud = '';
function checkDash(key) {
  if (dashCooldown > 0 || dashTimer > 0) return;
  var now = performance.now();
  if (now - dashKeyTime[key] < 220) {
    dashDir = key;
    dashTimer = 0.2;
    dashCooldown = 1.2;
    var d = { w: -1, s: 1, a: -1, z: 0 }[key] || 0;
    if (key === 'a' || key === 'd') {
      vel.x = key === 'd' ? 25 : -25;
    } else {
      vel.z = key === 's' ? 25 : -25;
    }
    // dash particles
    for (var pdi = 0; pdi < 8; pdi++) {
      spawnParticles(camera.position.x + rr(-0.3,0.3), camera.position.y + rr(-0.3,0.3), camera.position.z + rr(-0.3,0.3), 0x88ddff, 1);
    }
    if (dashEl) { dashEl.style.display = 'inline'; dashEl.style.opacity = 1; }
  }
  dashKeyTime[key] = now;
}
function togglePhotoMode() {
  if (ended || !started) return;
  photoModeActive = !photoModeActive;
  if (photoModeActive) {
    savedPhotoHud = hud.style.display;
    hud.style.display = 'none';
    pauseMenu.style.display = 'none';
    if (document.pointerLockElement) document.exitPointerLock();
  } else {
    hud.style.display = savedPhotoHud || 'block';
    if (locked) renderer.domElement.requestPointerLock();
  }
}

// ===== CONTROLS =====
function setupControls() {
  document.addEventListener('keydown', function(e) {
    if (e.code === 'KeyW') { keys.w = true; checkDash('w'); }
    if (e.code === 'KeyA') { keys.a = true; checkDash('a'); }
    if (e.code === 'KeyS') { keys.s = true; checkDash('s'); }
    if (e.code === 'KeyD') { keys.d = true; checkDash('d'); }
    if (e.code === 'Space' && started && !paused) { e.preventDefault(); keys.space = true; if (grounded) { jumpVel = 5.5 + upgrades.jumpBonus * 0.5; grounded = false; } }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
    if (e.code === 'KeyE' && started) keys.e = true;
    if (e.code === 'KeyB' && started) keys.b = true;
    if (e.code === 'KeyP' && started) togglePhotoMode();
    if (e.code === 'Escape' && started) togglePause();
    if (e.code === 'KeyF') toggleFullscreen();
    if (e.code === 'KeyF' && started) keys.f = true;
  });
  document.addEventListener('keyup', function(e) {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyA') keys.a = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'KeyD') keys.d = false;
    if (e.code === 'Space') keys.space = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
    if (e.code === 'KeyE') keys.e = false;
    if (e.code === 'KeyB') keys.b = false;
    if (e.code === 'KeyP') keys.p = false;
    if (e.code === 'KeyF') keys.f = false;
  });
  document.addEventListener('mousemove', function(e) {
    if (!locked || !started || paused) return;
    var sens = CFG.sensitivity / 10;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= e.movementX * 0.002 * sens;
    euler.x -= e.movementY * 0.002 * sens;
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
    camera.quaternion.setFromEuler(euler);
  });
  startOv.addEventListener('click', function() {
    if (ended) return;
    started = true;
    startOv.style.display = 'none';
    hud.style.display = 'block';
    unlockAch('first_start', 'Iniciou o jogo pela primeira vez!');
    renderer.domElement.requestPointerLock();
    playClick();
  });
  renderer.domElement.addEventListener('click', function() {
    if (ended || !started || locked || paused) return;
    renderer.domElement.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', function() {
    locked = document.pointerLockElement === renderer.domElement;
  });
  window.addEventListener('resize', function() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ===== DAY/NIGHT CYCLE =====
function updateDayNight(dt) {
  if (CFG.mode === 'night' || CFG.mode === 'time') return;
  dayTime += dt * daySpeed;
  if (dayTime > 1) dayTime -= 1;

  var angle = dayTime * Math.PI * 2;
  var sunX = Math.cos(angle) * 120;
  var sunY = Math.sin(angle) * 100 + 20;
  if (sunLight) {
    sunLight.position.set(sunX, Math.max(sunY, 5), 0);
    var intensity = clamp((sunY - 10) / 90, 0.1, 1.8);
    sunLight.intensity = intensity;
    var warm = clamp((sunY - 10) / 60, 0, 1);
    var r = 1, g = 0.9 + warm * 0.1, b = 0.6 + warm * 0.4;
    if (sunY < 30) { r = 1.5; g = 0.7; b = 0.3; }
    else if (sunY < 50) { var t2 = (sunY - 30) / 20; r = 1.5 - t2 * 0.5; g = 0.7 + t2 * 0.25; b = 0.3 + t2 * 0.35; }
    sunLight.color.setRGB(r, g, b);
  }
  if (hemiLight) {
    var hInt = clamp((sunY - 5) / 95, 0.05, 0.5);
    hemiLight.intensity = hInt;
    var skyR = clamp((sunY - 5) / 80, 0.05, 0.5);
    var skyG = clamp((sunY - 5) / 70, 0.05, 0.4);
    var skyB = clamp((sunY - 5) / 60, 0.1, 0.8);
    hemiLight.color.setRGB(skyR + 0.1, skyG + 0.15, skyB + 0.3);
    hemiLight.groundColor.setRGB(0.1 + skyR * 0.3, 0.15 + skyG * 0.3, 0.05);
  }
  if (ambLight) {
    var aInt = clamp((sunY - 10) / 80, 0.08, 0.3);
    ambLight.intensity = aInt;
    if (sunY < 20) ambLight.color.setHex(0x202060);
    else ambLight.color.setHex(0x404060);
  }
  if (skyMat) {
    var t = clamp((sunY - 5) / 95, 0, 1);
    var t2 = clamp((sunY - 5) / 50, 0, 1);
    skyMat.uniforms.topColor.value.setHSL(0.6, 0.5, 0.1 + t * 0.4);
    skyMat.uniforms.midColor.value.setHSL(0.58, 0.3, 0.1 + t * 0.35);
    var botH = 0.08 + t * 0.03;
    skyMat.uniforms.botColor.value.setHSL(botH, 0.6, 0.15 + t * 0.5);
  }
  if (scene.fog && scene.background) {
    var fR = 0.02 + t * 0.45, fG = 0.02 + t * 0.5, fB = 0.08 + t * 0.7;
    scene.fog.color.setRGB(fR, fG, fB);
    scene.background.setRGB(fR, fG, fB);
  }
}

// ===== WEATHER SYSTEM =====
function initRain() {
  if (rainDrops.length > 0) return;
  var rainMat = new THREE.MeshBasicMaterial({ color: 0x8888cc, transparent: true, opacity: 0.3, depthWrite: false });
  for (var i = 0; i < rainTotal; i++) {
    var drop = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.02), rainMat);
    drop.position.set(rr(-100, 100), rr(5, 40), rr(-100, 100));
    drop.userData = { speed: 15 + rr(0, 10) };
    scene.add(drop);
    rainDrops.push(drop);
  }
}
function updateWeather(dt) {
  if (CFG.mode === 'night' || CFG.mode === 'time') return;
  weatherTimer -= dt;
  if (weatherTimer <= 0) {
    var r = rr(0, 1);
    if (weather === 'clear') { weather = r < 0.5 ? 'rain' : 'storm'; initRain(); }
    else if (weather === 'rain') { weather = r < 0.4 ? 'clear' : 'storm'; }
    else { weather = r < 0.5 ? 'clear' : 'rain'; }
    weatherTimer = 30 + rr(0, 60);
    if (weather === 'clear') {
      rainDrops.forEach(function(d){ d.visible = false; });
      if (scene.fog) scene.fog.density = 0;
    } else {
      rainDrops.forEach(function(d){ d.visible = true; });
    }
  }
  // Rain animation
  var isStorm = weather === 'storm';
  var isRaining = weather === 'rain' || isStorm;
  if (isRaining) {
    var opacity = isStorm ? 0.5 : 0.25;
    var count = isStorm ? rainTotal : Math.floor(rainTotal * 0.6);
    for (var i = 0; i < rainTotal; i++) {
      if (i >= count) { rainDrops[i].visible = false; continue; }
      var d = rainDrops[i];
      d.visible = true;
      d.position.y -= d.userData.speed * dt;
      d.position.x += Math.sin(time + i) * 0.1 * dt;
      d.position.z += Math.cos(time * 0.7 + i) * 0.1 * dt;
      if (d.position.y < 0) { d.position.y = 35 + rr(0, 10); d.position.x = rr(-100, 100); d.position.z = rr(-100, 100); }
      d.material.opacity = opacity;
    }
    // Lightning
    if (isStorm) {
      lightningTimer -= dt;
      if (lightningTimer <= 0) {
        lightningFlash = 0.15;
        lightningTimer = 10 + rr(0, 20);
        playTone(60, 0.3, 0.4, 'sawtooth');
        playTone(40, 0.5, 0.3, 'sawtooth');
      }
    }
    if (lightningFlash > 0) {
      lightningFlash -= dt;
      if (scene.background) {
        var b = 0.5 + lightningFlash / 0.15 * 0.5;
        scene.background.setRGB(b, b, b);
      }
    }
    // Fog
    if (scene.fog) scene.fog.density = isStorm ? 0.015 : 0.008;
  }
}

// ===== PARTICLES =====
var particles = [];
function spawnParticles(x, y, z, color, count) {
  count = count || 12;
  for (var i = 0; i < count; i++) {
    var geo = new THREE.SphereGeometry(0.05 + rr(0, 0.08), 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: color || 0xFFD700 });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    var speed = 2 + rr(0, 3);
    var angle = rr(0, 6.28), pitch = rr(-1, 1);
    m.userData = {
      vx: Math.cos(angle) * speed * Math.sqrt(1 - pitch * pitch),
      vy: Math.abs(pitch) * speed + 2,
      vz: Math.sin(angle) * speed * Math.sqrt(1 - pitch * pitch),
      life: 1
    };
    scene.add(m);
    particles.push(m);
  }
}
function updateParticles(dt) {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.userData.vy -= 9.8 * dt;
    p.position.x += p.userData.vx * dt;
    p.position.y += p.userData.vy * dt;
    p.position.z += p.userData.vz * dt;
    p.userData.life -= dt * 1.5;
    p.scale.setScalar(Math.max(0, p.userData.life));
    if (p.userData.life <= 0) {
      scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      particles.splice(i, 1);
    }
  }
}

// ===== FALLING LEAVES =====
var leaves = [];
function spawnLeaf() {
  if (trees.length === 0) return;
  var tree = trees[ri(0, trees.length - 1)];
  var lx = tree.position.x + rr(-0.5, 0.5);
  var lz = tree.position.z + rr(-0.5, 0.5);
  var lMat = new THREE.MeshBasicMaterial({
    color: [0x3a7d44, 0x2d5a27, 0x4a8c3f, 0x8B6914][ri(0, 3)],
    transparent: true, opacity: 0.7
  });
  var leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.08), lMat);
  leaf.position.set(lx, tree.position.y + 2 + rr(0, 1), lz);
  leaf.userData = {
    vy: -0.3 + rr(0, -0.2),
    vx: rr(-0.3, 0.3),
    vz: rr(-0.3, 0.3),
    rotSpeed: rr(-2, 2),
    life: 3 + rr(0, 3),
    rotX: rr(0, 6.28),
    rotZ: rr(0, 6.28)
  };
  scene.add(leaf);
  leaves.push(leaf);
}
function updateLeaves(dt) {
  if (rr(0, 1) < 0.03) spawnLeaf();
  for (var i = leaves.length - 1; i >= 0; i--) {
    var l = leaves[i];
    l.position.x += l.userData.vx * dt;
    l.position.y += l.userData.vy * dt;
    l.position.z += l.userData.vz * dt;
    l.userData.rotX += l.userData.rotSpeed * dt;
    l.userData.rotZ += l.userData.rotSpeed * dt * 0.5;
    l.rotation.x = l.userData.rotX;
    l.rotation.z = l.userData.rotZ;
    l.userData.life -= dt;
    if (l.userData.life <= 0 || l.position.y < 0) {
      scene.remove(l);
      l.geometry.dispose();
      l.material.dispose();
      leaves.splice(i, 1);
    }
  }
}

// ===== END GAME =====
function end(won) {
  ended = true;
  if (document.pointerLockElement) document.exitPointerLock();
  hud.style.display = 'none';
  timerOn = false;
  if (won) {
    unlockAch('all_collected', 'Colecionador - Coletou todas as estrelas!');
    if (CFG.mode === 'time') unlockAch('speedster', 'Velocista - Completou o modo corrida!');
    if (CFG.mode === 'night') unlockAch('night_runner', 'Noturno - Completou o modo noturno!');
    var achCount = countAch();
    $('win-stats').textContent = 'Você coletou ' + score + ' de ' + CFG.total + ' estrelas!';
    $('win-achievements').textContent = 'Conquistas: ' + achCount + ' desbloqueadas';
    winOv.style.display = 'flex';
    if (CFG.mode === 'time') {
      var elapsed = CFG.timerMax - timer;
      var mins = Math.floor(elapsed / 60), secs = Math.floor(elapsed % 60);
      $('win-stats').textContent += ' Tempo: ' + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
  } else {
    $('lose-stats').textContent = 'Você coletou ' + score + ' de ' + CFG.total + ' estrelas.';
    loseOv.style.display = 'flex';
  }
  try { localStorage.setItem('sim3d_collected', score.toString()); } catch(e) {}
}

// ===== COMPASS =====
function updateCompass() {
  var nearest = null, nearD = Infinity;
  for (var i = 0; i < orbs.length; i++) {
    if (orbs[i].col) continue;
    var d = dist(camera.position.x, camera.position.z, orbs[i].x, orbs[i].z);
    if (d < nearD) { nearD = d; nearest = orbs[i]; }
  }
  nearStarDist = nearD;
  if (!nearest) { compass.style.display = 'none'; distEl.style.display = 'none'; return; }
  compass.style.display = 'inline';
  var dx = nearest.x - camera.position.x, dz = nearest.z - camera.position.z;
  var angle = Math.atan2(dx, dz);
  var camAngle = camera.rotation.eulerOrder === 'YXZ' ? euler.y : 0;
  var relAngle = angle - camAngle;
  compass.style.transform = 'rotate(' + (relAngle * 180 / Math.PI) + 'deg)';
  distEl.style.display = 'inline';
  if (nearD < 10) distEl.innerHTML = '&#128752; ' + Math.round(nearD) + 'm';
  else if (nearD < 100) distEl.innerHTML = '&#128752; ' + Math.round(nearD / 10) * 10 + 'm';
  else distEl.innerHTML = '&#128752; ' + Math.round(nearD / 50) * 50 + 'm';
}

// ===== ACHIEVEMENT DISPLAY =====
function updateAchDisplay() {
  var count = countAch();
}

// ===== POWERUP CHECK =====
function checkPowerups() {
  if (powerupActive && powerupTime > 0) {
    powerupTime -= 0.016;
    if (powerupTime <= 0) {
      powerupActive = '';
      powerupEl.style.display = 'none';
    }
  }
}
function activatePowerup(type, duration) {
  powerupActive = type;
  powerupTime = duration;
  if (type === 'magnet') {
    powerupEl.innerHTML = '&#9889; Imã (' + Math.ceil(duration) + 's)';
    powerupEl.style.display = 'inline';
    unlockAch('magnet', 'Imã - Coletou estrelas com o poder do imã!');
  } else if (type === 'speed') {
    powerupEl.innerHTML = '&#128176; Velocidade (' + Math.ceil(duration) + 's)';
    powerupEl.style.display = 'inline';
  }
  playPowerup();
}
function trySpawnPowerup() {
  if (rr(0, 1) > 0.0005) return;
  var px = rr(-60, 60), pz = rr(-60, 60);
  if (px * px + pz * pz < 25) return;
  var type = rr(0, 1) > 0.5 ? 'magnet' : 'speed';
  var color = type === 'magnet' ? 0x00ff88 : 0x00aaff;
  var mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 }));
  var ph = getHeight(px, pz) + 1.5;
  mesh.position.set(px, ph, pz);
  mesh.userData = { type: type, bobPhase: sr() * 6.28 };
  scene.add(mesh);
  var glow2 = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 12), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
  glow2.position.set(px, ph, pz); glow2.rotation.x = -Math.PI / 2;
  scene.add(glow2);
  orbs.push({ orb: mesh, glow: glow2, col: false, isPowerup: true, x: px, z: pz, y: ph, pulsePhase: 0 });
}

// ===== ANIMATE =====
function animate() {
  if (ended) return;
  requestAnimationFrame(animate);
  var dt = Math.min(clock.getDelta(), 0.05);
  time += dt;

  if (!paused) {
    // FPS
    if (Math.floor(time) !== Math.floor(time - dt)) {
      fps = Math.round(1 / (dt || 0.016));
      fpsEl.textContent = fps + ' FPS';
    }

    // Timer
    if (timerOn && started) {
      timer -= dt;
      if (timer <= 0) { timerEl.innerHTML = '&#9201; 0:00'; end(false); return; }
      var m = Math.floor(timer / 60), s = Math.floor(timer % 60);
      timerEl.innerHTML = '&#9201; ' + m + ':' + (s < 10 ? '0' : '') + s;
      timerEl.style.color = timer < 30 ? '#ff4444' : '#fff';
    }

    // Water animation
    if (waterMesh && waterVerts) {
      var wPos = waterVerts.array;
      for (var wi = 0; wi < wPos.length; wi += 3) {
        var wx = wPos[wi], wz = wPos[wi + 2];
        wPos[wi + 1] = Math.sin(wx * 0.5 + time * 1.2) * 0.08 +
                       Math.sin(wz * 0.7 + time * 0.9) * 0.06 +
                       Math.sin((wx + wz) * 0.3 + time * 0.6) * 0.05;
      }
      waterVerts.needsUpdate = true;
    }

    // Day/Night cycle
    updateDayNight(dt);
    // Weather
    updateWeather(dt);

    // Movement
    if (started && !photoModeActive) {
      var baseSpd = 10 + upgrades.speedBonus;
      if (powerupActive === 'speed') baseSpd = Math.max(baseSpd, 18);
      if (upgrades.magnetPerm && powerupActive !== 'magnet') { powerupActive = 'magnet'; powerupTime = 999; }
      sprinting = keys.shift && stamina > 0 && (keys.w || keys.a || keys.s || keys.d);
      var spd = sprinting ? baseSpd * 1.6 : baseSpd;
      if (dashDir && dashTimer > 0) {
        var dd = { w: 0, s: 0, a: 0, d: 0 };
        dd[dashDir] = 1;
        if (dashDir === 'w' || dashDir === 's') {
          var sign = dashDir === 'w' ? -1 : 1;
          var fwd = new THREE.Vector3(0, 0, sign).applyQuaternion(camera.quaternion);
          vel.x = fwd.x * 25; vel.z = fwd.z * 25;
        } else {
          var rSign = dashDir === 'd' ? 1 : -1;
          var rig = new THREE.Vector3(rSign, 0, 0).applyQuaternion(camera.quaternion);
          vel.x = rig.x * 25; vel.z = rig.z * 25;
        }
        dashTimer -= dt;
        if (dashTimer <= 0) { dashDir = null; if (dashEl) { dashEl.style.opacity = 0; setTimeout(function(){ if(dashEl) dashEl.style.display='none'; }, 300); } }
      }
      // Sprint stamina
      if (sprinting) { stamina = Math.max(0, stamina - 25 * dt); }
      else { stamina = Math.min(100, stamina + 15 * dt); }
      if (staminaEl) staminaEl.style.width = stamina + '%';
      if (staminaText) staminaText.textContent = Math.round(stamina) + '%';
      if (dashCooldown > 0) { dashCooldown -= dt; if (dashCooldown <= 0 && dashEl) dashEl.style.display = 'none'; }
      else if (dashEl && dashTimer <= 0) dashEl.style.display = 'none';

      dir.set(0, 0, 0);
      if (keys.w) dir.z -= 1;
      if (keys.s) dir.z += 1;
      if (keys.a) dir.x -= 1;
      if (keys.d) dir.x += 1;

      if (dir.length() > 0) {
        dir.normalize().applyQuaternion(camera.quaternion);
        dir.y = 0; dir.normalize();
        vel.x += (dir.x * spd - vel.x) * dt * 12;
        vel.z += (dir.z * spd - vel.z) * dt * 12;
      } else {
        vel.x *= 0.88; vel.z *= 0.88;
      }

      // Jump physics
      if (!grounded) {
        jumpVel -= 9.8 * dt;
        camera.position.y += jumpVel * dt;
        var gh = getHeight(camera.position.x, camera.position.z) + 1.7;
        if (camera.position.y <= gh) {
          camera.position.y = gh;
          grounded = true;
          jumpVel = 0;
        }
      } else {
        camera.position.y = getHeight(camera.position.x, camera.position.z) + 1.7;
      }

      var nx = camera.position.x + vel.x * dt;
      var nz = camera.position.z + vel.z * dt;
      if (Math.abs(nx) < 100) camera.position.x = nx; else vel.x = 0;
      if (Math.abs(nz) < 100) camera.position.z = nz; else vel.z = 0;

      // Bob
      if (grounded && (dir.length() > 0 || Math.abs(vel.x) > 0.05 || Math.abs(vel.z) > 0.05)) {
        var bobSpeed = sprinting ? 14 : 10;
        camera.position.y += Math.sin(time * bobSpeed) * 0.025;
        if (playerArms) {
          var swing = Math.sin(time * bobSpeed) * 0.08;
          playerArms.position.y = -0.2 + Math.abs(swing) * 0.3;
          playerArms.rotation.z = Math.cos(time * bobSpeed) * 0.05;
        }
      } else if (playerArms) {
        playerArms.position.y += (-0.2 - playerArms.position.y) * 0.05;
        playerArms.rotation.z *= 0.95;
      }

      // Combo timer
      if (combo > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) { combo = 0; if (comboEl) comboEl.style.display = 'none'; }
      }

      // Collect orbs
      var col = 0, magnetRange = (upgrades.magnetPerm || powerupActive === 'magnet') ? 8 : 1.8;
      for (var i = 0; i < orbs.length; i++) {
        var c = orbs[i];
        if (c.col) { col++; continue; }
        var d = camera.position.distanceTo(c.orb.position);
        if (c.isPowerup && d < 2) {
          c.col = true; c.orb.visible = false; c.glow.visible = false;
          activatePowerup(c.orb.userData.type, 10);
          spawnParticles(c.x, c.y, c.z, c.orb.material.color.getHex(), 16);
          continue;
        }
        if (d < magnetRange) {
          c.col = true; c.orb.visible = false; c.glow.visible = false; c.beam.visible = false;
          combo++;
          comboTimer = 3;
          var bonus = Math.floor(combo / 2) * 5;
          score += 1 + bonus;
          if (comboEl) {
            comboEl.style.display = 'inline';
            comboEl.innerHTML = combo > 1 ? '&#9889; Combo x' + combo + ' (+' + bonus + ')' : '';
          }
          totalStarsEver++;
          try { localStorage.setItem('sim3d_total', totalStarsEver.toString()); } catch(e) {}
          scoreEl.innerHTML = '&#11088; ' + score + '/' + CFG.total;
          playCollect();
          spawnParticles(c.x, c.y, c.z, 0xFFD700, 10 + combo * 2);
          if (score >= 1) unlockAch('first_star', 'Primeira Estrela - Coletou seu primeiro astro!');
          if (score >= 5 && !achievements['collector_5']) unlockAch('collector_5', 'Aprendiz - Coletou 5 estrelas!');
          if (score >= 10 && !achievements['collector_10']) unlockAch('collector_10', 'Caçador - Coletou 10 estrelas!');
          if (combo >= 5) unlockAch('combo5', 'Combo 5 - Coletou 5 estrelas em sequência!');
          continue;
        }
        if (c.orb.visible) {
          c.orb.rotation.y += dt * 2;
          c.glow.rotation.y += dt * 2;
          var pulse = Math.sin(time * 2 + c.pulsePhase) * 0.05;
          c.glow.position.y = c.y + pulse;
          if ((upgrades.magnetPerm || powerupActive === 'magnet') && d < 8 && d > 1.8) {
            var dirX = camera.position.x - c.x, dirZ = camera.position.z - c.z;
            var len = Math.sqrt(dirX * dirX + dirZ * dirZ);
            c.orb.position.x += (dirX / len) * dt * 3;
            c.orb.position.z += (dirZ / len) * dt * 3;
            c.x = c.orb.position.x; c.z = c.orb.position.z;
            c.glow.position.x = c.x; c.glow.position.z = c.z;
            c.beam.position.x = c.x; c.beam.position.z = c.z;
          }
        }
      }

      if (col === CFG.total && orbs.length > 0) {
        unlockAch('full_clear', 'Coleção Completa - Todas as estrelas coletadas!');
        end(true);
        return;
      }

      // Slime hit
      if (invincible > 0) invincible -= dt;
      for (var si = 0; si < slimes.length; si++) {
        var sl = slimes[si];
        if (!sl.userData.alive) {
          sl.userData.respawnTimer -= dt;
          if (sl.userData.respawnTimer <= 0) {
            sl.userData.alive = true; sl.visible = true;
            sl.position.set(sl.userData.homeX, sl.userData.homeY, sl.userData.homeZ);
          }
          continue;
        }
        var sd = camera.position.distanceTo(sl.position);
        if (sd < 8) {
          var dirToPlayer = new THREE.Vector3(camera.position.x - sl.position.x, 0, camera.position.z - sl.position.z).normalize();
          sl.position.x += dirToPlayer.x * (-sl.userData.speed) * dt;
          sl.position.z += dirToPlayer.z * (-sl.userData.speed) * dt;
        } else if (sd < 20) {
          var dx = sl.userData.targetX - sl.position.x;
          var dz = sl.userData.targetZ - sl.position.z;
          var dd = Math.sqrt(dx * dx + dz * dz);
          if (dd < 1) {
            sl.userData.targetX = sl.userData.homeX + rr(-10, 10);
            sl.userData.targetZ = sl.userData.homeZ + rr(-10, 10);
          }
          sl.position.x += (dx / dd) * sl.userData.speed * dt * 0.5;
          sl.position.z += (dz / dd) * sl.userData.speed * dt * 0.5;
        }
        var baseY = sl.userData.procedural ? 0.3 : 1.0;
        sl.position.y = getHeight(sl.position.x, sl.position.z) + baseY + Math.sin(time * sl.userData.speed + sl.userData.phase) * 0.3;
        if (sl.userData.procedural) {
          var sq = Math.sin(time * sl.userData.speed + sl.userData.phase);
          sl.scale.y = 1 + sq * 0.15;
          sl.scale.x = 1 - sq * 0.08;
          sl.scale.z = 1 - sq * 0.08;
        }

        if (sd < 2 && invincible <= 0 && sl.userData.alive) {
          score = Math.max(0, score - 1);
          scoreEl.innerHTML = '&#11088; ' + score + '/' + CFG.total;
          invincible = 1;
          sl.userData.alive = false; sl.visible = false;
          sl.userData.respawnTimer = 15 + rr(0, 10);
          spawnParticles(sl.position.x, sl.position.y, sl.position.z, 0xff4444, 15);
          playTone(200, 0.3, 0.8, 'sawtooth');
        }
      }

      // Animals
      for (var ai = 0; ai < animals.length; ai++) {
        var an = animals[ai];
        var ad = camera.position.distanceTo(an.position);
        if (an.userData.fleeTimer > 0) an.userData.fleeTimer -= dt;
        if (ad < 6 && an.userData.fleeTimer <= 0) {
          an.userData.fleeTimer = 3;
          var fx = an.position.x - camera.position.x;
          var fz = an.position.z - camera.position.z;
          var fl = Math.sqrt(fx * fx + fz * fz);
          an.userData.fleeDir = { x: fx / fl, z: fz / fl };
        }
        if (an.userData.fleeDir && an.userData.fleeTimer > 0) {
          an.position.x += an.userData.fleeDir.x * an.userData.speed * 3 * dt;
          an.position.z += an.userData.fleeDir.z * an.userData.speed * 3 * dt;
          an.position.y = getHeight(an.position.x, an.position.z);
          if (an.userData.type === 'bird') {
            an.position.y = an.userData.homeY + Math.sin(time * 2 + an.userData.phase) * 0.3;
          }
          if (dist(an.position.x, an.position.z, an.userData.homeX, an.userData.homeZ) > 15) {
            an.userData.fleeTimer = 0;
            an.userData.fleeDir = null;
          }
        } else {
          var hd = dist(an.position.x, an.position.z, an.userData.homeX, an.userData.homeZ);
          if (hd > 1) {
            var hx2 = (an.userData.homeX - an.position.x) / hd;
            var hz2 = (an.userData.homeZ - an.position.z) / hd;
            an.position.x += hx2 * an.userData.speed * 0.5 * dt;
            an.position.z += hz2 * an.userData.speed * 0.5 * dt;
          } else {
            an.position.x += Math.sin(time + an.userData.phase) * 0.002;
            an.position.z += Math.cos(time + an.userData.phase) * 0.002;
          }
          an.position.y = getHeight(an.position.x, an.position.z);
          if (an.userData.type === 'bird') {
            an.position.y = an.userData.homeY + Math.sin(time * 2 + an.userData.phase) * 0.3;
          }
        }
      }

      // Wind on trees
      for (var ti = 0; ti < trees.length; ti++) {
        var tr = trees[ti];
        tr.rotation.z = Math.sin(time * 0.5 + tr.position.x * 0.1) * 0.015;
        tr.rotation.x = Math.sin(time * 0.4 + tr.position.z * 0.1) * 0.008;
      }

      // Cloud drift
      for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci];
        cl.position.x += cl.userData.driftX * dt;
        cl.position.z += cl.userData.driftZ * dt;
        if (Math.abs(cl.position.x) > 200) cl.userData.driftX *= -1;
        if (Math.abs(cl.position.z) > 200) cl.userData.driftZ *= -1;
      }

      // Fireflies
      for (var fi = 0; fi < fireflies.length; fi++) {
        var ff = fireflies[fi];
        var ffPhase = Math.sin(time * ff.userData.speed + ff.userData.phase);
        ff.position.y = ff.userData.baseY + Math.sin(time * ff.userData.speed * 0.5 + ff.userData.phase) * 0.4;
        ff.position.x += Math.sin(time * 0.3 + ff.userData.phase) * 0.005;
        ff.position.z += Math.cos(time * 0.3 + ff.userData.phase) * 0.005;
        var alpha = 0.3 + (ffPhase * 0.5 + 0.5) * 0.7;
        ff.material.opacity = alpha;
        var fs = (0.08 + alpha * 0.1) * (1 + Math.sin(time * 0.5 + ff.userData.phase) * 0.2);
        ff.scale.set(fs, fs, 1);
      }

      updateParticles(dt);
      updateLeaves(dt);
      checkPowerups();
      trySpawnPowerup();
      updateCompass();
    }
  }

  if (!photoModeActive) renderer.render(scene, camera);
}
