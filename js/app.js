// ===== MODAL HELPERS =====
function openModal(title, body) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modal').classList.remove('open');
}

// ===== APP =====
const App = (() => {
  // --- UI Helpers ---
  function Toast(msg, type = 'error') {
    const t = document.createElement('div');
    t.className = 'ui-toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 2500);
  }

  function Confirm(msg, onConfirm) {
    openModal('Tasdiqlash', `
      <p style="text-align:center;font-size:15px;margin-bottom:20px">${msg}</p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost btn-full" onclick="closeModal()">Bekor qilish</button>
        <button class="btn btn-danger btn-full" id="confirmOkBtn">O'chirish</button>
      </div>
    `);
    document.getElementById('confirmOkBtn').onclick = () => {
      closeModal();
      onConfirm();
    };
  }

  const PAGE_CONFIG = {
    dashboard:     { title: 'Tartibla',      addFn: null },
    finance:       { title: 'Moliya',        addFn: () => Finance.openAdd('expense') },
    books:         { title: 'Kitoblar',      addFn: () => Books.openAdd() },
    habits:        { title: 'Odatlar',       addFn: () => Habits.openAdd() },
    goals:         { title: 'Maqsadlar',     addFn: () => Goals.openAdd() },
    subscriptions: { title: 'Obunalar',      addFn: () => Subscriptions.openAdd() },
    notes:         { title: 'Eslatmalar',    addFn: () => Notes.openAdd() },
    profile:       { title: 'Profil',        addFn: null },
    more:          { title: "Ko'proq",       addFn: null },
  };

  let currentPage = 'dashboard';

  function navigate(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => {
      const pg = el.dataset.page;
      const isActive = pg === page || (pg === 'more' && ['goals','subscriptions','notes','profile'].includes(page));
      el.classList.toggle('active', isActive);
    });
    renderPage(page);
  }

  function renderPage(page) {
    const cfg = PAGE_CONFIG[page] || PAGE_CONFIG.dashboard;
    document.getElementById('pageTitle').textContent = cfg.title;
    const actionBtn = document.getElementById('headerAction');
    if (cfg.addFn) {
      actionBtn.style.display = 'flex';
      actionBtn.onclick = cfg.addFn;
    } else {
      actionBtn.style.display = 'none';
    }

    let html = '';
    switch (page) {
      case 'dashboard':     html = renderDashboard(); break;
      case 'finance':       html = Finance.render(); break;
      case 'books':         html = Books.render(); break;
      case 'habits':        html = Habits.render(); break;
      case 'goals':         html = Goals.render(); break;
      case 'subscriptions': html = Subscriptions.render(); break;
      case 'notes':         html = Notes.render(); break;
      case 'profile':       html = Profile.render(); break;
      case 'more':          html = renderMore(); break;
      default:              html = renderDashboard();
    }

    document.getElementById('mainContent').innerHTML = html;
    document.getElementById('mainContent').scrollTop = 0;
  }

  function renderDashboard() {
    const txs = DB.getTransactions();
    const now = new Date();
    const monthTxs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const income  = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    const balance = txs.reduce((s,t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);

    const habits      = DB.getHabits();
    const todayLog    = (DB.getHabitLogs())[todayStr()] || {};
    const todayDayIdx = new Date().getDay();
    const todayHabits = habits.filter(h => !h.schedule || h.schedule.type === 'daily' || (h.schedule.days||[]).includes(todayDayIdx));
    const habitsDone  = todayHabits.filter(h => todayLog[h.id]).length;

    const books = DB.getBooks();
    const goals = DB.getGoals();
    const subs  = DB.getSubs();
    const notes = DB.getNotes();
    const monthName = now.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });

    // Active goals
    const activeGoals = goals.filter(g => !g.done).slice(0, 2);
    const goalsHtml = activeGoals.length ? `
      <div class="section-head"><h2>Maqsadlar</h2></div>
      ${activeGoals.map(g => {
        const pct = g.target ? Math.min(100, Math.round((g.current || 0) / g.target * 100)) : 0;
        return `<div class="goal-card" onclick="App.go('goals')" style="cursor:pointer">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${g.type==='numeric'?'10px':'0'}">
            <div style="font-weight:800;font-size:15px;letter-spacing:-.1px">${escapeHtml(g.title)}</div>
            ${g.deadline ? `<span class="badge badge-orange" style="font-size:10px">${fmtDate(g.deadline)}</span>` : ''}
          </div>
          ${g.type === 'numeric' ? `
            <div class="progress-bar" style="margin-bottom:5px"><div class="progress-fill" style="width:${pct}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);font-weight:600">
              <span>${fmtMoney(g.current || 0)} so'm</span>
              <span>${pct}% · ${fmtMoney(g.target)} so'm</span>
            </div>` : ''}
        </div>`;
      }).join('')}` : '';

    // Upcoming subs
    const upcoming = subs.filter(s => !s.paused && s.nextDate)
      .sort((a,b) => new Date(a.nextDate) - new Date(b.nextDate)).slice(0, 2);
    const upcomingHtml = upcoming.length ? `
      <div class="section-head"><h2>Yaqin to'lovlar</h2></div>
      ${upcoming.map(s => {
        const days = Math.ceil((new Date(s.nextDate) - new Date()) / 86400000);
        return `<div class="list-item">
          <div class="list-item-icon" style="background:var(--orange-light)">📦</div>
          <div class="list-item-body">
            <div class="list-item-title">${escapeHtml(s.name)}</div>
            <div class="list-item-sub">${fmtDate(s.nextDate)}</div>
          </div>
          <div class="list-item-right">
            <div style="font-weight:800;font-size:15px">${fmtMoney(s.amount)}</div>
            <span class="badge ${days <= 3 ? 'badge-red' : 'badge-orange'}" style="margin-top:3px;display:inline-flex">${days}k</span>
          </div>
        </div>`;
      }).join('')}` : '';

    return `<div class="page-enter">
      <div class="hero-card hero-dark">
        <div class="hero-label">Umumiy balans</div>
        <div class="hero-amount">${fmtMoney(balance)} <span style="font-size:18px;font-weight:600;opacity:.7">so'm</span></div>
        <div class="hero-row">
          <div class="hero-stat">
            <div class="hero-stat-v" style="color:#6AE06A">+${fmtMoney(income)}</div>
            <div class="hero-stat-l">Daromad</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.15)"></div>
          <div class="hero-stat">
            <div class="hero-stat-v" style="color:#FF9090">−${fmtMoney(expense)}</div>
            <div class="hero-stat-l">Xarajat</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.15)"></div>
          <div class="hero-stat">
            <div class="hero-stat-v">${monthName.split(' ')[0]}</div>
            <div class="hero-stat-l">Bu oy</div>
          </div>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" onclick="App.go('habits')" style="cursor:pointer;border-top:3px solid var(--green)">
          <div class="stat-label">Bugungi odatlar</div>
          <div class="stat-value" style="color:var(--green)">${habitsDone}<span style="font-size:16px;font-weight:600;color:var(--text3)">/${todayHabits.length}</span></div>
          <div class="stat-sub">bajarildi</div>
        </div>
        <div class="stat-card" onclick="App.go('books')" style="cursor:pointer;border-top:3px solid var(--orange)">
          <div class="stat-label">Kitoblar</div>
          <div class="stat-value" style="color:var(--orange)">${books.length}</div>
          <div class="stat-sub">${books.filter(b => b.status === 'reading').length} ta o'qilmoqda</div>
        </div>
      </div>

      ${goalsHtml}
      ${upcomingHtml}

      <div class="section-head"><h2>Qo'shimcha</h2></div>
      <div class="more-grid">
        <button class="more-card" onclick="App.go('notes')">
          <div class="more-card-icon">📝</div>
          <div class="more-card-title">Eslatmalar</div>
          <div class="more-card-sub">${notes.length} ta eslatma</div>
        </button>
        <button class="more-card" onclick="App.go('subscriptions')">
          <div class="more-card-icon">📦</div>
          <div class="more-card-title">Obunalar</div>
          <div class="more-card-sub">${subs.filter(s => !s.paused).length} ta faol</div>
        </button>
      </div>
    </div>`;
  }

  function renderMore() {
    const user      = Auth.getUser();
    const initials  = Profile.getInitials(user);
    const name      = Profile.getUserDisplayName(user);
    const email     = user?.email || '';
    const hasName   = user?.user_metadata?.first_name || user?.user_metadata?.last_name;

    return `<div class="page-enter">

      <!-- Profile shortcut -->
      <button class="more-profile-card" onclick="App.go('profile')">
        <div class="more-profile-avatar">${escapeHtml(initials)}</div>
        <div style="flex:1;min-width:0;text-align:left">
          <div style="font-size:15px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(name)}</div>
          ${hasName ? `<div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:1px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(email)}</div>` : ''}
          <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;font-weight:500">Profilni ko'rish →</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <div class="more-grid">
        <button class="more-card" onclick="App.go('goals')">
          <div class="more-card-icon">🎯</div>
          <div class="more-card-title">Maqsadlar</div>
          <div class="more-card-sub">${DB.getGoals().filter(g => !g.done).length} ta faol</div>
        </button>
        <button class="more-card" onclick="App.go('subscriptions')">
          <div class="more-card-icon">📦</div>
          <div class="more-card-title">Obunalar</div>
          <div class="more-card-sub">${DB.getSubs().filter(s => !s.paused).length} ta faol</div>
        </button>
        <button class="more-card" onclick="App.go('notes')">
          <div class="more-card-icon">📝</div>
          <div class="more-card-title">Eslatmalar</div>
          <div class="more-card-sub">${DB.getNotes().length} ta</div>
        </button>
      </div>
    </div>`;
  }

  function go(page) { navigate(page); }

  function updateDate() {
    const el = document.getElementById('headerDate');
    if (!el) return;
    const now    = new Date();
    const days   = ['Yak','Du','Se','Cho','Pa','Ju','Sha'];
    const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    el.innerHTML = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}<span style="opacity:.45;margin:0 3px">·</span>${h}:${m}<span style="opacity:.45">:${s}</span>`;
  }

  function init() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });
    updateDate();
    setInterval(updateDate, 1000);
    Habits.checkNotifications();
    // Minutning boshiga sinxronlashtirish — har minutda aniq tekshiradi
    const msToNextMin = (60 - new Date().getSeconds()) * 1000 + 500;
    setTimeout(() => {
      Habits.checkNotifications();
      setInterval(Habits.checkNotifications, 60000);
    }, msToNextMin);
    navigate('dashboard');
  }

  return { init, go, renderPage, Toast, Confirm };
})();
