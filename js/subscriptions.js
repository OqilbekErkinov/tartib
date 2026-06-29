const Subscriptions = (() => {
  const ICONS = {
    netflix:'🎬', spotify:'🎵', youtube:'▶️', telegram:'✈️',
    apple:'🍎', google:'🔍', adobe:'🎨', gym:'🏋️', other:'📦',
  };

  function monthlyAmount(s) {
    if (s.period === 'monthly') return s.amount;
    if (s.period === 'yearly')  return Math.round(s.amount / 12);
    if (s.period === 'weekly')  return Math.round(s.amount * 4.33);
    return s.amount;
  }

  function render() {
    const subs         = DB.getSubs();
    const active       = subs.filter(s => !s.paused);
    const totalMonthly = active.reduce((sum, s) => sum + monthlyAmount(s), 0);

    const list = subs.length === 0
      ? `<div class="empty-state"><span class="empty-icon">📦</span><p>Hali obuna qo'shilmagan</p></div>`
      : subs.map(s => subCard(s)).join('');

    return `<div class="page-enter">
      <div class="hero-card hero-dark">
        <div class="hero-label">Oylik obuna xarajati</div>
        <div class="hero-amount">${fmtMoney(totalMonthly)} <span style="font-size:18px;font-weight:600;opacity:.7">so'm</span></div>
        <div class="hero-row">
          <div class="hero-stat"><div class="hero-stat-v">${fmtMoney(totalMonthly*12)}</div><div class="hero-stat-l">Yillik</div></div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.15)"></div>
          <div class="hero-stat"><div class="hero-stat-v">${active.length}</div><div class="hero-stat-l">Faol</div></div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.15)"></div>
          <div class="hero-stat"><div class="hero-stat-v">${subs.length - active.length}</div><div class="hero-stat-l">Pauza</div></div>
        </div>
      </div>
      ${list}
    </div>`;
  }

  function subCard(s) {
    const icon     = ICONS[s.icon] || ICONS.other;
    const periods  = { monthly: 'Oylik', yearly: 'Yillik', weekly: 'Haftalik' };
    const nextDate = s.nextDate ? new Date(s.nextDate) : null;
    const daysLeft = nextDate ? Math.ceil((nextDate - new Date()) / 86400000) : null;

    let dueBadge = '';
    if (daysLeft !== null) {
      if (daysLeft < 0)       dueBadge = `<span class="badge badge-red">Muddati o'tgan</span>`;
      else if (daysLeft <= 3) dueBadge = `<span class="badge badge-red">${daysLeft} kun</span>`;
      else                    dueBadge = `<span class="badge badge-gray">${daysLeft} kun</span>`;
    }

    return `<div class="list-item" style="border-left:3px solid ${s.paused?'var(--border)':'var(--orange)'};${s.paused?'opacity:.55':''}">
      <div class="list-item-icon" style="background:var(--orange-light);font-size:20px">${icon}</div>
      <div class="list-item-body">
        <div class="list-item-title">${escapeHtml(s.name)}</div>
        <div class="list-item-sub" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${periods[s.period] || ''} ${dueBadge}
        </div>
      </div>
      <div class="list-item-right">
        <div style="font-weight:800;font-size:15px">${fmtMoney(s.amount)}</div>
        <div style="font-size:11px;color:var(--text2);font-weight:600">${fmtMoney(monthlyAmount(s))}/oy</div>
        <div class="action-btns">
          <button onclick="Subscriptions.togglePause('${s.id}')" title="${s.paused?'Davom ettirish':'Pauza'}"
            style="border:none;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:3px 8px;font-size:12px;cursor:pointer">
            ${s.paused ? '▶' : '⏸'}
          </button>
          <button class="action-edit" onclick="Subscriptions.openEdit('${s.id}')">✎</button>
          <button class="action-del"  onclick="Subscriptions.del('${s.id}')">×</button>
        </div>
      </div>
    </div>`;
  }

  // ── SUBSCRIPTION FORM (shared for add & edit) ────────────────
  function subForm(data = {}) {
    return `
      <div class="form-group">
        <label class="form-label">Nomi *</label>
        <input class="form-input" id="sb_name" type="text" placeholder="Masalan: Netflix" value="${data.name || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Miqdor (so'm)</label>
          <input class="form-input" id="sb_amount" type="text" inputmode="numeric" placeholder="0"
            oninput="numInput(this)" value="${data.amount ? fmtMoney(data.amount) : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">To'lov davri</label>
          <select class="form-select" id="sb_period">
            <option value="monthly" ${(data.period||'monthly')==='monthly'?'selected':''}>Oylik</option>
            <option value="yearly"  ${data.period==='yearly' ?'selected':''}>Yillik</option>
            <option value="weekly"  ${data.period==='weekly' ?'selected':''}>Haftalik</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Keyingi to'lov sanasi</label>
        <input class="form-input" id="sb_next" type="date" value="${data.nextDate || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Belgi</label>
        <select class="form-select" id="sb_icon">
          ${Object.entries(ICONS).map(([k,v]) =>
            `<option value="${k}" ${data.icon===k?'selected':''}>${v} ${k.charAt(0).toUpperCase()+k.slice(1)}</option>`
          ).join('')}
        </select>
      </div>`;
  }

  function openAdd() {
    openModal("Obuna qo'shish",
      subForm() +
      `<button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Subscriptions.save('')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('sb_name')?.focus(), 320);
  }

  function openEdit(id) {
    const s = DB.getSubs().find(x => x.id === id);
    if (!s) return;
    openModal("Obunani tahrirlash",
      subForm(s) +
      `<button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Subscriptions.save('${id}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('sb_name')?.focus(), 320);
  }

  function save(id) {
    const name   = document.getElementById('sb_name').value.trim();
    const amount = parseAmount(document.getElementById('sb_amount').value);
    if (!name)             { App.Toast('Nomini kiriting'); return; }
    if (!amount || amount <= 0) { App.Toast('Miqdorni kiriting'); return; }
    const fields = {
      name, amount,
      period:   document.getElementById('sb_period').value,
      nextDate: document.getElementById('sb_next').value,
      icon:     document.getElementById('sb_icon').value,
    };
    const subs = DB.getSubs();
    if (id) {
      const s = subs.find(x => x.id === id);
      if (s) Object.assign(s, fields);
    } else {
      subs.push({ id: uid(), ...fields, paused: false });
    }
    DB.saveSubs(subs);
    closeModal();
    App.renderPage('subscriptions');
  }

  function togglePause(id) {
    const subs = DB.getSubs();
    const s = subs.find(x => x.id === id);
    if (s) s.paused = !s.paused;
    DB.saveSubs(subs);
    App.renderPage('subscriptions');
  }

  function del(id) {
    App.Confirm("O'chirishni tasdiqlaysizmi?", () => {
      DB.saveSubs(DB.getSubs().filter(s => s.id !== id));
      App.renderPage('subscriptions');
    });
  }

  return { render, openAdd, openEdit, save, togglePause, del };
})();
