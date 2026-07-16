window.initGame = function (opts) {
  opts = opts || {};
  if (document.documentElement.dataset.gameInit === 'true') return;
  document.documentElement.dataset.gameInit = 'true';
  if (opts.autoStart) document.documentElement.dataset.gamePageInit = 'true';

  var fab = document.getElementById('game-fab');
  var modal = document.getElementById('game-modal');
  var closeBtn = document.getElementById('game-close');
  var stage = document.getElementById('game-stage');
  var timeEl = document.getElementById('game-time');
  var scoreEl = document.getElementById('game-score');
  var bestEl = document.getElementById('game-best');
  var overEl = document.getElementById('game-over');
  var overMsg = document.getElementById('game-over-msg');
  var restartBtn = document.getElementById('game-restart');
  var menuBtn = document.getElementById('game-menu');

  if (!modal || !stage) return;

  // Timer bar — remove old if exists
  var oldBar = stage.parentNode.querySelector('.game-timer-bar');
  if (oldBar) oldBar.remove();
  var timerBar = document.createElement('div');
  timerBar.className = 'game-timer-bar';
  var timerFill = document.createElement('div');
  timerFill.className = 'game-timer-fill';
  timerFill.id = 'game-timer-fill';
  timerBar.appendChild(timerFill);
  stage.parentNode.insertBefore(timerBar, stage);

  // Setup canvas
  stage.style.position = 'relative';
  stage.style.overflow = 'hidden';
  var canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  var kittyDiv = stage.querySelector('#game-kitty');
  if (kittyDiv) kittyDiv.remove();
  stage.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var BEST_KEY = 'hkGameBest';
  var DURATION = 30;
  var timeLeft = DURATION;
  var score = 0;
  var best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
  var timer = null;
  var rafId = null;
  var running = false;
  var paused = false;
  var animTime = 0;
  var kittyPop = 0;
  var scorePopups = [];
  var particles = [];
  var clouds = [];
  var flowers = [];
  var dragging = false;
  var dragOffX = 0, dragOffY = 0;
  var lastTs = 0;
  var kittyX = 12, kittyY = 12;
  var kittyVX = 2.4, kittyVY = 1.8;

  bestEl.textContent = best;

  // Audio
  var actx = null;
  function getAudio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function beep(f, d, t, v) {
    var a = getAudio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = t || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.18, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + d);
  }
  function sndOpen() { beep(660, 0.08, 'sine', 0.15); setTimeout(function() { beep(880, 0.08, 'sine', 0.15); }, 70); }
  function sndClose() { beep(440, 0.1, 'sine', 0.12); }
  function sndCatch() { beep(880, 0.12, 'triangle', 0.2); setTimeout(function() { beep(1320, 0.12, 'triangle', 0.18); }, 90); }
  function sndOver() {
    beep(660, 0.18, 'sine', 0.2);
    setTimeout(function() { beep(523, 0.18, 'sine', 0.2); }, 160);
    setTimeout(function() { beep(392, 0.28, 'sine', 0.2); }, 320);
  }

  // Resize
  function resizeCanvas() {
    var r = stage.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  // Scene objects
  function initScene() {
    clouds = [];
    for (var ci = 0; ci < 4; ci++) {
      clouds.push({
        x: Math.random() * 600 - 100, y: 15 + Math.random() * 30,
        w: 50 + Math.random() * 80, h: 15 + Math.random() * 15, spd: 0.1 + Math.random() * 0.2
      });
    }
    flowers = [];
    for (var fi = 0; fi < 12; fi++) {
      flowers.push({
        x: 20 + Math.random() * 260, y: 80 + Math.random() * 200,
        color: ['#FF69B4','#FFD700','#FF6347','#DA70D6','#FF1493','#FFA500'][Math.floor(Math.random() * 6)],
        size: 3 + Math.random() * 4
      });
    }
  }

  // Draw functions
  function drawBackground(bw, bh) {
    // Sky gradient
    var sky = ctx.createLinearGradient(0, 0, 0, bh * 0.55);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(0.6, '#B0E0FF');
    sky.addColorStop(1, '#E8F8FF');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, bw, bh);

    // Clouds
    clouds.forEach(function(c) {
      c.x += c.spd;
      if (c.x > bw + 100) c.x = -c.w - 20;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.25, c.y + 3, c.w * 0.3, c.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.25, c.y + 2, c.w * 0.3, c.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Grass
    var grd = ctx.createLinearGradient(0, bh * 0.5, 0, bh);
    grd.addColorStop(0, '#7CCD4A');
    grd.addColorStop(0.3, '#6BBF3A');
    grd.addColorStop(1, '#4A9A2A');
    ctx.fillStyle = grd;
    ctx.fillRect(0, bh * 0.5, bw, bh * 0.5);

    // Grass blades
    ctx.strokeStyle = 'rgba(50,120,30,0.3)';
    ctx.lineWidth = 1.5;
    for (var gi = 0; gi < 40; gi++) {
      var gx = (gi / 40) * bw + Math.sin(gi * 3) * 5;
      var gy = bh * 0.5 + 5 + Math.sin(gi * 7) * 10;
      ctx.beginPath();
      ctx.moveTo(gx, bh);
      ctx.quadraticCurveTo(gx + Math.sin(animTime + gi) * 3, bh - 8 - Math.random() * 6, gx + Math.sin(animTime * 0.7 + gi * 2) * 2, bh * 0.5 + 5 + Math.random() * 8);
      ctx.stroke();
    }

    // Fence
    ctx.strokeStyle = '#DEB887';
    ctx.lineWidth = 3;
    var fy = bh - 20;
    ctx.beginPath();
    ctx.moveTo(0, fy); ctx.lineTo(bw, fy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, fy - 18); ctx.lineTo(bw, fy - 18);
    ctx.stroke();
    ctx.fillStyle = '#DEB887';
    for (var pi = 0; pi < 20; pi++) {
      var px = pi * (bw / 19);
      ctx.fillRect(px - 2, fy - 28, 4, 34);
      ctx.strokeRect(px - 2, fy - 28, 4, 34);
    }

    // Flowers
    flowers.forEach(function(f) {
      ctx.fillStyle = '#2D8A2D';
      ctx.beginPath();
      ctx.moveTo(f.x, f.y + 8);
      ctx.lineTo(f.x - 2, f.y);
      ctx.lineTo(f.x + 2, f.y);
      ctx.fill();
      ctx.fillStyle = f.color;
      var fs = f.size;
      for (var p = 0; p < 5; p++) {
        var a = (p / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(a) * fs, f.y + Math.sin(a) * fs, fs * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(f.x, f.y, fs * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawKitty(x, y, s) {
    s = s || 1;
    var pop = kittyPop > 0 ? 1 + kittyPop * 0.5 : 1;
    var rotY = kittyPop > 0 ? kittyPop * 0.3 : Math.sin(animTime * 3) * 0.05;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pop, pop);
    ctx.rotate(rotY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.55, s * 0.4, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body/dress
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.45, s * 0.3, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F08AAD';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -s * 0.05, s * 0.37, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left ear
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.28);
    ctx.lineTo(-s * 0.14, -s * 0.48);
    ctx.lineTo(-s * 0.04, -s * 0.28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(-s * 0.19, -s * 0.30);
    ctx.lineTo(-s * 0.14, -s * 0.43);
    ctx.lineTo(-s * 0.08, -s * 0.30);
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(s * 0.04, -s * 0.28);
    ctx.lineTo(s * 0.14, -s * 0.48);
    ctx.lineTo(s * 0.22, -s * 0.28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(s * 0.08, -s * 0.30);
    ctx.lineTo(s * 0.14, -s * 0.43);
    ctx.lineTo(s * 0.19, -s * 0.30);
    ctx.fill();

    // Bow on right ear
    ctx.fillStyle = '#FF2E88';
    // Left loop
    ctx.beginPath();
    ctx.ellipse(s * 0.08, -s * 0.48, s * 0.12, s * 0.06, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right loop
    ctx.beginPath();
    ctx.ellipse(s * 0.20, -s * 0.48, s * 0.12, s * 0.06, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Center
    ctx.fillStyle = '#D6246E';
    ctx.beginPath();
    ctx.arc(s * 0.14, -s * 0.48, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // Tails
    ctx.strokeStyle = '#FF2E88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * 0.14, -s * 0.44);
    ctx.lineTo(s * 0.10, -s * 0.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.14, -s * 0.44);
    ctx.lineTo(s * 0.18, -s * 0.38);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(-s * 0.12, -s * 0.04, s * 0.04, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.12, -s * 0.04, s * 0.04, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-s * 0.10, -s * 0.06, s * 0.015, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.14, -s * 0.06, s * 0.015, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#FFB347';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.02, s * 0.03, s * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    [-1, 1].forEach(function(side) {
      var sx = side * s * 0.13;
      for (var wi = 0; wi < 3; wi++) {
        ctx.beginPath();
        ctx.moveTo(sx, s * 0.01 + wi * s * 0.04);
        ctx.lineTo(sx + side * s * (0.15 + wi * 0.02), s * (-0.02 + wi * s * 0.03));
        ctx.stroke();
      }
    });

    // Mouth
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, s * 0.07, s * 0.04, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.restore();
  }

  function spawnParticles(x, y) {
    for (var pi = 0; pi < 10; pi++) {
      var a = Math.random() * Math.PI * 2;
      var spd = 20 + Math.random() * 40;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 30,
        life: 0.6 + Math.random() * 0.4, maxLife: 1,
        size: 2 + Math.random() * 4,
        color: ['#FFD700','#FF69B4','#FFF','#FFA500','#FF1493'][Math.floor(Math.random() * 5)]
      });
    }
  }

  function spawnScorePopup(x, y) {
    scorePopups.push({
      x: x, y: y - 20, text: '+1', life: 1, vy: -40
    });
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    particles.forEach(function(p) {
      var a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function updatePopups(dt) {
    for (var i = scorePopups.length - 1; i >= 0; i--) {
      var p = scorePopups[i];
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) scorePopups.splice(i, 1);
    }
  }

  function drawPopups() {
    scorePopups.forEach(function(p) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = '#FF2E88';
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;
  }

  // Bounds
  function getBounds() {
    var kw = 64;
    var kh = 64;
    return {
      w: Math.max(0, canvas.width / (window.devicePixelRatio || 1) - kw),
      h: Math.max(0, canvas.height / (window.devicePixelRatio || 1) - kh)
    };
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (!paused) {
      lastTs = 0;
      rafId = requestAnimationFrame(loop);
    }
  }

  // Game loop
  function loop(ts) {
    if (!running) return;
    if (paused) {
      drawPauseOverlay();
      rafId = requestAnimationFrame(loop);
      return;
    }
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.04, (ts - lastTs) / 1000);
    lastTs = ts;
    animTime += dt;

    var b = resizeCanvas();
    var bw = b.w, bh = b.h;

    drawBackground(bw, bh);

    if (!dragging) {
      kittyX += kittyVX * (dt * 60);
      kittyY += kittyVY * (dt * 60);
      var kb = getBounds();
      if (kittyX <= 0) { kittyX = 0; kittyVX = Math.abs(kittyVX); }
      if (kittyY <= 0) { kittyY = 0; kittyVY = Math.abs(kittyVY); }
      if (kittyX >= kb.w) { kittyX = kb.w; kittyVX = -Math.abs(kittyVX); }
      if (kittyY >= kb.h) { kittyY = kb.h; kittyVY = -Math.abs(kittyVY); }
    }

    if (kittyPop > 0) kittyPop -= dt * 4;

    var kx = kittyX + 32;
    var ky = kittyY + 32 + Math.sin(animTime * 3) * 2;
    drawKitty(kx, ky, 32);

    updateParticles(dt);
    drawParticles();
    updatePopups(dt);
    drawPopups();

    rafId = requestAnimationFrame(loop);
  }

  function drawPauseOverlay() {
    var b = resizeCanvas();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, b.w, b.h);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO', b.w / 2, b.h / 2 - 10);
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Pressione ESC para continuar', b.w / 2, b.h / 2 + 22);
  }

  function startMove() {
    var b = getBounds();
    kittyX = Math.random() * Math.max(1, b.w - 10);
    kittyY = Math.random() * Math.max(1, b.h - 10);
    kittyX = Math.max(0, Math.min(kittyX, b.w));
    kittyY = Math.max(0, Math.min(kittyY, b.h));
    var speed = 40 + Math.random() * 30;
    var ang = Math.random() * Math.PI * 2;
    kittyVX = Math.cos(ang) * speed;
    kittyVY = Math.sin(ang) * speed;
    lastTs = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stopMove() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function openGame() {
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (fab) fab.style.display = 'none';
    getAudio();
    sndOpen();
    initScene();
    startGame();
  }

  function closeGame() {
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    if (fab) fab.style.display = '';
    sndClose();
    stopGame();
  }

  function startGame() {
    stopGame();
    score = 0;
    timeLeft = DURATION;
    particles = [];
    scorePopups = [];
    scoreEl.textContent = '0';
    timeEl.textContent = DURATION;
    timerFill.style.width = '100%';
    overEl.hidden = true;
    kittyPop = 0;
    running = true;
    startMove();
    if (timer) { clearInterval(timer); }
    timer = setInterval(function() {
      timeLeft -= 1;
      timeEl.textContent = timeLeft;
      timerFill.style.width = (timeLeft / DURATION * 100) + '%';
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  function stopGame() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
    stopMove();
  }

  function endGame() {
    stopGame();
    sndOver();
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    bestEl.textContent = best;
    overMsg.textContent = score > 0
      ? 'Voc\u00ea pegou ' + score + ' vez(es) a Hello Kitty! \u2764\ufe0f Recorde: ' + best
      : 'O tempo acabou! Tente novamente. \u2764\ufe0f';
    overEl.hidden = false;
    // Draw final frame
    resizeCanvas();
    var b = getBounds();
    drawBackground(b.w, b.h);
    drawKitty(kittyX + 32, kittyY + 32, 32);
  }

  function catchKitty(e) {
    if (!running) return;
    var rect = canvas.getBoundingClientRect();
    var cx = kittyX + 32, cy = kittyY + 32;
    var s = 32;
    var isTouch = !!e.touches;
    var pt = isTouch ? e.touches[0] : e;
    var mx = pt.clientX - rect.left;
    var my = pt.clientY - rect.top;
    var hitR = isTouch ? s * 1.0 : s * 0.6;
    if (Math.abs(mx - cx) > hitR || Math.abs(my - cy) > hitR) return;

    score += 1;
    scoreEl.textContent = score;
    sndCatch();
    kittyPop = 1;
    spawnParticles(cx, cy);
    spawnScorePopup(cx, cy);

    var b = getBounds();
    kittyX = Math.random() * Math.max(1, b.w - 10);
    kittyY = Math.random() * Math.max(1, b.h - 10);
    kittyX = Math.max(0, Math.min(kittyX, b.w));
    kittyY = Math.max(0, Math.min(kittyY, b.h));
    var speed = 50 + Math.random() * 40;
    var ang = Math.random() * Math.PI * 2;
    kittyVX = Math.cos(ang) * speed;
    kittyVY = Math.sin(ang) * speed;
  }

  // Events
  if (fab) fab.addEventListener('click', openGame);
  if (closeBtn) closeBtn.addEventListener('click', closeGame);
  if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) closeGame(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (modal && modal.classList.contains('active')) {
        closeGame();
      } else if (running) {
        togglePause();
      }
    }
  });
  if (restartBtn) restartBtn.addEventListener('click', startGame);

  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      var nt = document.querySelector('.nav-toggle');
      var sb = document.querySelector('.sidebar');
      var so = document.querySelector('.sidebar-overlay');
      if (nt) nt.classList.add('active');
      if (sb) sb.classList.add('active');
      if (so) so.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  var sidebarLink = document.getElementById('sidebar-open-game');
  if (sidebarLink) {
    sidebarLink.addEventListener('click', function(e) {
      e.preventDefault();
      var sb = document.querySelector('.sidebar');
      var so = document.querySelector('.sidebar-overlay');
      var nt = document.querySelector('.nav-toggle');
      if (sb) sb.classList.remove('active');
      if (so) so.classList.remove('active');
      if (nt) nt.classList.remove('active');
      openGame();
    });
  }

  var footerLink = document.getElementById('footer-open-game');
  if (footerLink) {
    footerLink.addEventListener('click', function(e) {
      e.preventDefault();
      openGame();
    });
  }

  var homeLink = document.getElementById('home-open-game');
  if (homeLink) {
    homeLink.addEventListener('click', function(e) {
      e.preventDefault();
      openGame();
    });
  }

  // Canvas hit detection (click/touch)
  canvas.addEventListener('click', catchKitty);
  canvas.addEventListener('touchstart', function(e) { e.preventDefault(); catchKitty(e); }, { passive: false });

  // Drag
  function dragStart(e) {
    if (!running) return;
    var pt = e.touches ? e.touches[0] : e;
    var rect = canvas.getBoundingClientRect();
    var mx = pt.clientX - rect.left;
    var my = pt.clientY - rect.top;
    var cx = kittyX + 32, cy = kittyY + 32;
    if (Math.abs(mx - cx) > 40 || Math.abs(my - cy) > 40) return;
    dragging = true;
    dragOffX = mx - kittyX;
    dragOffY = my - kittyY;
    e.preventDefault();
  }

  function dragMove(e) {
    if (!dragging) return;
    var pt = e.touches ? e.touches[0] : e;
    var rect = canvas.getBoundingClientRect();
    var mx = pt.clientX - rect.left - dragOffX;
    var my = pt.clientY - rect.top - dragOffY;
    var b = getBounds();
    kittyX = Math.max(0, Math.min(mx, b.w));
    kittyY = Math.max(0, Math.min(my, b.h));
    e.preventDefault();
  }

  function dragEnd() { dragging = false; }

  canvas.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('mouseup', dragEnd);
  canvas.addEventListener('touchstart', dragStart, { passive: false });
  document.addEventListener('touchmove', dragMove, { passive: false });
  document.addEventListener('touchend', dragEnd);

  window.addEventListener('resize', function() {
    // Canvas gets resized on next frame via resizeCanvas()
  });

  if (opts.autoStart) {
    getAudio();
    initScene();
    startGame();
  }
};
