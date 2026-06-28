const Habits = (() => {
  const ICONS = ['🏃','💧','📖','🧘','💪','🍎','😴','✍️','🎯','🌿','🚴','🧠','🎨','🎵','🙏'];

  function getTodayLog() {
    return (DB.getHabitLogs())[todayStr()] || {};
  }

  function getStreak(habitId) {
    const logs = DB.getHabitLogs();
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (logs[key] && logs[key][habitId]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  function render() {
    const habits   = DB.getHabits();
    const todayLog = getTodayLog();
    const doneCount = habits.filter(h => todayLog[h.id]).length;
    const pct = habits.length ? Math.round(doneCount / habits.length * 100) : 0;
    const today = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' });

    let habitsHtml = '';
    if (habits.length === 0) {
      habitsHtml = `<div class="empty-state"><span class="empty-icon">✅</span><p>Hali odat qo'shilmagan</p></div>`;
    } else {
      habitsHtml = habits.map(h => {
        const done   = !!todayLog[h.id];
        const streak = getStreak(h.id);
        return `<div class="habit-item ${done ? 'done-item' : ''}">
          <div class="habit-check ${done ? 'checked' : ''}" onclick="Habits.toggle('${h.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="habit-icon">${h.icon}</span>
          <span class="habit-name ${done ? 'checked' : ''}">${h.name}</span>
          ${streak > 1 ? `<span class="habit-streak">🔥 ${streak}</span>` : ''}
          <button onclick="Habits.del('${h.id}')" style="border:none;background:none;color:var(--text3);cursor:pointer;font-size:20px;padding:4px;line-height:1">×</button>
        </div>`;
      }).join('');
    }

    // Weekly chart
    const logs = DB.getHabitLogs();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key  = d.toISOString().slice(0, 10);
      const dLog = logs[key] || {};
      const done = habits.filter(h => dLog[h.id]).length;
      const p    = habits.length ? Math.round(done / habits.length * 100) : 0;
      days.push({ label: d.toLocaleDateString('uz-UZ', { weekday: 'short' }), pct: p, isToday: i === 0 });
    }

    const weekHtml = habits.length ? `
      <div class="section-head"><h2>Haftalik ko'rinish</h2></div>
      <div class="week-chart">
        ${days.map(d => `
          <div class="week-bar-wrap">
            <div class="week-bar-col">
              <div class="week-bar-fill" style="height:${d.pct}%;background:${d.isToday ? 'var(--orange)' : 'var(--green)'};opacity:${d.isToday ? '1' : '.7'}"></div>
            </div>
            <div class="week-bar-label ${d.isToday ? 'today' : ''}">${d.label}</div>
          </div>`).join('')}
      </div>` : '';

    return `<div class="page-enter">
      <div class="hero-card hero-green">
        <div class="hero-label">${today}</div>
        <div class="hero-amount">${doneCount}<span style="font-size:22px;font-weight:600;opacity:.7">/${habits.length}</span></div>
        <div class="hero-row">
          <div class="hero-stat">
            <div class="hero-stat-v">${pct}%</div>
            <div class="hero-stat-l">Bajarildi</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.2)"></div>
          <div class="hero-stat">
            <div class="hero-stat-v">${habits.length - doneCount}</div>
            <div class="hero-stat-l">Qoldi</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.2)"></div>
          <div class="hero-stat">
            <div class="hero-stat-v">${habits.length}</div>
            <div class="hero-stat-l">Umumiy</div>
          </div>
        </div>
      </div>

      ${weekHtml}
      ${habitsHtml}
    </div>`;
  }

  function toggle(id) {
    const logs = DB.getHabitLogs();
    const key  = todayStr();
    if (!logs[key]) logs[key] = {};
    logs[key][id] = !logs[key][id];
    DB.saveHabitLogs(logs);
    App.renderPage('habits');
  }

  function openAdd() {
    openModal("Odat qo'shish", `
      <div class="form-group">
        <label class="form-label">Odat nomi *</label>
        <input class="form-input" id="hb_name" type="text" placeholder="Masalan: Sport qilish">
      </div>
      <div class="form-group">
        <label class="form-label">Belgi tanlang</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${ICONS.map((ic, i) => `
            <button type="button" class="icon-habit-btn ${i===0?'selected':''}" data-icon="${ic}" onclick="Habits.selectIcon(this)">${ic}</button>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-green btn-full" style="margin-top:6px" onclick="Habits.save()">Qo'shish</button>
    `);
    setTimeout(() => document.getElementById('hb_name')?.focus(), 320);
  }

  function selectIcon(el) {
    document.querySelectorAll('.icon-habit-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
  }

  function save() {
    const name = document.getElementById('hb_name').value.trim();
    if (!name) { alert('Odat nomini kiriting'); return; }
    const iconEl = document.querySelector('.icon-habit-btn.selected');
    const icon   = iconEl ? iconEl.dataset.icon : '🎯';
    const habits = DB.getHabits();
    habits.push({ id: uid(), name, icon });
    DB.saveHabits(habits);
    closeModal();
    App.renderPage('habits');
  }

  function del(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    DB.saveHabits(DB.getHabits().filter(h => h.id !== id));
    App.renderPage('habits');
  }

  return { render, toggle, openAdd, selectIcon, save, del };
})();
