const Habits = (() => {
  const ICONS = ['🏃','💧','📖','🧘','💪','🍎','😴','✍️','🎯','🌿','🚴','🧠','🎨','🎵','🙏'];
  const DAY_NAMES = ['Yak','Du','Se','Cho','Pa','Ju','Sha'];
  const DAY_ORDER = [
    { name:'Du', idx:1 }, { name:'Se', idx:2 }, { name:'Cho', idx:3 },
    { name:'Pa', idx:4 }, { name:'Ju', idx:5 }, { name:'Sha', idx:6 }, { name:'Yak', idx:0 },
  ];

  // ── SCHEDULE HELPERS ─────────────────────────────────────────
  function isScheduledForDay(h, dayIdx) {
    if (!h.schedule || h.schedule.type === 'daily') return true;
    return (h.schedule.days || []).includes(dayIdx);
  }

  function getScheduleLabel(h) {
    if (!h.schedule) return '';
    const time = h.schedule.time || '';
    if (h.schedule.type !== 'weekly') return time ? `Har kuni · ${time}` : '';
    const order = [1,2,3,4,5,6,0];
    const days  = [...(h.schedule.days || [])]
      .sort((a,b) => order.indexOf(a) - order.indexOf(b))
      .map(d => DAY_NAMES[d]).join(', ');
    return [days, time].filter(Boolean).join(' · ');
  }

  // ── LOG HELPERS ───────────────────────────────────────────────
  function getTodayLog() { return (DB.getHabitLogs())[todayStr()] || {}; }

  function getStreak(habitId) {
    const logs = DB.getHabitLogs();
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (logs[key]?.[habitId]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  function getBestStreak(habitId) {
    const logs = DB.getHabitLogs();
    const keys = Object.keys(logs).sort();
    let best = 0, cur = 0;
    keys.forEach(k => {
      if (logs[k]?.[habitId]) { cur++; if (cur > best) best = cur; }
      else cur = 0;
    });
    return best;
  }

  function isTodayComplete() {
    const habits   = DB.getHabits();
    const todayDay = new Date().getDay();
    const sched    = habits.filter(h => isScheduledForDay(h, todayDay));
    if (!sched.length) return false;
    const log = getTodayLog();
    return sched.every(h => log[h.id]);
  }

  // ── FEATURE 2: 30-DAY HEATMAP ────────────────────────────────
  function renderHeatmap(habitId) {
    const logs  = DB.getHabitLogs();
    const cells = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key  = d.toISOString().slice(0, 10);
      const done = !!(logs[key]?.[habitId]);
      const isT  = i === 0;
      const bg   = done ? '#6AE06A' : isT ? 'rgba(245,143,32,.3)' : 'var(--border)';
      cells.push(`<div style="width:6px;height:6px;border-radius:1.5px;background:${bg};flex-shrink:0" title="${key}"></div>`);
    }
    return `<div style="display:flex;gap:2px;margin-top:5px;overflow:hidden">${cells.join('')}</div>`;
  }

  // ── FEATURE 4: CONFETTI ───────────────────────────────────────
  function triggerConfetti() {
    const old = document.getElementById('confetti-container');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'confetti-container';
    wrap.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden';
    document.body.appendChild(wrap);
    const colors = ['#F58F20','#6AE06A','#3B82F6','#EC4899','#EF4444','#FFD700','#A78BFA'];
    for (let i = 0; i < 75; i++) {
      const el  = document.createElement('div');
      const c   = colors[Math.floor(Math.random() * colors.length)];
      const sz  = 5 + Math.random() * 7;
      const dur = 1.8 + Math.random() * 1.5;
      const del = Math.random() * 0.7;
      el.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:${c};border-radius:${Math.random()>.5?'50%':'2px'};left:${Math.random()*100}%;top:-10px;animation:confetti-fall ${dur}s ease-out ${del}s forwards`;
      wrap.appendChild(el);
    }
    setTimeout(() => wrap.remove(), 5000);
  }

  // ── FEATURE 1: NOTIFICATIONS ──────────────────────────────────
  async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  function checkNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const habits   = DB.getHabits();
    const now      = new Date();
    const timeStr  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const todayDay = now.getDay();
    const todayKey = todayStr();
    const todayLog = getTodayLog();
    const nKey     = `tartib_notif_${todayKey}`;
    const notified = JSON.parse(localStorage.getItem(nKey) || '[]');

    habits.forEach(h => {
      if (!h.schedule?.notify)          return;
      if (!isScheduledForDay(h, todayDay)) return;
      if (todayLog[h.id])               return; // already done
      if (notified.includes(h.id))      return; // already notified today
      const nt = h.schedule.notifyTime || h.schedule.time;
      if (!nt || nt !== timeStr)        return;

      try {
        new Notification('Tartibla — Odat vaqti!', {
          body: `${h.icon} ${h.name}`,
          icon: './favicon.svg',
          tag:  `habit-${h.id}-${todayKey}`,
        });
      } catch(e) {}

      notified.push(h.id);
      localStorage.setItem(nKey, JSON.stringify(notified));
    });
  }

  // ── FEATURE 6: STATS ──────────────────────────────────────────
  function getStats() {
    const habits = DB.getHabits();
    const logs   = DB.getHabitLogs();
    if (!habits.length) return { weekPct:0, monthPct:0, totalDays:0 };

    // Last 7 days
    let wT = 0, wD = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const dIdx  = d.getDay();
      const sched = habits.filter(h => isScheduledForDay(h, dIdx));
      if (!sched.length) continue;
      const dl = logs[key] || {};
      wD += sched.filter(h => dl[h.id]).length;
      wT += sched.length;
    }

    // Current month
    const now = new Date();
    let mT = 0, mD = 0;
    for (let i = 1; i <= now.getDate(); i++) {
      const d    = new Date(now.getFullYear(), now.getMonth(), i);
      const key  = d.toISOString().slice(0, 10);
      const dIdx = d.getDay();
      const sched = habits.filter(h => isScheduledForDay(h, dIdx));
      if (!sched.length) continue;
      const dl = logs[key] || {};
      mD += sched.filter(h => dl[h.id]).length;
      mT += sched.length;
    }

    // Total active days
    const totalDays = Object.values(logs).filter(dl =>
      Object.entries(dl).some(([k,v]) => !k.startsWith('note_') && v)
    ).length;

    return {
      weekPct:  wT ? Math.round(wD/wT*100) : 0,
      monthPct: mT ? Math.round(mD/mT*100) : 0,
      totalDays,
    };
  }

  // ── HABIT CARD ────────────────────────────────────────────────
  function habitCard(h, todayLog, active, allHabits) {
    const done    = !!todayLog[h.id];
    const streak  = getStreak(h.id);
    const bestS   = getBestStreak(h.id);
    const sched   = getScheduleLabel(h);
    const note    = todayLog[`note_${h.id}`] || '';
    const heatmap = renderHeatmap(h.id);
    const idx     = allHabits.findIndex(x => x.id === h.id);
    const canUp   = idx > 0;
    const canDown = idx < allHabits.length - 1;
    const notifyOn = !!(h.schedule?.notify);

    return `<div class="habit-item ${done?'done-item':''}" style="${!active?'opacity:.35':''}">
      <div class="habit-check ${done&&active?'checked':''}" ${active?`onclick="Habits.toggle('${h.id}')"`:'style="cursor:default"'}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="habit-icon">${h.icon}</span>
      <div style="flex:1;min-width:0;overflow:hidden">
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          <span class="habit-name ${done&&active?'checked':''}">${escapeHtml(h.name)}</span>
          ${notifyOn?`<span style="font-size:10px;opacity:.45" title="Bildirishnoma: ${h.schedule.notifyTime||''}">🔔</span>`:''}
        </div>
        ${sched?`<div style="font-size:10px;color:var(--text3);font-weight:600;margin-top:1px">${sched}</div>`:''}
        ${note?`<div style="font-size:10.5px;color:var(--orange-dark);font-weight:700;margin-top:3px;background:var(--orange-light);padding:2px 8px;border-radius:6px;display:inline-block">"${escapeHtml(note)}"</div>`:''}
        ${heatmap}
        ${bestS>1?`<div style="font-size:9.5px;color:var(--text3);margin-top:3px;font-weight:600">🏆 Eng uzun seriya: ${bestS} kun</div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;margin-left:4px">
        ${streak>1?`<span class="habit-streak" style="font-size:10px;padding:2px 5px">🔥${streak}</span>`:''}
        ${active&&done?`<button style="background:none;border:none;font-size:13px;cursor:pointer;padding:2px;line-height:1;-webkit-tap-highlight-color:transparent" onclick="Habits.openNote('${h.id}')" title="Izoh">📝</button>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;margin-left:4px;flex-shrink:0">
        <div style="display:flex;gap:3px">
          <button class="action-edit" style="padding:3px 7px;font-size:11px" onclick="Habits.openEdit('${h.id}')">✎</button>
          <button class="action-del"  style="padding:3px 7px;font-size:11px" onclick="Habits.del('${h.id}')">×</button>
        </div>
        <div style="display:flex;gap:3px">
          <button style="flex:1;padding:2px 0;font-size:11px;font-weight:700;border-radius:5px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);cursor:${canUp?'pointer':'default'};opacity:${canUp?1:.22};-webkit-tap-highlight-color:transparent" onclick="${canUp?`Habits.moveHabit('${h.id}',-1)`:'void 0'}">↑</button>
          <button style="flex:1;padding:2px 0;font-size:11px;font-weight:700;border-radius:5px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);cursor:${canDown?'pointer':'default'};opacity:${canDown?1:.22};-webkit-tap-highlight-color:transparent" onclick="${canDown?`Habits.moveHabit('${h.id}',1)`:'void 0'}">↓</button>
        </div>
      </div>
    </div>`;
  }

  // ── RENDER ────────────────────────────────────────────────────
  function render() {
    const habits      = DB.getHabits();
    const todayLog    = getTodayLog();
    const todayDay    = new Date().getDay();
    const today       = new Date().toLocaleDateString('uz-UZ',{weekday:'long',day:'numeric',month:'long'});
    const stats       = getStats();

    const todayHabits = habits.filter(h => isScheduledForDay(h, todayDay));
    const otherHabits = habits.filter(h => !isScheduledForDay(h, todayDay));
    const doneCount   = todayHabits.filter(h => todayLog[h.id]).length;
    const pct         = todayHabits.length ? Math.round(doneCount/todayHabits.length*100) : 0;
    const allDone     = doneCount > 0 && doneCount === todayHabits.length;

    const habitsHtml = habits.length === 0
      ? `<div class="empty-state"><span class="empty-icon">✅</span><p>Hali odat qo'shilmagan</p></div>`
      : [
          ...todayHabits.map(h => habitCard(h, todayLog, true, habits)),
          ...(otherHabits.length ? [
            `<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;padding:14px 0 6px">Bugun emas</div>`,
            ...otherHabits.map(h => habitCard(h, todayLog, false, habits)),
          ] : []),
        ].join('');

    // Weekly chart
    const logs = DB.getHabitLogs();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const dLog  = logs[key] || {};
      const dIdx  = d.getDay();
      const sched = habits.filter(h => isScheduledForDay(h, dIdx));
      const done  = sched.filter(h => dLog[h.id]).length;
      const p     = sched.length ? Math.round(done/sched.length*100) : 0;
      days.push({ label: d.toLocaleDateString('uz-UZ',{weekday:'short'}), pct:p, isToday: i===0 });
    }

    const weekHtml = habits.length ? `
      <div class="section-head"><h2>Haftalik ko'rinish</h2></div>
      <div class="week-chart">
        ${days.map(d=>`
          <div class="week-bar-wrap">
            <div class="week-bar-col">
              <div class="week-bar-fill" style="height:${d.pct}%;background:${d.isToday?'var(--orange)':'var(--green)'};opacity:${d.isToday?1:.7}"></div>
            </div>
            <div class="week-bar-label ${d.isToday?'today':''}">${d.label}</div>
          </div>`).join('')}
      </div>` : '';

    const statsHtml = habits.length ? `
      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
        <div class="stat-card" style="text-align:center;padding:12px 8px">
          <div style="font-size:21px;font-weight:900;color:var(--green)">${stats.weekPct}%</div>
          <div style="font-size:9px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.3px;margin-top:2px">Bu hafta</div>
        </div>
        <div class="stat-card" style="text-align:center;padding:12px 8px">
          <div style="font-size:21px;font-weight:900;color:var(--orange)">${stats.monthPct}%</div>
          <div style="font-size:9px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.3px;margin-top:2px">Bu oy</div>
        </div>
        <div class="stat-card" style="text-align:center;padding:12px 8px">
          <div style="font-size:21px;font-weight:900;color:var(--dark)">${stats.totalDays}</div>
          <div style="font-size:9px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.3px;margin-top:2px">Jami kun</div>
        </div>
      </div>` : '';

    const completeBanner = allDone ? `
      <div style="text-align:center;padding:14px 16px;background:linear-gradient(135deg,rgba(106,224,106,.13),rgba(245,143,32,.08));border:1.5px solid rgba(106,224,106,.35);border-radius:var(--radius);margin-bottom:12px">
        <div style="font-size:28px;margin-bottom:5px">🎉</div>
        <div style="font-weight:900;font-size:15px;color:var(--green);letter-spacing:-.2px">Zo'r! Barcha odatlar bajarildi!</div>
        <div style="font-size:12px;color:var(--text2);margin-top:3px;font-weight:600">Bugungi maqsad amalga oshdi.</div>
      </div>` : '';

    return `<div class="page-enter">
      <div class="hero-card hero-green">
        <div class="hero-label">${today}</div>
        <div class="hero-amount">${doneCount}<span style="font-size:22px;font-weight:600;opacity:.7">/${todayHabits.length}</span></div>
        <div class="hero-row">
          <div class="hero-stat"><div class="hero-stat-v">${pct}%</div><div class="hero-stat-l">Bajarildi</div></div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.2)"></div>
          <div class="hero-stat"><div class="hero-stat-v">${todayHabits.length-doneCount}</div><div class="hero-stat-l">Qoldi</div></div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.2)"></div>
          <div class="hero-stat"><div class="hero-stat-v">${habits.length}</div><div class="hero-stat-l">Jami</div></div>
        </div>
      </div>
      ${statsHtml}
      ${weekHtml}
      ${completeBanner}
      ${habitsHtml}
    </div>`;
  }

  // ── TOGGLE (Feature 4 trigger) ────────────────────────────────
  function toggle(id) {
    const wasComplete = isTodayComplete();
    const logs = DB.getHabitLogs();
    const key  = todayStr();
    if (!logs[key]) logs[key] = {};
    logs[key][id] = !logs[key][id];
    DB.saveHabitLogs(logs);
    App.renderPage('habits');
    if (!wasComplete && isTodayComplete()) {
      setTimeout(triggerConfetti, 250);
      setTimeout(() => App.Toast("🎉 Barcha odatlar bajarildi! Zo'r!", 'success'), 450);
    }
  }

  // ── FEATURE 5: REORDER ───────────────────────────────────────
  function moveHabit(id, dir) {
    const habits = DB.getHabits();
    const idx    = habits.findIndex(h => h.id === id);
    const swap   = idx + dir;
    if (swap < 0 || swap >= habits.length) return;
    [habits[idx], habits[swap]] = [habits[swap], habits[idx]];
    DB.saveHabits(habits);
    App.renderPage('habits');
  }

  // ── FEATURE 3: NOTE ───────────────────────────────────────────
  function openNote(id) {
    const logs    = DB.getHabitLogs();
    const curNote = logs[todayStr()]?.[`note_${id}`] || '';
    openModal('Bugungi natija', `
      <div class="form-group">
        <label class="form-label">Izoh <span style="font-weight:400;opacity:.45;font-size:11px">(ixtiyoriy)</span></label>
        <input class="form-input" id="habit_note_inp" type="text" placeholder="Masalan: 8 km yugurdim, 30 daqiqa..." value="${escapeHtml(curNote)}">
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-full" onclick="closeModal()">Bekor</button>
        <button class="btn btn-green btn-full" onclick="Habits.saveNote('${id}')">Saqlash</button>
      </div>
    `);
    setTimeout(() => document.getElementById('habit_note_inp')?.focus(), 320);
  }

  function saveNote(id) {
    const note = document.getElementById('habit_note_inp').value.trim();
    const logs = DB.getHabitLogs();
    const key  = todayStr();
    if (!logs[key]) logs[key] = {};
    if (note) logs[key][`note_${id}`] = note;
    else delete logs[key][`note_${id}`];
    DB.saveHabitLogs(logs);
    closeModal();
    App.renderPage('habits');
  }

  // ── FORM ─────────────────────────────────────────────────────
  function habitForm(data = {}) {
    const sched      = data.schedule || { type:'daily' };
    const schedType  = sched.type || 'daily';
    const selDays    = sched.days || [];
    const time       = sched.time || '';
    const notify     = !!(sched.notify);
    const notifyTime = sched.notifyTime || '';

    return `
      <div class="form-group">
        <label class="form-label">Odat nomi *</label>
        <input class="form-input" id="hb_name" type="text" placeholder="Masalan: Zal mashqi" value="${data.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Belgi tanlang</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${ICONS.map(ic=>`
            <button type="button" class="icon-habit-btn ${(data.icon||ICONS[0])===ic?'selected':''}"
              data-icon="${ic}" onclick="Habits.selectIcon(this)">${ic}</button>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Jadval</label>
        <div style="display:flex;gap:7px">
          <button type="button" id="hb_type_daily"
            class="btn btn-sm ${schedType==='daily'?'btn-success':'btn-ghost'}"
            style="flex:1;font-weight:700"
            onclick="Habits.setScheduleType('daily')">📅 Har kuni</button>
          <button type="button" id="hb_type_weekly"
            class="btn btn-sm ${schedType==='weekly'?'btn-success':'btn-ghost'}"
            style="flex:1;font-weight:700"
            onclick="Habits.setScheduleType('weekly')">📆 Haftada</button>
        </div>
        <input type="hidden" id="hb_schedule_type" value="${schedType}">
      </div>
      <div class="form-group" id="hb_days_row" style="display:${schedType==='weekly'?'block':'none'}">
        <label class="form-label">Kunlar</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${DAY_ORDER.map(d=>`
            <button type="button" class="btn btn-sm day-btn ${selDays.includes(d.idx)?'btn-success':'btn-ghost'}"
              data-day="${d.idx}" onclick="Habits.toggleDay(this)"
              style="min-width:42px;font-weight:700">${d.name}</button>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Odat vaqti <span style="font-weight:400;opacity:.45;font-size:11px">(ixtiyoriy)</span></label>
        <input class="form-input" id="hb_time" type="time" value="${time}">
      </div>
      <div class="form-group">
        <label class="form-label">🔔 Bildirishnoma</label>
        <div style="display:flex;gap:7px">
          <button type="button" id="hb_notify_off"
            class="btn btn-sm ${!notify?'btn-primary':'btn-ghost'}"
            style="flex:1;font-weight:700"
            onclick="Habits.toggleNotifyUI(false)">Yoq</button>
          <button type="button" id="hb_notify_on"
            class="btn btn-sm ${notify?'btn-success':'btn-ghost'}"
            style="flex:1;font-weight:700"
            onclick="Habits.toggleNotifyUI(true)">🔔 Yoqish</button>
        </div>
        <input type="hidden" id="hb_notify" value="${notify?'1':'0'}">
      </div>
      <div class="form-group" id="hb_notify_time_row" style="display:${notify?'block':'none'}">
        <label class="form-label">Bildirishnoma vaqti</label>
        <input class="form-input" id="hb_notify_time" type="time" value="${notifyTime}">
        <button type="button" class="btn btn-ghost btn-sm" style="margin-top:7px;font-size:11px;font-weight:700;width:100%" onclick="Habits.testNotification()">🔔 Hozir test xabarini yuborish</button>
        <div style="font-size:10.5px;color:var(--text3);margin-top:6px;line-height:1.5">
          ⚠️ Bildirishnomalar faqat <b>localhost</b> yoki <b>https://</b> da ishlaydi.<br>
          Lokal fayldan ochilganda (file://) brauzer bloklab qo'yadi.
        </div>
      </div>`;
  }

  function setScheduleType(type) {
    const inp = document.getElementById('hb_schedule_type');
    const row = document.getElementById('hb_days_row');
    const d   = document.getElementById('hb_type_daily');
    const w   = document.getElementById('hb_type_weekly');
    if (!inp) return;
    inp.value = type;
    if (row) row.style.display = type === 'weekly' ? 'block' : 'none';
    if (d) { d.className = `btn btn-sm ${type==='daily'?'btn-success':'btn-ghost'}`; d.style.flex='1'; d.style.fontWeight='700'; }
    if (w) { w.className = `btn btn-sm ${type==='weekly'?'btn-success':'btn-ghost'}`; w.style.flex='1'; w.style.fontWeight='700'; }
  }

  function toggleDay(el) {
    const sel = el.classList.contains('btn-success');
    el.classList.toggle('btn-success', !sel);
    el.classList.toggle('btn-ghost',    sel);
  }

  async function toggleNotifyUI(on) {
    if (on) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        App.Toast("Brauzer bildirishnomalarni taqiqlagan. Brauzer sozlamalaridan ruxsat bering.", 'error');
        return;
      }
    }
    const inp    = document.getElementById('hb_notify');
    const row    = document.getElementById('hb_notify_time_row');
    const offBtn = document.getElementById('hb_notify_off');
    const onBtn  = document.getElementById('hb_notify_on');
    if (inp) inp.value = on ? '1' : '0';
    if (row) row.style.display = on ? 'block' : 'none';
    if (offBtn) { offBtn.className=`btn btn-sm ${!on?'btn-primary':'btn-ghost'}`; offBtn.style.flex='1'; offBtn.style.fontWeight='700'; }
    if (onBtn)  { onBtn.className =`btn btn-sm ${on?'btn-success':'btn-ghost'}`;  onBtn.style.flex='1';  onBtn.style.fontWeight='700'; }
  }

  function openAdd() {
    openModal("Odat qo'shish",
      habitForm() +
      `<button class="btn btn-green btn-full" style="margin-top:6px" onclick="Habits.save('')">Qo'shish</button>`
    );
    setTimeout(() => document.getElementById('hb_name')?.focus(), 320);
  }

  function openEdit(id) {
    const h = DB.getHabits().find(x => x.id === id);
    if (!h) return;
    openModal("Odatni tahrirlash",
      habitForm(h) +
      `<button class="btn btn-green btn-full" style="margin-top:6px" onclick="Habits.save('${id}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('hb_name')?.focus(), 320);
  }

  function selectIcon(el) {
    document.querySelectorAll('.icon-habit-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
  }

  function save(id) {
    const name = document.getElementById('hb_name').value.trim();
    if (!name) { App.Toast('Odat nomini kiriting'); return; }

    const iconEl     = document.querySelector('.icon-habit-btn.selected');
    const icon       = iconEl ? iconEl.dataset.icon : '🎯';
    const schedType  = document.getElementById('hb_schedule_type').value;
    const time       = document.getElementById('hb_time').value;
    const notifyOn   = document.getElementById('hb_notify').value === '1';
    const notifyTime = notifyOn ? (document.getElementById('hb_notify_time')?.value || '') : '';

    const schedule = { type: schedType };
    if (schedType === 'weekly') {
      const days = [...document.querySelectorAll('.day-btn.btn-success')].map(b => parseInt(b.dataset.day));
      if (!days.length) { App.Toast('Kamida 1 ta kun tanlang'); return; }
      schedule.days = days;
    }
    if (time) schedule.time = time;
    if (notifyOn) {
      if (!notifyTime) { App.Toast('Bildirishnoma vaqtini kiriting'); return; }
      schedule.notify     = true;
      schedule.notifyTime = notifyTime;
    }

    const habits = DB.getHabits();
    if (id) {
      const h = habits.find(x => x.id === id);
      if (h) { h.name = name; h.icon = icon; h.schedule = schedule; }
    } else {
      habits.push({ id: uid(), name, icon, schedule });
    }
    DB.saveHabits(habits);
    closeModal();
    App.renderPage('habits');
  }

  async function testNotification() {
    const granted = await requestNotificationPermission();
    if (!granted) {
      App.Toast("Ruxsat yo'q — brauzer sozlamalaridan Notification ruxsatini bering.", 'error');
      return;
    }
    try {
      new Notification('Tartibla — Test! ✅', {
        body: 'Bildirishnoma ishlayapti!',
        icon: './favicon.svg',
        tag: 'tartib-test',
      });
      App.Toast("Test xabari yuborildi — bildrishnomalarni tekshiring!", 'success');
    } catch(e) {
      App.Toast("Xatolik: " + (e.message || 'file:// da ishlamaydi'), 'error');
    }
  }

  function del(id) {
    App.Confirm("O'chirishni tasdiqlaysizmi?", () => {
      DB.saveHabits(DB.getHabits().filter(h => h.id !== id));
      App.renderPage('habits');
    });
  }

  return {
    render, toggle, moveHabit,
    setScheduleType, toggleDay, toggleNotifyUI,
    openAdd, openEdit, selectIcon, save,
    openNote, saveNote, testNotification,
    del, checkNotifications,
  };
})();
