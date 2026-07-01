let cloudData = null;
let _syncTimer = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DB = {
  // Load from Supabase on login
  async initCloud() {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      
      const { data, error } = await sb.from('user_data').select('data').eq('user_id', user.id).single();
      
      if (error && error.code === 'PGRST116') {
        // Yozuv topilmadi, yangi yaratamiz
        cloudData = { transactions: [], books: [], habits: [], habitLogs: {}, goals: [], subs: [], notes: [], debts: [], budgets: {}, recurring: [] };
        // Localda bo'lsa, uni o'tkazib qo'yamiz (migratsiya)
        cloudData.transactions = this.get('transactions', []);
        cloudData.books = this.get('books', []);
        cloudData.habits = this.get('habits', []);
        cloudData.habitLogs = this.get('habitLogs', {});
        cloudData.goals = this.get('goals', []);
        cloudData.subs = this.get('subs', []);
        cloudData.notes = this.get('notes', []);
        cloudData.debts = this.get('debts', []);
        
        await sb.from('user_data').insert([{ user_id: user.id, data: cloudData }]);
      } else if (data) {
        cloudData = data.data || {};
      }
    } catch(e) {
      console.error("Cloud DB error:", e);
      if (!cloudData) cloudData = null; // fallback
    }
  },

  async syncCloud() {
    if (!cloudData) return;
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        await sb.from('user_data')
          .update({ data: cloudData, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        localStorage.removeItem('tartib_pending_sync');
      }
    } catch(e) { console.error("Cloud sync error:", e); }
  },

  hasCloud() { return cloudData !== null; },

  get(key, def) {
    if (cloudData && cloudData[key] !== undefined) return cloudData[key];
    try { const v = localStorage.getItem('cp_'+key); return v ? JSON.parse(v) : def; } catch { return def; }
  },

  set(key, val) {
    if (cloudData) {
      cloudData[key] = val;
      clearTimeout(_syncTimer);
      _syncTimer = setTimeout(() => DB.syncCloud(), 1500);
    }
    // Oflayn o'zgarishlarni kuzatish uchun flag
    localStorage.setItem('tartib_pending_sync', '1');
    // Lokalga ham saqlab qo'yamiz zaxira uchun
    try { localStorage.setItem('cp_'+key, JSON.stringify(val)); } catch {}
  },

  // --- GETTERS & SETTERS ---
  getTransactions() { return this.get('transactions', []); },
  saveTransactions(t) { this.set('transactions', t); },
  
  getBooks() { return this.get('books', []); },
  saveBooks(b) { this.set('books', b); },
  
  getHabits() { return this.get('habits', []); },
  saveHabits(h) { this.set('habits', h); },
  getHabitLogs() { return this.get('habitLogs', {}); },
  saveHabitLogs(l) { this.set('habitLogs', l); },
  
  getGoals() { return this.get('goals', []); },
  saveGoals(g) { this.set('goals', g); },
  
  getSubs() { return this.get('subs', []); },
  saveSubs(s) { this.set('subs', s); },
  
  getNotes() { return this.get('notes', []); },
  saveNotes(n) { this.set('notes', n); },
  
  getDebts() { return this.get('debts', []); },
  saveDebts(d) { this.set('debts', d); },

  getBudgets()  { return this.get('budgets', {}); },
  saveBudgets(b){ this.set('budgets', b); },

  getRecurring()  { return this.get('recurring', []); },
  saveRecurring(r){ this.set('recurring', r); },
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function fmtMoney(n) {
  return new Intl.NumberFormat('uz-UZ').format(Math.abs(n));
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

// Format number input with spaces every 3 digits (e.g. 10 000)
function numInput(el) {
  const pos = el.selectionStart;
  const oldLen = el.value.length;
  const raw = el.value.replace(/\D/g, '');
  if (!raw) { el.value = ''; return; }
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    if (i > 0 && (raw.length - i) % 3 === 0) result += ' ';
    result += raw[i];
  }
  el.value = result;
  const diff = result.length - oldLen;
  try { el.setSelectionRange(pos + diff, pos + diff); } catch(e) {}
}

// Strip spaces and parse float
function parseAmount(str) {
  return parseFloat(String(str).replace(/\s/g, '')) || 0;
}

// ===== CUSTOM SELECT =====
const CSelect = (() => {
  const CHECK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"><polyline points="20 6 9 17 4 12"/></svg>`;
  const ARROW = `<svg class="csel-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;

  document.addEventListener('click', e => {
    if (!e.target.closest('.csel')) _closeAll();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') _closeAll();
  });

  function _closeAll() {
    document.querySelectorAll('.csel.open').forEach(el => el.classList.remove('open'));
  }

  function toggle(id) {
    const el = document.getElementById('csel_' + id);
    if (!el) return;
    const wasOpen = el.classList.contains('open');
    _closeAll();
    if (!wasOpen) el.classList.add('open');
  }

  function pick(id, value) {
    const el = document.getElementById('csel_' + id);
    if (!el) return;
    el.dataset.value = value;
    const opt = el.querySelector(`.csel-option[data-value="${value}"]`);
    const labelEl = el.querySelector('.csel-label');
    if (opt && labelEl) {
      const txt = opt.querySelector('.csel-otext');
      labelEl.innerHTML = txt ? txt.innerHTML : opt.textContent.trim();
    }
    el.querySelectorAll('.csel-option').forEach(o => o.classList.toggle('sel', o.dataset.value === value));
    _closeAll();
    const cb = el.dataset.onChange;
    if (cb) {
      const parts = cb.split('.');
      let fn = window;
      for (const p of parts) fn = fn?.[p];
      if (typeof fn === 'function') fn(value);
    }
  }

  function getValue(id) {
    const el = document.getElementById('csel_' + id);
    return el ? el.dataset.value : '';
  }

  function html(id, options, selected, onChange) {
    const sel = selected || options[0]?.value;
    const cur = options.find(o => o.value === sel) || options[0];
    return `<div class="csel" id="csel_${id}" data-value="${cur?.value ?? ''}"${onChange ? ` data-on-change="${onChange}"` : ''}>
      <button type="button" class="csel-trigger" onclick="CSelect.toggle('${id}')">
        <span class="csel-label">${cur?.label ?? ''}</span>
        ${ARROW}
      </button>
      <div class="csel-list">
        ${options.map(o => `<div class="csel-option${o.value === cur?.value ? ' sel' : ''}" data-value="${o.value}" onclick="CSelect.pick('${id}','${o.value}')">
          <span class="csel-otext">${o.label}</span>
          <span class="csel-check">${CHECK}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  return { toggle, pick, getValue, html };
})();
