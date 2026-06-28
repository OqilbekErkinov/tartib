const DB = {
  get(key, def = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  // Finance
  getTransactions() { return this.get('cp_transactions', []); },
  saveTransactions(t) { this.set('cp_transactions', t); },
  // Books
  getBooks() { return this.get('cp_books', []); },
  saveBooks(b) { this.set('cp_books', b); },
  // Habits
  getHabits() { return this.get('cp_habits', []); },
  saveHabits(h) { this.set('cp_habits', h); },
  getHabitLogs() { return this.get('cp_habit_logs', {}); },
  saveHabitLogs(l) { this.set('cp_habit_logs', l); },
  // Goals
  getGoals() { return this.get('cp_goals', []); },
  saveGoals(g) { this.set('cp_goals', g); },
  // Subscriptions
  getSubs() { return this.get('cp_subs', []); },
  saveSubs(s) { this.set('cp_subs', s); },
  // Notes
  getNotes() { return this.get('cp_notes', []); },
  saveNotes(n) { this.set('cp_notes', n); },
  // Debts
  getDebts() { return this.get('cp_debts', []); },
  saveDebts(d) { this.set('cp_debts', d); },
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
