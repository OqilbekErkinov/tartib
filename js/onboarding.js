const Onboarding = (() => {
  const STEPS = {
    dashboard: [
      {
        selector: '.header-theme-btn',
        title: 'Tungi rejim',
        desc: 'Bu tugma orqali ilovani qorong\'i yoki yorug\' rejimga o\'tkaring. Ko\'z charchamasin uchun kechasi qorong\'i rejimdan foydalaning.',
      },
    ],
    finance: [
      {
        selector: '.btn-income',
        title: 'Daromad qo\'shish',
        desc: 'Maosh, mustaqil ish yoki boshqa daromadlaringizni shu tugma orqali kiriting. Sana va izoh ham belgilash mumkin.',
      },
      {
        selector: '.btn-expense',
        title: 'Xarajat qo\'shish',
        desc: 'Har bir xarajatni bo\'lim bo\'yicha kiriting. Ilova avtomatik balansni hisoblab beradi.',
      },
      {
        selector: '#obDebtOldim',
        title: 'Qarz oldim',
        desc: 'Birovdan qarz olganingizda shu tugmani bosing. Kim berganini, miqdorni va muddatni kiriting — esdan chiqmaydi.',
        scrollTo: true,
      },
      {
        selector: '#obDebtBerdim',
        title: 'Qarz berdim',
        desc: 'Birovga qarz berganingizda bu tugmani bosing. Kim olganini va muddatini belgilasangiz, kuzatib borasiz.',
        scrollTo: true,
      },
    ],
    habits: [
      {
        selector: '#headerAction',
        title: 'Odat qo\'shish',
        desc: 'Yangi kunlik odat yaratish uchun + tugmasini bosing. Vaqt belgilasangiz, telefonga eslatma keladi.',
      },
    ],
    books: [
      {
        selector: '#headerAction',
        title: 'Kitob qo\'shish',
        desc: 'Kutubxonangizga yangi kitob qo\'shing. O\'qish holati va izohlaringizni saqlaysiz.',
      },
      {
        selector: '.ob-lend-btn',
        title: 'Kitob berish',
        desc: 'Kitobni do\'stingizga berayotganingizda "Berish" tugmasini bosing. Kim olganini va sanani saqlaysiz.',
        beforeFn: () => Books.setTab('unread'),
      },
      {
        selector: '.ob-qaytdi-btn',
        title: 'Kitob qaytdi',
        desc: 'Do\'stingiz kitobni qaytarsa "Qaytdi" tugmasini bosing. Kitob kutubxonangizga avtomatik qaytadi.',
        beforeFn: () => Books.setTab('lent'),
      },
    ],
    goals: [
      {
        selector: '#headerAction',
        title: 'Maqsad belgilash',
        desc: 'Yangi maqsad yarating va foizli jarayonini kuzating. Har bir qadam sizni maqsadga yaqinlashtiradi.',
      },
    ],
    more: [
      {
        selector: '#obTimerCard',
        title: 'Fokus Timer',
        desc: 'Dars yoki ish paytida fokusda qolish uchun timer. Ichida chiroyli soat ko\'rinishi ham mavjud.',
      },
      {
        selector: '#obFeedbackCard',
        title: 'Muammo yoki taklif',
        desc: 'Ilovada biror narsa noto\'g\'ri ishlasa yoki yangi funksiya istasangiz — shu yerdan yozing. Javob beramiz.',
        scrollTo: true,
      },
      {
        selector: '#obMoreProfile',
        title: 'Profil',
        desc: 'Ismingizni kiriting, hisobotlarni yuklab oling, ilovani telefonga o\'rnating va hisob sozlamalarini boshqaring.',
        beforeFn: () => {
          const mc = document.getElementById('mainContent');
          if (mc) mc.scrollTo({ top: 0, behavior: 'smooth' });
        },
      },
    ],
    subscriptions: [
      {
        selector: '#headerAction',
        title: 'Obuna qo\'shish',
        desc: 'Netflix, Spotify kabi oylik to\'lovlarni bu yerga kiriting. Ilova muddatlar haqida ogohlantiradi.',
      },
    ],
    notes: [
      {
        selector: '#headerAction',
        title: 'Eslatma qo\'shish',
        desc: 'Muhim fikr, g\'oya yoki eslatmalaringizni saqlang. Qidiruv orqali tez topasiz.',
      },
    ],
    profile: [
      {
        selector: '#obProfileEdit',
        title: 'Profilni tahrirlash',
        desc: 'Ismingiz va familiyangizni kiriting. Profil sahifangiz yanada shaxsiylashadi.',
      },
      {
        selector: '#obProfileReport',
        title: 'Moliya hisoboti',
        desc: 'Barcha daromad, xarajat va qarzlaringizni Word hujjat sifatida yuklab oling. Do\'stlar yoki buxgalter uchun qulay.',
      },
      {
        selector: '#obBooksReport',
        title: 'Kitoblar hisoboti',
        desc: 'Jami, o\'qilgan, o\'qilayotgan, yangi va kimgadir berilgan kitoblar ro\'yxatini Word faylda yuklab oling.',
      },
      {
        selector: '#obProfileInstall',
        title: 'Ilovani o\'rnatish',
        desc: 'Tartibla ilovasini telefon ekraniga qo\'shing. O\'rnatilgach internet bo\'lmasa ham ishlaydi va ikonka orqali tez ochiladi.',
        scrollTo: true,
      },
      {
        selector: '#obProfilePassword',
        title: 'Parolni o\'zgartirish',
        desc: 'Xavfsizlik uchun parolingizni vaqti-vaqti bilan yangilang. Parol kamida 6 ta belgidan iborat bo\'lishi kerak.',
        scrollTo: true,
      },
      {
        selector: '#obProfileLogout',
        title: 'Tizimdan chiqish',
        desc: 'Hisobdan xavfsiz chiqish. Chiqsangiz ham ma\'lumotlaringiz bulutda saqlanadi — keyingi safar kirsangiz hammasi o\'rnida bo\'ladi.',
        scrollTo: true,
      },
    ],
  };

  let _page = null;
  let _step = 0;

  // ── STATE ─────────────────────────────────────────────────────
  function isDone(page) {
    try { return !!(JSON.parse(localStorage.getItem('ob_done') || '{}')[page]); }
    catch { return false; }
  }

  function markDone(page) {
    try {
      const done = JSON.parse(localStorage.getItem('ob_done') || '{}');
      done[page] = 1;
      localStorage.setItem('ob_done', JSON.stringify(done));
    } catch {}
  }

  // ── PUBLIC ────────────────────────────────────────────────────
  function showForPage(page) {
    if (isDone(page) || !STEPS[page]) return;
    // If already on same page mid-tour, don't restart
    if (_page === page && _step > 0) return;
    _page = page;
    _step = 0;
    setTimeout(showStep, 380);
  }

  // ── STEP LOGIC ────────────────────────────────────────────────
  function showStep() {
    document.getElementById('obOverlay')?.remove();
    const steps = STEPS[_page];
    if (!steps || _step >= steps.length) { finish(); return; }

    const step = steps[_step];

    if (step.beforeFn) {
      step.beforeFn();
      // Wait for re-render after tab switch
      setTimeout(() => {
        const target = document.querySelector(step.selector);
        if (!target) { _step++; showStep(); return; }
        scrollThenShow(target, step);
      }, 450);
      return;
    }

    const target = document.querySelector(step.selector);
    if (!target) { _step++; showStep(); return; }
    scrollThenShow(target, step);
  }

  function scrollThenShow(target, step) {
    const rect = target.getBoundingClientRect();
    const VH   = window.innerHeight;
    const inView = rect.top >= 60 && rect.bottom <= VH - 60;

    if (!inView || step.scrollTo) {
      const main = document.getElementById('mainContent');
      if (main) {
        const targetOffset = target.offsetTop - main.offsetTop - VH / 2 + target.offsetHeight / 2;
        main.scrollTo({ top: Math.max(0, targetOffset), behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => buildOverlay(target, step), 520);
    } else {
      buildOverlay(target, step);
    }
  }

  // ── OVERLAY ───────────────────────────────────────────────────
  function buildOverlay(target, step) {
    document.getElementById('obOverlay')?.remove();

    const rect  = target.getBoundingClientRect();
    const VH    = window.innerHeight;
    const VW    = window.innerWidth;
    const PAD   = 10;
    const steps = STEPS[_page];
    const current = _step + 1;
    const total   = steps.length;

    const sx = rect.left - PAD;
    const sy = rect.top  - PAD;
    const sw = rect.width  + PAD * 2;
    const sh = rect.height + PAD * 2;
    const sr = 10;

    const bubbleW = Math.min(VW - 32, 300);
    const bubbleH = 160;

    const below = (rect.top + rect.height / 2) < VH * 0.52;
    let bubbleTop = below
      ? Math.min(rect.bottom + PAD + 40, VH - bubbleH - 16)
      : Math.max(rect.top - PAD - 40 - bubbleH, 72);

    const idealLeft  = rect.left + rect.width / 2 - bubbleW / 2;
    const bubbleLeft = Math.max(16, Math.min(VW - bubbleW - 16, idealLeft));
    const bubbleMidX = bubbleLeft + bubbleW / 2;

    const lx1 = rect.left + rect.width / 2;
    const ly1 = below ? rect.bottom + PAD : rect.top - PAD;
    const lx2 = bubbleMidX;
    const ly2 = below ? bubbleTop : bubbleTop + bubbleH;
    const cpx = (lx1 + lx2) / 2;
    const cpy = (ly1 + ly2) / 2 + (below ? -20 : 20);

    const el = document.createElement('div');
    el.id = 'obOverlay';
    el.style.cssText = 'position:fixed;inset:0;z-index:7999;';

    el.innerHTML = `
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="obMask">
            <rect width="100%" height="100%" fill="white"/>
            <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${sr}" fill="black"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#obMask)"/>
        <path d="M ${lx1} ${ly1} Q ${cpx} ${cpy} ${lx2} ${ly2}"
          fill="none" stroke="rgba(245,143,32,0.75)" stroke-width="1.8"
          stroke-dasharray="5,4" stroke-linecap="round"/>
        <circle cx="${lx1}" cy="${ly1}" r="4.5" fill="#F58F20" opacity="0.95"/>
        <circle cx="${lx2}" cy="${ly2}" r="3"   fill="#F58F20" opacity="0.7"/>
      </svg>

      <div style="
        position:absolute;
        left:${sx - 3}px; top:${sy - 3}px;
        width:${sw + 6}px; height:${sh + 6}px;
        border-radius:${sr + 3}px;
        border:2px solid rgba(245,143,32,0.85);
        box-shadow:0 0 0 4px rgba(245,143,32,0.12);
        pointer-events:none;
        animation:ob-pulse 1.8s ease-in-out infinite;
      "></div>

      <div class="ob-bubble" style="left:${bubbleLeft}px;top:${bubbleTop}px;width:${bubbleW}px">
        <div class="ob-step-tag">${current} / ${total}</div>
        <div class="ob-title">${step.title}</div>
        <div class="ob-desc">${step.desc}</div>
        <div class="ob-actions">
          <button class="ob-skip" onclick="Onboarding.finish()">O'tkazib yuborish</button>
          <button class="ob-btn"  onclick="Onboarding.next()">
            ${current < total ? 'Tushundim →' : 'Tushundim ✓'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(el);
  }

  // ── CONTROLS ─────────────────────────────────────────────────
  function next() {
    _step++;
    showStep();
  }

  function finish() {
    document.getElementById('obOverlay')?.remove();
    if (_page) markDone(_page);
    _page = null;
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });

  return { showForPage, next, finish };
})();
