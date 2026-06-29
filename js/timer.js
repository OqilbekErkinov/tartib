const Timer = (() => {
  const RADIUS = 88;
  const CIRC   = 2 * Math.PI * RADIUS; // ≈ 552.9

  let _total    = 25 * 60;
  let _remaining= 25 * 60;
  let _interval = null;
  let _running  = false;
  let _wakeLock = null;
  let _clockInt = null;

  // ── RENDER ───────────────────────────────────────────────────
  function render() {
    const { mm, ss, offset } = calcDisplay();

    const PRESETS = [
      { label: '5 min',     s: 5  * 60 },
      { label: '10 min',    s: 10 * 60 },
      { label: '25 min',    s: 25 * 60 },
      { label: '45 min',    s: 45 * 60 },
      { label: '1 soat',    s: 60 * 60 },
    ];

    return `<div class="page-enter timer-page">

      <div class="timer-presets">
        ${PRESETS.map(p =>
          `<button class="timer-preset-btn${_total === p.s ? ' active' : ''}"
            onclick="Timer.setPreset(${p.s})">${p.label}</button>`
        ).join('')}
      </div>

      <div class="timer-ring-wrap">
        <svg class="timer-svg" viewBox="0 0 200 200">
          <circle class="timer-ring-bg" cx="100" cy="100" r="${RADIUS}"/>
          <circle class="timer-ring-fg" cx="100" cy="100" r="${RADIUS}"
            stroke-dasharray="${CIRC.toFixed(2)}"
            stroke-dashoffset="${offset.toFixed(2)}"
            id="timerRing"
            style="transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset .9s linear"/>
        </svg>
        <div class="timer-display-wrap">
          <div class="timer-time" id="timerDisplay">${mm}:${ss}</div>
          <div class="timer-status" id="timerStatus">${statusText()}</div>
        </div>
      </div>

      <div class="timer-controls">
        <button class="timer-ctrl-btn secondary" onclick="Timer.reset()" title="Qayta boshlash">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
        </button>
        <button class="timer-ctrl-btn main" id="timerToggleBtn" onclick="Timer.toggle()">
          ${playIcon()}
        </button>
      </div>

      <div class="timer-custom-wrap">
        <div class="timer-custom-label">O'z vaqtingizni kiriting</div>
        <div class="timer-custom-row">
          <input class="form-input timer-custom-input" id="timerCustomMin"
            type="number" min="1" max="180" placeholder="daqiqa (1–180)">
          <button class="btn btn-primary" onclick="Timer.setCustom()">O'rnatish</button>
        </div>
      </div>

      <button class="timer-clock-btn" onclick="Timer.openClock()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Soatni ochish
      </button>

    </div>`;
  }

  // ── HELPERS ───────────────────────────────────────────────────
  function calcDisplay() {
    const mm     = String(Math.floor(_remaining / 60)).padStart(2, '0');
    const ss     = String(_remaining % 60).padStart(2, '0');
    const pct    = _total > 0 ? _remaining / _total : 0;
    const offset = CIRC * (1 - pct);
    return { mm, ss, offset };
  }

  function statusText() {
    if (_running)                         return 'davom etmoqda';
    if (_remaining === 0)                 return 'tugadi!';
    if (_remaining < _total)              return "to'xtatilgan";
    return 'boshlashga tayyor';
  }

  function playIcon() {
    return _running
      ? `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
           <rect x="6" y="4" width="4" height="16" rx="1.5"/>
           <rect x="14" y="4" width="4" height="16" rx="1.5"/>
         </svg>`
      : `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
           <polygon points="5 3 19 12 5 21"/>
         </svg>`;
  }

  // ── LOGIC ─────────────────────────────────────────────────────
  function tick() {
    if (_remaining <= 0) {
      clearInterval(_interval); _interval = null; _running = false;
      updateDOM();
      playDone();
      if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 600]);
      App.Toast('⏰ Vaqt tugadi!', 'success');
      document.title = 'Tartibla';
      return;
    }
    _remaining--;
    updateDOM();
    if (_running) document.title =
      `${String(Math.floor(_remaining/60)).padStart(2,'0')}:${String(_remaining%60).padStart(2,'0')} · Tartibla`;
  }

  function toggle() {
    if (_remaining <= 0) { reset(); return; }
    _running = !_running;
    if (_running) {
      _interval = setInterval(tick, 1000);
    } else {
      clearInterval(_interval); _interval = null;
      document.title = 'Tartibla';
    }
    updateDOM();
  }

  function reset() {
    clearInterval(_interval); _interval = null;
    _running   = false;
    _remaining = _total;
    document.title = 'Tartibla';
    updateDOM();
  }

  function setPreset(seconds) {
    clearInterval(_interval); _interval = null;
    _running   = false;
    _total     = seconds;
    _remaining = seconds;
    document.title = 'Tartibla';
    App.renderPage('timer');
  }

  function setCustom() {
    const val = parseInt(document.getElementById('timerCustomMin')?.value);
    if (!val || val < 1 || val > 180) { App.Toast('1–180 oralig\'ida daqiqa kiriting'); return; }
    setPreset(val * 60);
  }

  function updateDOM() {
    const { mm, ss, offset } = calcDisplay();
    const display = document.getElementById('timerDisplay');
    const ring    = document.getElementById('timerRing');
    const btn     = document.getElementById('timerToggleBtn');
    const status  = document.getElementById('timerStatus');

    if (display) display.textContent = `${mm}:${ss}`;
    if (ring)    ring.style.strokeDashoffset = offset;
    if (btn)     btn.innerHTML = playIcon();
    if (status)  status.textContent = statusText();
  }

  // ── BEEP ──────────────────────────────────────────────────────
  function playDone() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [[880, 0], [880, 0.4], [1100, 0.8]].forEach(([freq, t]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.45);
      });
    } catch(e) {}
  }

  // ── FULLSCREEN CLOCK ─────────────────────────────────────────
  function openClock() {
    if (document.getElementById('clockOverlay')) return;

    const el = document.createElement('div');
    el.id = 'clockOverlay';
    el.className = 'clock-overlay';
    el.innerHTML = `
      <div class="clock-content">
        <div class="clock-time" id="clockTime">00:00:00</div>
        <div class="clock-date" id="clockDate"></div>
        <div class="clock-hint">Yopish uchun bosing</div>
      </div>`;
    el.addEventListener('click', closeClock);
    document.body.appendChild(el);

    // Ekran o'chmasligi uchun Wake Lock
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => { _wakeLock = lock; })
        .catch(() => {});
    }

    tickClock();
    _clockInt = setInterval(tickClock, 1000);
  }

  function tickClock() {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const s   = String(now.getSeconds()).padStart(2, '0');
    const DAYS   = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
    const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

    const tEl = document.getElementById('clockTime');
    const dEl = document.getElementById('clockDate');
    if (tEl) tEl.textContent = `${h}:${m}:${s}`;
    if (dEl) dEl.textContent = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  }

  function closeClock() {
    clearInterval(_clockInt); _clockInt = null;
    if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null; }
    const el = document.getElementById('clockOverlay');
    if (el) el.remove();
  }

  return { render, toggle, reset, setPreset, setCustom, openClock, closeClock };
})();
