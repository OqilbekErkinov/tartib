const Goals = (() => {
  function render() {
    const goals  = DB.getGoals();
    const active = goals.filter(g => !g.done);
    const done   = goals.filter(g => g.done);

    const emptyHtml = `<div class="empty-state"><span class="empty-icon">🎯</span><p>Hali maqsad qo'shilmagan</p></div>`;

    return `<div class="page-enter">
      <div class="stat-grid">
        <div class="stat-card" style="border-top:3px solid var(--orange)">
          <div class="stat-label">Faol</div>
          <div class="stat-value" style="color:var(--orange)">${active.length}</div>
          <div class="stat-sub">maqsad</div>
        </div>
        <div class="stat-card" style="border-top:3px solid var(--green)">
          <div class="stat-label">Bajarilgan</div>
          <div class="stat-value" style="color:var(--green)">${done.length}</div>
          <div class="stat-sub">maqsad</div>
        </div>
      </div>

      ${active.length ? active.map(g => goalCard(g)).join('') : emptyHtml}

      ${done.length ? `
        <div class="section-head" style="margin-top:8px"><h2>✅ Bajarilganlar</h2></div>
        ${done.map(g => goalCard(g)).join('')}
      ` : ''}
    </div>`;
  }

  function goalCard(g) {
    const pct = g.target ? Math.min(100, Math.round((g.current || 0) / g.target * 100)) : (g.done ? 100 : 0);
    const deadline = g.deadline
      ? `<span class="badge ${new Date(g.deadline) < new Date() && !g.done ? 'badge-red' : 'badge-orange'}">${fmtDate(g.deadline)}</span>`
      : '';

    return `<div class="goal-card ${g.done ? 'done' : ''}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:${g.type==='numeric'?'12px':'6px'}">
        <div style="flex:1">
          <div style="font-weight:800;font-size:16px;letter-spacing:-.2px">${g.title}</div>
          ${g.desc ? `<div style="font-size:12px;color:var(--text2);margin-top:3px;font-weight:500">${g.desc}</div>` : ''}
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
          ${deadline}
          <button onclick="Goals.del('${g.id}')" style="border:none;background:none;color:var(--text3);cursor:pointer;font-size:20px;line-height:1">×</button>
        </div>
      </div>

      ${g.type === 'numeric' ? `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <input type="number" class="form-input" style="max-width:120px;padding:7px 12px;font-weight:800"
              value="${g.current || 0}" onchange="Goals.update('${g.id}',this.value)"
              ${g.done ? 'disabled' : ''}>
            <span style="color:var(--text2);font-size:13px;font-weight:600">/ ${fmtMoney(g.target)} so'm</span>
            <span style="font-weight:900;font-size:16px;color:var(--orange)">${pct}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      ` : ''}

      ${!g.done ? `
        <button class="btn btn-green btn-sm" onclick="Goals.complete('${g.id}')">✓ Bajarildi deb belgilash</button>
      ` : `<span class="badge badge-green">✓ Bajarildi</span>`}
    </div>`;
  }

  function openAdd() {
    openModal("Maqsad qo'shish", `
      <div class="form-group">
        <label class="form-label">Maqsad *</label>
        <input class="form-input" id="gl_title" type="text" placeholder="Masalan: 2 mln tejash">
      </div>
      <div class="form-group">
        <label class="form-label">Tavsif</label>
        <input class="form-input" id="gl_desc" type="text" placeholder="Qisqacha izoh...">
      </div>
      <div class="form-group">
        <label class="form-label">Turi</label>
        <select class="form-select" id="gl_type" onchange="Goals.toggleNumeric(this.value)">
          <option value="simple">Oddiy (bajarildi/yo'q)</option>
          <option value="numeric">Miqdoriy (progress bilan)</option>
        </select>
      </div>
      <div id="gl_numericFields" style="display:none">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Joriy qiymat</label>
            <input class="form-input" id="gl_current" type="number" placeholder="0" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">Maqsad qiymati</label>
            <input class="form-input" id="gl_target" type="number" placeholder="1 000 000">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Muddat (ixtiyoriy)</label>
        <input class="form-input" id="gl_deadline" type="date">
      </div>
      <button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Goals.save()">Saqlash</button>
    `);
    setTimeout(() => document.getElementById('gl_title')?.focus(), 320);
  }

  function toggleNumeric(val) {
    const el = document.getElementById('gl_numericFields');
    if (el) el.style.display = val === 'numeric' ? 'block' : 'none';
  }

  function save() {
    const title = document.getElementById('gl_title').value.trim();
    if (!title) { alert('Maqsadni kiriting'); return; }
    const type = document.getElementById('gl_type').value;
    const goals = DB.getGoals();
    goals.push({
      id: uid(), title,
      desc:     document.getElementById('gl_desc').value.trim(),
      type,
      current:  type === 'numeric' ? (parseFloat(document.getElementById('gl_current').value) || 0) : 0,
      target:   type === 'numeric' ? (parseFloat(document.getElementById('gl_target').value) || 0) : 0,
      deadline: document.getElementById('gl_deadline').value,
      done: false,
    });
    DB.saveGoals(goals);
    closeModal();
    App.renderPage('goals');
  }

  function update(id, val) {
    const goals = DB.getGoals();
    const g = goals.find(x => x.id === id);
    if (g) g.current = parseFloat(val) || 0;
    DB.saveGoals(goals);
    App.renderPage('goals');
  }

  function complete(id) {
    const goals = DB.getGoals();
    const g = goals.find(x => x.id === id);
    if (g) { g.done = true; if (g.type === 'numeric') g.current = g.target; }
    DB.saveGoals(goals);
    App.renderPage('goals');
  }

  function del(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    DB.saveGoals(DB.getGoals().filter(g => g.id !== id));
    App.renderPage('goals');
  }

  return { render, openAdd, toggleNumeric, save, update, complete, del };
})();
