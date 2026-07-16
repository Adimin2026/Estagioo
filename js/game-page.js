// Jogo Hello Kitty embutido na página pages/jogo.html.
// Reutiliza a lógica de window.initGame (definida em game.js), mas aponta
// para os elementos da página (sem o botão flutuante) e inicia automaticamente.
window.initGamePage = function () {
  if (document.documentElement.dataset.gamePageInit === 'true') return;
  document.documentElement.dataset.gamePageInit = 'true';

  const stage = document.getElementById('game-stage');
  const kitty = document.getElementById('game-kitty');
  const timeEl = document.getElementById('game-time');
  const scoreEl = document.getElementById('game-score');
  const bestEl = document.getElementById('game-best');
  const overEl = document.getElementById('game-over');
  const overMsg = document.getElementById('game-over-msg');
  const restartBtn = document.getElementById('game-restart');
  const menuBtn = document.getElementById('game-menu');

  if (!stage || !kitty) return;

  const BEST_KEY = 'hkGameBest';
  const DURATION = 30;
  let timeLeft = DURATION;
  let score = 0;
  let best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
  let timer = null;
  let rafId = null;
  let running = false;

  bestEl.textContent = best;

  let audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function beep(freq, dur, type, vol) {
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }
  function soundCatch() { beep(880, 0.12, 'triangle', 0.2); setTimeout(() => beep(1320, 0.12, 'triangle', 0.18), 90); }
  function soundOver() {
    beep(660, 0.18, 'sine', 0.2);
    setTimeout(() => beep(523, 0.18, 'sine', 0.2), 160);
    setTimeout(() => beep(392, 0.28, 'sine', 0.2), 320);
  }

  const pos = { x: 12, y: 12 };
  const vel = { x: 2.4, y: 1.8 };
  let last = 0;

  function stageBounds() {
    const kw = kitty.offsetWidth || 64;
    const kh = kitty.offsetHeight || 64;
    return { w: Math.max(0, stage.clientWidth - kw), h: Math.max(0, stage.clientHeight - kh) };
  }

  function loop(ts) {
    if (!running) return;
    if (!last) last = ts;
    const dt = Math.min(40, ts - last);
    last = ts;
    if (!dragging) {
      const b = stageBounds();
      pos.x += vel.x * (dt / 16);
      pos.y += vel.y * (dt / 16);
      if (pos.x <= 0) { pos.x = 0; vel.x = Math.abs(vel.x); }
      if (pos.y <= 0) { pos.y = 0; vel.y = Math.abs(vel.y); }
      if (pos.x >= b.w) { pos.x = b.w; vel.x = -Math.abs(vel.x); }
      if (pos.y >= b.h) { pos.y = b.h; vel.y = -Math.abs(vel.y); }
      kitty.style.left = pos.x + 'px';
      kitty.style.top = pos.y + 'px';
    }
    rafId = requestAnimationFrame(loop);
  }

  function startMove() {
    cancelAnimationFrame(rafId);
    const b = stageBounds();
    pos.x = 12 + Math.random() * Math.max(1, b.w - 12);
    pos.y = 12 + Math.random() * Math.max(1, b.h - 12);
    const speed = 2.2 + Math.random() * 1.4;
    const ang = Math.random() * Math.PI * 2;
    vel.x = Math.cos(ang) * speed;
    vel.y = Math.sin(ang) * speed;
    last = 0;
    kitty.classList.add('walking');
    rafId = requestAnimationFrame(loop);
  }

  function stopMove() {
    cancelAnimationFrame(rafId);
    rafId = null;
    kitty.classList.remove('walking');
  }

  function startGame() {
    stopGame();
    score = 0;
    timeLeft = DURATION;
    scoreEl.textContent = score;
    timeEl.textContent = timeLeft;
    overEl.hidden = true;
    running = true;
    startMove();
    timer = setInterval(tick, 1000);
  }

  function stopGame() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
    stopMove();
  }

  function tick() {
    timeLeft -= 1;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }

  function endGame() {
    stopGame();
    soundOver();
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    bestEl.textContent = best;
    overMsg.textContent = score > 0
      ? `Você pegou ${score} laço(s) da Hello Kitty! 💕 Recorde: ${best}`
      : 'O tempo acabou! Tente pegar a Hello Kitty nos próximos laços. 💕';
    overEl.hidden = false;
  }

  function catchKitty() {
    if (!running) return;
    score += 1;
    scoreEl.textContent = score;
    soundCatch();
    kitty.classList.remove('pop');
    void kitty.offsetWidth;
    kitty.classList.add('pop');
    const b = stageBounds();
    pos.x = 12 + Math.random() * Math.max(1, b.w - 12);
    pos.y = 12 + Math.random() * Math.max(1, b.h - 12);
    const speed = 2.4 + Math.random() * 1.6;
    const ang = Math.random() * Math.PI * 2;
    vel.x = Math.cos(ang) * speed;
    vel.y = Math.sin(ang) * speed;
  }

  if (restartBtn) restartBtn.addEventListener('click', startGame);
  kitty.addEventListener('click', catchKitty);
  kitty.addEventListener('touchstart', (e) => { e.preventDefault(); catchKitty(); }, { passive: false });

  let dragging = false;
  let offX = 0, offY = 0;
  function dragStart(e) {
    if (!running) return;
    dragging = true;
    kitty.classList.add('grabbing');
    const pt = e.touches ? e.touches[0] : e;
    const rect = kitty.getBoundingClientRect();
    offX = pt.clientX - rect.left;
    offY = pt.clientY - rect.top;
    e.preventDefault();
  }
  function dragMove(e) {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    const stageRect = stage.getBoundingClientRect();
    let x = pt.clientX - stageRect.left - offX;
    let y = pt.clientY - stageRect.top - offY;
    const b = stageBounds();
    x = Math.max(0, Math.min(x, b.w));
    y = Math.max(0, Math.min(y, b.h));
    pos.x = x; pos.y = y;
    kitty.style.left = x + 'px';
    kitty.style.top = y + 'px';
    e.preventDefault();
  }
  function dragEnd() { dragging = false; kitty.classList.remove('grabbing'); }

  kitty.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('mouseup', dragEnd);
  kitty.addEventListener('touchstart', dragStart, { passive: false });
  kitty.addEventListener('touchmove', dragMove, { passive: false });
  kitty.addEventListener('touchend', dragEnd);

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      const navToggle = document.querySelector('.nav-toggle');
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (navToggle) navToggle.classList.add('active');
      if (sidebar) sidebar.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  window.addEventListener('resize', () => {
    const b = stageBounds();
    pos.x = Math.min(pos.x, b.w);
    pos.y = Math.min(pos.y, b.h);
  });

  // Inicia automaticamente ao carregar a página
  getAudio();
  startGame();
};
