const Goals = (() => {
  function render() {
    const goals  = DB.getGoals();
    const active = goals.filter(g => !g.done);
    const done   = goals.filter(g =>  g.done);

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

      ${active.length
        ? active.map(g => goalCard(g)).join('')
        : `<div class="empty-state"><span class="empty-icon">🎯</span><p>Hali maqsad qo'shilmagan</p></div>`}

      ${done.length ? `
        <div class="section-head" style="margin-top:8px"><h2>✅ Bajarilganlar</h2></div>
        ${done.map(g => goalCard(g)).join('')}
      ` : ''}
    </div>`;
  }

  function goalCard(g) {
    const pct = g.target
      ? Math.min(100, Math.round((g.current || 0) / g.target * 100))
      : (g.done ? 100 : 0);
    const now      = new Date(); now.setHours(0,0,0,0);
    const isOverdue = g.deadline && new Date(g.deadline) < now && !g.done;
    const daysLeft  = g.deadline && !g.done ? Math.ceil((new Date(g.deadline) - now) / 86400000) : null;
    const deadline  = g.deadline
      ? `<span class="badge ${isOverdue ? 'badge-red' : daysLeft <= 7 ? 'badge-red' : 'badge-orange'}" style="font-size:10px">${isOverdue ? '⚠️ ' : daysLeft === 0 ? '🔴 Bugun! ' : ''}${fmtDate(g.deadline)}</span>`
      : '';
    const steps = g.steps || [];
    const stepsDone = steps.filter(s => s.done).length;
    const stepsHtml = steps.length ? `
      <div style="margin:8px 0;border-top:1px solid var(--border-light);padding-top:8px">
        <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:6px">QADAMLAR (${stepsDone}/${steps.length})</div>
        ${steps.map(s => `
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
            <button onclick="Goals.toggleStep('${g.id}','${s.id}')"
              style="width:18px;height:18px;border-radius:5px;border:2px solid ${s.done ? 'var(--green)' : 'var(--border)'};background:${s.done ? 'var(--green)' : 'transparent'};cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent">
              ${s.done ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
            </button>
            <span style="font-size:13px;font-weight:600;color:var(--text);${s.done ? 'text-decoration:line-through;opacity:.45' : ''}">${escapeHtml(s.text)}</span>
            ${!g.done ? `<button onclick="Goals.delStep('${g.id}','${s.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;line-height:1;margin-left:auto;padding:2px;-webkit-tap-highlight-color:transparent">×</button>` : ''}
          </div>`).join('')}
        ${!g.done ? `
          <div style="display:flex;gap:6px;margin-top:6px">
            <input id="step_in_${g.id}" class="form-input" type="text" placeholder="Yangi qadam..."
              style="font-size:12px;padding:6px 10px"
              onkeydown="if(event.key==='Enter')Goals.addStep('${g.id}')">
            <button onclick="Goals.addStep('${g.id}')" style="flex-shrink:0;border:none;background:var(--orange);color:#fff;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer">+</button>
          </div>` : ''}
      </div>` : (!g.done ? `
      <div style="margin:6px 0">
        <div style="display:flex;gap:6px">
          <input id="step_in_${g.id}" class="form-input" type="text" placeholder="Qadam qo'shish..."
            style="font-size:12px;padding:6px 10px"
            onkeydown="if(event.key==='Enter')Goals.addStep('${g.id}')">
          <button onclick="Goals.addStep('${g.id}')" style="flex-shrink:0;border:none;background:var(--surface2);color:var(--text2);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer">+</button>
        </div>
      </div>` : '');

    return `<div class="goal-card ${g.done ? 'done' : ''}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:${g.type==='numeric'?'12px':'6px'}">
        <div style="flex:1">
          <div style="font-weight:800;font-size:16px;letter-spacing:-.2px">${escapeHtml(g.title)}</div>
          ${g.desc ? `<div style="font-size:12px;color:var(--text2);margin-top:3px;font-weight:500">${escapeHtml(g.desc)}</div>` : ''}
        </div>
        <div style="display:flex;gap:5px;align-items:center;flex-shrink:0">
          ${deadline}
          <button class="action-edit" onclick="Goals.openEdit('${g.id}')">✎</button>
          <button class="action-del"  onclick="Goals.del('${g.id}')">×</button>
        </div>
      </div>

      ${g.type === 'numeric' ? `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <input type="text" inputmode="numeric" class="form-input"
              style="max-width:130px;padding:7px 12px;font-weight:800"
              value="${fmtMoney(g.current || 0)}"
              oninput="numInput(this)"
              onchange="Goals.updateAmount('${g.id}',this.value)"
              ${g.done ? 'disabled' : ''}>
            <span style="color:var(--text2);font-size:13px;font-weight:600">/ ${fmtMoney(g.target)} so'm</span>
            <span style="font-weight:900;font-size:16px;color:var(--orange)">${pct}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
      ` : ''}

      ${stepsHtml}

      ${!g.done
        ? `<button class="btn btn-green btn-sm" style="margin-top:6px" onclick="Goals.complete('${g.id}')">✓ Bajarildi deb belgilash</button>`
        : `<span class="badge badge-green">✓ Bajarildi</span>`}
    </div>`;
  }

  function toggleStep(goalId, stepId) {
    const goals = DB.getGoals();
    const g = goals.find(x => x.id === goalId);
    if (!g) return;
    if (!g.steps) g.steps = [];
    const s = g.steps.find(x => x.id === stepId);
    if (s) s.done = !s.done;
    DB.saveGoals(goals);
    App.renderPage('goals');
  }

  function addStep(goalId) {
    const input = document.getElementById(`step_in_${goalId}`);
    const text  = input?.value.trim();
    if (!text) return;
    const goals = DB.getGoals();
    const g = goals.find(x => x.id === goalId);
    if (!g) return;
    if (!g.steps) g.steps = [];
    g.steps.push({ id: uid(), text, done: false });
    DB.saveGoals(goals);
    App.renderPage('goals');
  }

  function delStep(goalId, stepId) {
    const goals = DB.getGoals();
    const g = goals.find(x => x.id === goalId);
    if (!g || !g.steps) return;
    g.steps = g.steps.filter(s => s.id !== stepId);
    DB.saveGoals(goals);
    App.renderPage('goals');
  }

  // ── GOAL FORM (shared for add & edit) ────────────────────────
  function goalForm(data = {}) {
    return `
      <div class="form-group">
        <label class="form-label">Maqsad *</label>
        <input class="form-input" id="gl_title" type="text" placeholder="Masalan: 2 mln tejash" value="${data.title || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Tavsif</label>
        <input class="form-input" id="gl_desc" type="text" placeholder="Qisqacha izoh..." value="${data.desc || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Turi</label>
        ${CSelect.html('gl_type', [
          { value: 'simple',  label: "Oddiy (bajarildi/yo'q)"   },
          { value: 'numeric', label: 'Miqdoriy (progress bilan)' },
        ], data.type || 'simple', 'Goals.toggleNumeric')}
      </div>
      <div id="gl_numericFields" style="display:${data.type==='numeric'?'block':'none'}">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Joriy qiymat</label>
            <input class="form-input" id="gl_current" type="text" inputmode="numeric" placeholder="0"
              oninput="numInput(this)" value="${data.current ? fmtMoney(data.current) : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Maqsad qiymati</label>
            <input class="form-input" id="gl_target" type="text" inputmode="numeric" placeholder="1 000 000"
              oninput="numInput(this)" value="${data.target ? fmtMoney(data.target) : ''}">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Muddat (ixtiyoriy)</label>
        <input class="form-input" id="gl_deadline" type="date" value="${data.deadline || ''}">
      </div>`;
  }

  function toggleNumeric(val) {
    const el = document.getElementById('gl_numericFields');
    if (el) el.style.display = val === 'numeric' ? 'block' : 'none';
  }

  function openAdd() {
    openModal("Maqsad qo'shish",
      goalForm() +
      `<button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Goals.save('')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('gl_title')?.focus(), 320);
  }

  function openEdit(id) {
    const g = DB.getGoals().find(x => x.id === id);
    if (!g) return;
    openModal("Maqsadni tahrirlash",
      goalForm(g) +
      `<button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Goals.save('${id}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('gl_title')?.focus(), 320);
  }

  function save(id) {
    const title = document.getElementById('gl_title').value.trim();
    if (!title) { App.Toast('Maqsadni kiriting'); return; }
    const type   = CSelect.getValue('gl_type');
    const fields = {
      title,
      desc:     document.getElementById('gl_desc').value.trim(),
      type,
      current:  type === 'numeric' ? parseAmount(document.getElementById('gl_current').value) : 0,
      target:   type === 'numeric' ? parseAmount(document.getElementById('gl_target').value)  : 0,
      deadline: document.getElementById('gl_deadline').value,
    };
    const goals = DB.getGoals();
    if (id) {
      const g = goals.find(x => x.id === id);
      if (g) Object.assign(g, fields);
    } else {
      goals.push({ id: uid(), ...fields, done: false });
    }
    DB.saveGoals(goals);
    closeModal();
    App.renderPage('goals');
  }

  function updateAmount(id, val) {
    const goals = DB.getGoals();
    const g = goals.find(x => x.id === id);
    if (g) g.current = parseAmount(val);
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
    App.Confirm("O'chirishni tasdiqlaysizmi?", () => {
      DB.saveGoals(DB.getGoals().filter(g => g.id !== id));
      App.renderPage('goals');
    });
  }

  return { render, openAdd, openEdit, toggleNumeric, save, updateAmount, complete, del, toggleStep, addStep, delStep };
})();
