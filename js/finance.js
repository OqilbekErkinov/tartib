const Finance = (() => {
  const CATS = {
    food:   { label: 'Oziq-ovqat',    icon: '🛒', color: '#F58F20' },
    cafe:   { label: 'Kafe/Restoran', icon: '☕', color: '#8B5CF6' },
    trans:  { label: 'Transport',     icon: '🚌', color: '#3B82F6' },
    cloth:  { label: 'Kiyim',         icon: '👕', color: '#EC4899' },
    health: { label: "Sog'liq",       icon: '💊', color: '#EF4444' },
    edu:    { label: "Ta'lim",        icon: '📚', color: '#467434' },
    entmt:  { label: "Ko'ngil ochar", icon: '🎮', color: '#06B6D4' },
    house:  { label: 'Uy xarajati',   icon: '🏠', color: '#D97A10' },
    salary: { label: 'Oylik maosh',   icon: '💼', color: '#467434' },
    gift:   { label: "Sovg'a",        icon: '🎁', color: '#A855F7' },
    other:  { label: 'Boshqa',        icon: '📌', color: '#64748B' },
  };

  let debtTab = 'borrowed';

  // ── MAIN RENDER ──────────────────────────────────────────────
  function render() {
    const txs = DB.getTransactions();
    const now = new Date();
    const monthTxs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const income  = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    const balance = txs.reduce((s,t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);

    const debts        = DB.getDebts();
    const totalOwed    = debts.filter(d => d.type === 'borrowed' && !d.paid).reduce((s,d) => s + d.amount, 0);
    const totalLentOut = debts.filter(d => d.type === 'lent'     && !d.paid).reduce((s,d) => s + d.amount, 0);

    const recent = [...txs].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 40);

    const catMap = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.cat] = (catMap[t.cat] || 0) + t.amount;
    });
    const catEntries = Object.entries(catMap).sort((a,b) => b[1] - a[1]);

    const catHtml = catEntries.length ? `
      <div class="section-head"><h2>Kategoriyalar</h2></div>
      ${catEntries.map(([k, v]) => {
        const c = CATS[k] || CATS.other;
        const pct = expense ? Math.round(v / expense * 100) : 0;
        return `<div class="cat-row">
          <span class="cat-row-icon">${c.icon}</span>
          <div class="cat-row-body">
            <div class="cat-row-name">${c.label}</div>
            <div class="cat-row-bar"><div class="cat-row-fill" style="width:${pct}%;background:${c.color};height:100%"></div></div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="cat-row-amt">${fmtMoney(v)}</div>
            <div style="font-size:10px;color:var(--text3);font-weight:600">${pct}%</div>
          </div>
        </div>`;
      }).join('')}` : '';

    const txHtml = recent.length
      ? `<div class="section-head"><h2>Operatsiyalar</h2></div>` +
        recent.map(t => {
          const c    = CATS[t.cat] || CATS.other;
          const sign = t.type === 'income' ? '+' : '−';
          const cls  = t.type === 'income' ? 'income' : 'expense';
          const bc   = t.type === 'income' ? 'var(--green)' : '#D94040';
          return `<div class="list-item" style="border-left:3px solid ${bc}">
            <div class="list-item-icon" style="background:${c.color}18">${c.icon}</div>
            <div class="list-item-body">
              <div class="list-item-title">${t.note || c.label}</div>
              <div class="list-item-sub">${c.label} · ${fmtDate(t.date)}</div>
            </div>
            <div class="list-item-right">
              <div class="tx-amount ${cls}">${sign}${fmtMoney(t.amount)}</div>
              <div class="action-btns">
                <button class="action-edit" onclick="Finance.openEditTx('${t.id}')">✎ Tahrir</button>
                <button class="action-del" onclick="Finance.delTx('${t.id}')">×</button>
              </div>
            </div>
          </div>`;
        }).join('')
      : `<div class="empty-state"><span class="empty-icon">💳</span><p>Hali operatsiya yo'q</p></div>`;

    return `<div class="page-enter">
      <div class="hero-card hero-orange">
        <div class="hero-label">Umumiy balans</div>
        <div class="hero-amount">${fmtMoney(balance)} <span style="font-size:18px;font-weight:600;opacity:.75">so'm</span></div>
        <div class="hero-row">
          <div class="hero-stat"><div class="hero-stat-v">+${fmtMoney(income)}</div><div class="hero-stat-l">Daromad</div></div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.2)"></div>
          <div class="hero-stat"><div class="hero-stat-v">−${fmtMoney(expense)}</div><div class="hero-stat-l">Xarajat</div></div>
          <div style="width:1px;height:30px;background:rgba(255,255,255,.2)"></div>
          <div class="hero-stat"><div class="hero-stat-v">${income && expense ? Math.round((1-expense/income)*100) : 0}%</div><div class="hero-stat-l">Tejalgan</div></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="background:var(--surface);border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light);border-left:3px solid #D94040;cursor:pointer" onclick="Finance.scrollToDebts()">
          <div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px">Qarzdorligim</div>
          <div style="font-size:18px;font-weight:900;color:#D94040">${fmtMoney(totalOwed)}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:1px">so'm · to'lanmagan</div>
        </div>
        <div style="background:var(--surface);border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light);border-left:3px solid var(--green);cursor:pointer" onclick="Finance.scrollToDebts()">
          <div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px">Berib qo'ydim</div>
          <div style="font-size:18px;font-weight:900;color:var(--green)">${fmtMoney(totalLentOut)}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:1px">so'm · kutilmoqda</div>
        </div>
      </div>

      <div class="add-btn-row">
        <button class="btn-income"  onclick="Finance.openAdd('income')">+ Daromad</button>
        <button class="btn-expense" onclick="Finance.openAdd('expense')">− Xarajat</button>
      </div>

      ${catHtml}
      ${txHtml}

      <div id="debtsSection" style="margin-top:6px">${renderDebts()}</div>
    </div>`;
  }

  // ── DEBTS RENDER ─────────────────────────────────────────────
  function renderDebts() {
    const debts    = DB.getDebts();
    const filtered = debts.filter(d => d.type === debtTab);
    const active   = filtered.filter(d => !d.paid);
    const paid     = filtered.filter(d =>  d.paid);
    const isBorrowed = debtTab === 'borrowed';
    const totalActive = active.reduce((s,d) => s + d.amount, 0);

    const debtItem = d => {
      const color = isBorrowed ? '#D94040' : 'var(--green)';
      const icon  = isBorrowed ? '📥' : '📤';
      return `<div class="list-item" style="border-left:3px solid ${color};${d.paid ? 'opacity:.5' : ''}">
        <div class="list-item-icon" style="background:${isBorrowed ? '#FEF0ED' : 'var(--green-light)'};font-size:20px">${icon}</div>
        <div class="list-item-body">
          <div class="list-item-title">${d.person}</div>
          <div class="list-item-sub">
            ${fmtDate(d.date)}${d.dueDate ? ` · Muddat: ${fmtDate(d.dueDate)}` : ''}
            ${d.note ? ` · ${d.note}` : ''}
          </div>
        </div>
        <div class="list-item-right">
          <div style="font-weight:900;font-size:15px;color:${color}">${fmtMoney(d.amount)}</div>
          ${!d.paid
            ? `<button onclick="Finance.payDebt('${d.id}')" style="margin-top:5px;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;background:${isBorrowed ? '#FEF0ED' : 'var(--green-light)'};color:${color};display:block">✓ To'landi</button>`
            : `<span class="badge badge-green" style="margin-top:4px;display:inline-flex">✓ To'langan</span>`}
          <div class="action-btns" style="margin-top:4px">
            <button class="action-edit" onclick="Finance.openEditDebt('${d.id}')">✎</button>
            <button class="action-del"  onclick="Finance.delDebt('${d.id}')">×</button>
          </div>
        </div>
      </div>`;
    };

    return `
      <div class="section-head">
        <h2>Qarzlar</h2>
        <div style="display:flex;gap:6px">
          <button onclick="Finance.openAddDebt('borrowed')" style="background:#FEF0ED;color:#D94040;font-weight:700;border:none;cursor:pointer;border-radius:6px;padding:6px 12px;font-size:12px">📥 Oldim</button>
          <button onclick="Finance.openAddDebt('lent')"     style="background:var(--green-light);color:var(--green);font-weight:700;border:none;cursor:pointer;border-radius:6px;padding:6px 12px;font-size:12px">📤 Berdim</button>
        </div>
      </div>
      <div class="tabs" style="margin-bottom:12px">
        <button class="tab-btn ${debtTab==='borrowed'?'active':''}" onclick="Finance.setDebtTab('borrowed')">📥 Qarzdorligim</button>
        <button class="tab-btn ${debtTab==='lent'?'active':''}"     onclick="Finance.setDebtTab('lent')">📤 Berganlarim</button>
      </div>
      ${active.length
        ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
             <span style="font-size:12px;color:var(--text2);font-weight:600">${active.length} ta to'lanmagan</span>
             <span style="font-size:14px;font-weight:900;color:${isBorrowed ? '#D94040' : 'var(--green)'}">
               ${fmtMoney(totalActive)} so'm
             </span>
           </div>
           ${active.map(debtItem).join('')}`
        : `<div class="empty-state" style="padding:28px 20px">
             <span class="empty-icon">${isBorrowed ? '🤝' : '💸'}</span>
             <p>${isBorrowed ? "Hozircha qarzdorligingiz yo'q" : "Hozircha hech kimga qarz bermagansiz"}</p>
           </div>`}
      ${paid.length
        ? `<div style="margin-top:12px">
             <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">✅ To'langan (${paid.length})</div>
             ${paid.map(debtItem).join('')}
           </div>` : ''}
    `;
  }

  function setDebtTab(tab) {
    debtTab = tab;
    const el = document.getElementById('debtsSection');
    if (el) el.innerHTML = renderDebts();
  }

  function scrollToDebts() {
    const el = document.getElementById('debtsSection');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── TX FORM (shared for add & edit) ──────────────────────────
  function txForm(type, data = {}) {
    const isIncome  = type === 'income';
    const incomeCats = ['salary','gift','other'];
    const expCats    = ['food','cafe','trans','cloth','health','edu','entmt','house','other'];
    const cats = isIncome ? incomeCats : expCats;
    return `
      <div class="form-group">
        <label class="form-label">Miqdor (so'm)</label>
        <input class="form-input" id="fi_amount" type="text" inputmode="numeric" placeholder="0"
          oninput="numInput(this)" value="${data.amount ? fmtMoney(data.amount) : ''}"
          style="font-size:22px;font-weight:800;letter-spacing:-.5px">
      </div>
      <div class="form-group">
        <label class="form-label">Kategoriya</label>
        <select class="form-select" id="fi_cat">
          ${cats.map(k => `<option value="${k}" ${data.cat===k?'selected':''}>${CATS[k].icon} ${CATS[k].label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Izoh (ixtiyoriy)</label>
        <input class="form-input" id="fi_note" type="text" placeholder="Qisqacha izoh..." value="${data.note || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Sana</label>
        <input class="form-input" id="fi_date" type="date" value="${data.date || todayStr()}">
      </div>`;
  }

  function openAdd(type) {
    openModal(type === 'income' ? '+ Daromad qo\'shish' : '− Xarajat qo\'shish',
      txForm(type) +
      `<button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Finance.saveTx('${type}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('fi_amount')?.focus(), 320);
  }

  function openEditTx(id) {
    const t = DB.getTransactions().find(x => x.id === id);
    if (!t) return;
    openModal(t.type === 'income' ? 'Daromadni tahrirlash' : 'Xarajatni tahrirlash',
      txForm(t.type, t) +
      `<button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Finance.updateTx('${id}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('fi_amount')?.focus(), 320);
  }

  function saveTx(type) {
    const amount = parseAmount(document.getElementById('fi_amount').value);
    if (!amount || amount <= 0) { alert('Miqdorni kiriting'); return; }
    const txs = DB.getTransactions();
    txs.push({ id: uid(), type, amount,
      cat:  document.getElementById('fi_cat').value,
      note: document.getElementById('fi_note').value.trim(),
      date: document.getElementById('fi_date').value || todayStr(),
    });
    DB.saveTransactions(txs);
    closeModal();
    App.renderPage('finance');
  }

  function updateTx(id) {
    const amount = parseAmount(document.getElementById('fi_amount').value);
    if (!amount || amount <= 0) { alert('Miqdorni kiriting'); return; }
    const txs = DB.getTransactions();
    const t   = txs.find(x => x.id === id);
    if (t) {
      t.amount = amount;
      t.cat    = document.getElementById('fi_cat').value;
      t.note   = document.getElementById('fi_note').value.trim();
      t.date   = document.getElementById('fi_date').value || todayStr();
    }
    DB.saveTransactions(txs);
    closeModal();
    App.renderPage('finance');
  }

  function delTx(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    DB.saveTransactions(DB.getTransactions().filter(t => t.id !== id));
    App.renderPage('finance');
  }

  // ── DEBT FORM (shared for add & edit) ────────────────────────
  function debtForm(type, data = {}) {
    const isBorrowed = type === 'borrowed';
    return `
      <div class="form-group">
        <label class="form-label">${isBorrowed ? 'Kimdan oldim?' : 'Kimga berdim?'} *</label>
        <input class="form-input" id="dbt_person" type="text" placeholder="Ism..." value="${data.person || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Miqdor (so'm) *</label>
        <input class="form-input" id="dbt_amount" type="text" inputmode="numeric" placeholder="0"
          oninput="numInput(this)" value="${data.amount ? fmtMoney(data.amount) : ''}"
          style="font-size:20px;font-weight:800">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sana</label>
          <input class="form-input" id="dbt_date" type="date" value="${data.date || todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">Qaytarish muddati</label>
          <input class="form-input" id="dbt_due" type="date" value="${data.dueDate || ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Izoh (ixtiyoriy)</label>
        <input class="form-input" id="dbt_note" type="text" placeholder="Sabab yoki eslatma..." value="${data.note || ''}">
      </div>`;
  }

  function openAddDebt(type) {
    const isBorrowed = type === 'borrowed';
    const btnStyle = `background:${isBorrowed ? '#D94040' : 'var(--green)'};color:#fff;box-shadow:${isBorrowed ? '0 4px 14px rgba(217,64,64,.35)' : 'var(--shadow-green)'}`;
    openModal(isBorrowed ? '📥 Qarz oldim' : '📤 Qarz berdim',
      debtForm(type) +
      `<button class="btn btn-full" style="${btnStyle}" onclick="Finance.saveDebt('${type}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('dbt_person')?.focus(), 320);
  }

  function openEditDebt(id) {
    const d = DB.getDebts().find(x => x.id === id);
    if (!d) return;
    const isBorrowed = d.type === 'borrowed';
    const btnStyle = `background:${isBorrowed ? '#D94040' : 'var(--green)'};color:#fff;`;
    openModal(isBorrowed ? '📥 Qarzni tahrirlash' : '📤 Qarzni tahrirlash',
      debtForm(d.type, d) +
      `<button class="btn btn-full" style="${btnStyle}" onclick="Finance.updateDebt('${id}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('dbt_person')?.focus(), 320);
  }

  function saveDebt(type) {
    const person = document.getElementById('dbt_person').value.trim();
    const amount = parseAmount(document.getElementById('dbt_amount').value);
    if (!person) { alert('Ismni kiriting'); return; }
    if (!amount || amount <= 0) { alert('Miqdorni kiriting'); return; }
    const debts = DB.getDebts();
    debts.push({ id: uid(), type, person, amount,
      date:    document.getElementById('dbt_date').value || todayStr(),
      dueDate: document.getElementById('dbt_due').value,
      note:    document.getElementById('dbt_note').value.trim(),
      paid: false,
    });
    DB.saveDebts(debts);
    closeModal();
    App.renderPage('finance');
  }

  function updateDebt(id) {
    const person = document.getElementById('dbt_person').value.trim();
    const amount = parseAmount(document.getElementById('dbt_amount').value);
    if (!person) { alert('Ismni kiriting'); return; }
    if (!amount || amount <= 0) { alert('Miqdorni kiriting'); return; }
    const debts = DB.getDebts();
    const d = debts.find(x => x.id === id);
    if (d) {
      d.person  = person;
      d.amount  = amount;
      d.date    = document.getElementById('dbt_date').value || todayStr();
      d.dueDate = document.getElementById('dbt_due').value;
      d.note    = document.getElementById('dbt_note').value.trim();
    }
    DB.saveDebts(debts);
    closeModal();
    App.renderPage('finance');
  }

  function payDebt(id) {
    const debts = DB.getDebts();
    const d = debts.find(x => x.id === id);
    if (d) d.paid = true;
    DB.saveDebts(debts);
    const el = document.getElementById('debtsSection');
    if (el) el.innerHTML = renderDebts();
  }

  function delDebt(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    DB.saveDebts(DB.getDebts().filter(d => d.id !== id));
    const el = document.getElementById('debtsSection');
    if (el) el.innerHTML = renderDebts();
  }

  return {
    render, setDebtTab, scrollToDebts,
    openAdd, openEditTx, saveTx, updateTx, delTx,
    openAddDebt, openEditDebt, saveDebt, updateDebt, payDebt, delDebt,
  };
})();
