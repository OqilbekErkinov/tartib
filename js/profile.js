const Profile = (() => {

  // ── HELPERS ──────────────────────────────────────────────────
  function getUserDisplayName(user) {
    const fn = user?.user_metadata?.first_name || '';
    const ln = user?.user_metadata?.last_name  || '';
    if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
    return user?.email || 'Foydalanuvchi';
  }

  function getInitials(user) {
    const fn = user?.user_metadata?.first_name;
    const ln = user?.user_metadata?.last_name;
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    if (fn)       return fn.slice(0, 2).toUpperCase();
    const email = user?.email || '';
    const local = email.split('@')[0];
    const parts = local.split(/[._-]/).filter(p => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (local.slice(0, 2) || '??').toUpperCase();
  }

  function getMemberDays(createdAt) {
    if (!createdAt) return 1;
    const start = new Date(createdAt);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today - start) / 86400000) + 1;
  }

  function getLongestStreak() {
    const habits = DB.getHabits();
    const logs   = DB.getHabitLogs();
    let max = 0;
    habits.forEach(h => {
      let streak = 0;
      const d = new Date();
      for (let i = 0; i < 366; i++) {
        const key = d.toISOString().slice(0, 10);
        if (logs[key]?.[h.id]) { streak++; d.setDate(d.getDate() - 1); }
        else break;
      }
      if (streak > max) max = streak;
    });
    return max;
  }

  // ── RENDER ───────────────────────────────────────────────────
  function render() {
    const user      = Auth.getUser();
    const initials  = getInitials(user);
    const name      = getUserDisplayName(user);
    const email     = user?.email || '';
    const fn        = user?.user_metadata?.first_name || '';
    const ln        = user?.user_metadata?.last_name  || '';
    const createdAt = user?.created_at || null;
    const days      = getMemberDays(createdAt);
    const since     = createdAt ? fmtDate(createdAt) : '—';
    const streak    = getLongestStreak();
    const hasName   = fn || ln;

    return `<div class="page-enter">

      <!-- Hero -->
      <div class="profile-hero">
        <div class="profile-avatar">${escapeHtml(initials)}</div>
        <div class="profile-info">
          ${hasName
            ? `<div class="profile-name">${escapeHtml(name)}</div>
               <div class="profile-email">${escapeHtml(email)}</div>`
            : `<div class="profile-name">${escapeHtml(email)}</div>`
          }
          <div class="profile-since">A'zo: ${since}</div>
          <div style="display:flex;gap:6px;margin-top:7px;flex-wrap:wrap;align-items:center">
            <span class="badge badge-orange">📅 ${days} kun</span>
            ${streak > 0 ? `<span class="badge badge-green">🔥 ${streak} seriya</span>` : ''}
          </div>
        </div>
        <button onclick="Profile.openEditProfile()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:7px 13px;color:rgba(255,255,255,.85);font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;font-family:var(--font);-webkit-tap-highlight-color:transparent;letter-spacing:.1px">
          ✎ Tahrir
        </button>
      </div>

      <!-- Reports -->
      <div class="section-head" style="margin-top:4px"><h2>Hisobotlar</h2></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="profile-action-btn" onclick="Profile.exportFinanceReport()">
          <span class="profile-action-icon">📊</span>
          <div class="profile-action-body">
            <div class="profile-action-title">Moliya hisoboti</div>
            <div class="profile-action-sub">Daromad, xarajat, kategoriyalar, qarzlar — Word (.doc)</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text3);flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="profile-action-btn" onclick="Profile.exportBooksReport()">
          <span class="profile-action-icon">📚</span>
          <div class="profile-action-body">
            <div class="profile-action-title">Kitoblar hisoboti</div>
            <div class="profile-action-sub">Kutubxona, o'qilganlar, berilganlar — Word (.doc)</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text3);flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>

      <!-- App install -->
      <div class="section-head" style="margin-top:16px"><h2>Ilova</h2></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="profile-action-btn" onclick="App.installPwa()">
          <span class="profile-action-icon">📱</span>
          <div class="profile-action-body">
            <div class="profile-action-title">Ilovani o'rnatish</div>
            <div class="profile-action-sub">${App.canInstall() ? 'Tartibla ni telefon ekraniga qo\'shing' : 'Ilova allaqachon o\'rnatilgan'}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text3);flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>

      <!-- Account settings -->
      <div class="section-head" style="margin-top:16px"><h2>Hisob sozlamalari</h2></div>
      <div style="display:flex;flex-direction:column;gap:8px;padding-bottom:8px">
        <button class="profile-action-btn" onclick="Profile.openChangePassword()">
          <span class="profile-action-icon">🔑</span>
          <div class="profile-action-body">
            <div class="profile-action-title">Parolni o'zgartirish</div>
            <div class="profile-action-sub">Yangi xavfsiz parol o'rnating</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--text3);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="profile-action-btn profile-action-danger" onclick="Auth.logout()">
          <span class="profile-action-icon">🚪</span>
          <div class="profile-action-body">
            <div class="profile-action-title" style="color:#D94040">Tizimdan chiqish</div>
            <div class="profile-action-sub">Hisobdan xavfsiz chiqish</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D94040" stroke-width="2.5" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

    </div>`;
  }

  // ── EDIT PROFILE ─────────────────────────────────────────────
  function openEditProfile() {
    const user = Auth.getUser();
    const fn   = user?.user_metadata?.first_name || '';
    const ln   = user?.user_metadata?.last_name  || '';
    openModal('Profilni tahrirlash', `
      <div class="form-group">
        <label class="form-label">Ism</label>
        <input class="form-input" id="prof_fn" type="text" placeholder="Ismingiz..." value="${escapeHtml(fn)}">
      </div>
      <div class="form-group">
        <label class="form-label">Familiya</label>
        <input class="form-input" id="prof_ln" type="text" placeholder="Familiyangiz..." value="${escapeHtml(ln)}">
      </div>
      <div id="prof_editErr" style="color:#FF9090;font-size:13px;min-height:18px;margin-bottom:6px"></div>
      <button class="btn btn-primary btn-full" id="prof_editSaveBtn" onclick="Profile.saveProfile()">Saqlash</button>
    `);
    setTimeout(() => document.getElementById('prof_fn')?.focus(), 320);
  }

  async function saveProfile() {
    const fn    = document.getElementById('prof_fn').value.trim();
    const ln    = document.getElementById('prof_ln').value.trim();
    const errEl = document.getElementById('prof_editErr');
    const btn   = document.getElementById('prof_editSaveBtn');
    errEl.textContent = 'Saqlanmoqda...';
    btn.disabled = true;
    const { error } = await sb.auth.updateUser({ data: { first_name: fn, last_name: ln } });
    btn.disabled = false;
    if (error) {
      errEl.textContent = error.message;
    } else {
      await Auth.refreshUser();
      closeModal();
      App.Toast("Profil yangilandi!", 'success');
      App.renderPage('profile');
    }
  }

  // ── CHANGE PASSWORD ──────────────────────────────────────────
  function openChangePassword() {
    const EYE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    openModal("Parolni o'zgartirish", `
      <div class="form-group">
        <label class="form-label">Yangi parol</label>
        <div style="position:relative">
          <input type="password" class="form-input" id="prof_new" placeholder="Kamida 6 belgi" style="padding-right:45px">
          <button type="button" onclick="Auth.togglePassword(this)" style="position:absolute;right:12px;top:13px;background:none;border:none;cursor:pointer;color:var(--text2);padding:0;display:flex;align-items:center">${EYE}</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Parolni tasdiqlang</label>
        <div style="position:relative">
          <input type="password" class="form-input" id="prof_confirm" placeholder="Parolni qaytaring" style="padding-right:45px">
          <button type="button" onclick="Auth.togglePassword(this)" style="position:absolute;right:12px;top:13px;background:none;border:none;cursor:pointer;color:var(--text2);padding:0;display:flex;align-items:center">${EYE}</button>
        </div>
      </div>
      <div id="prof_passErr" style="color:#FF9090;font-size:13px;min-height:18px;margin-bottom:6px"></div>
      <button class="btn btn-primary btn-full" id="prof_passBtn" onclick="Profile.saveNewPassword()">Saqlash</button>
    `);
    setTimeout(() => document.getElementById('prof_new')?.focus(), 320);
  }

  async function saveNewPassword() {
    const p1    = document.getElementById('prof_new').value;
    const p2    = document.getElementById('prof_confirm').value;
    const errEl = document.getElementById('prof_passErr');
    const btn   = document.getElementById('prof_passBtn');
    if (p1.length < 6) { errEl.textContent = "Parol kamida 6 ta belgi bo'lishi kerak"; return; }
    if (p1 !== p2)     { errEl.textContent = 'Parollar mos kelmadi'; return; }
    errEl.textContent = 'Saqlanmoqda...';
    btn.disabled = true;
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) {
      errEl.textContent = error.message;
      btn.disabled = false;
    } else {
      closeModal();
      App.Toast("Parol muvaffaqiyatli yangilandi!", 'success');
    }
  }

  // ── WORD EXPORT CORE ─────────────────────────────────────────
  function downloadDoc(bodyHtml, filename) {
    const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='UTF-8'>
<style>
  body      { font-family: Arial, sans-serif; font-size: 11pt; margin: 0; color: #333; }
  h1        { font-size: 18pt; color: #F58F20; text-align: center; margin-bottom: 4px; }
  .meta     { text-align: center; color: #888; font-size: 10pt; margin-bottom: 24px; }
  h2        { font-size: 13pt; color: #363636; margin: 22px 0 8px;
              border-left: 4px solid #F58F20; padding-left: 10px; }
  table     { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10.5pt; }
  th        { background: #363636; color: #fff; padding: 7px 11px; text-align: left; }
  td        { border: 1px solid #ddd; padding: 6px 11px; }
  tr:nth-child(even) td { background: #faf8f5; }
  .total td { font-weight: bold; background: #f0ebe4 !important; }
  .inc      { color: #467434; font-weight: 700; }
  .exp      { color: #D94040; font-weight: 700; }
  .ora      { color: #F58F20; font-weight: 700; }
  .empty    { color: #999; font-style: italic; font-size: 10.5pt; }
  .kv       { margin-bottom: 14px; }
  .kv-row   { display: flex; gap: 20px; margin-bottom: 8px; }
  .kv-label { font-size: 10pt; color: #888; min-width: 160px; }
  .kv-val   { font-size: 11pt; font-weight: 700; }
</style>
</head>
<body>${bodyHtml}</body></html>`;
    const blob = new Blob([doc], { type: 'application/msword' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── FINANCE REPORT ───────────────────────────────────────────
  function exportFinanceReport() {
    const CAT = {
      food:'Oziq-ovqat', cafe:'Kafe/Restoran', trans:'Transport',
      cloth:'Kiyim', health:"Sog'liq", edu:"Ta'lim",
      entmt:"Ko'ngil ochar", house:'Uy xarajati',
      salary:'Oylik maosh', gift:"Sovg'a", other:'Boshqa',
    };
    const UZ_M = ['Yanvar','Fevral','Mart','Aprel','May','Iyun',
                  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

    const txs   = DB.getTransactions();
    const debts = DB.getDebts();
    const user  = Auth.getUser();

    const sorted       = [...txs].sort((a,b) => b.date.localeCompare(a.date));
    const incomes      = sorted.filter(t => t.type === 'income');
    const expenses     = sorted.filter(t => t.type === 'expense');
    const totalIncome  = incomes.reduce((s,t)=>s+t.amount, 0);
    const totalExpense = expenses.reduce((s,t)=>s+t.amount, 0);
    const balance      = totalIncome - totalExpense;
    const savingsRate  = totalIncome ? Math.max(0,Math.round((1-totalExpense/totalIncome)*100)) : 0;

    // Monthly breakdown
    const monthMap = {};
    txs.forEach(t => {
      const k = t.date.slice(0,7);
      if (!monthMap[k]) monthMap[k] = { income:0, expense:0 };
      if (t.type==='income') monthMap[k].income += t.amount;
      else                   monthMap[k].expense += t.amount;
    });
    const months = Object.entries(monthMap).sort(([a],[b])=>b.localeCompare(a));

    // Category breakdown
    const catMap = {};
    expenses.forEach(t => { catMap[t.cat] = (catMap[t.cat]||0) + t.amount; });
    const cats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);

    const borrowed     = debts.filter(d=>d.type==='borrowed'&&!d.paid);
    const lentD        = debts.filter(d=>d.type==='lent'&&!d.paid);
    const paidDebts    = debts.filter(d=>d.paid);
    const totalOwed    = borrowed.reduce((s,d)=>s+d.amount,0);
    const totalLentOut = lentD.reduce((s,d)=>s+d.amount,0);

    const now      = new Date().toLocaleDateString('uz-UZ',{day:'numeric',month:'long',year:'numeric'});
    const userName = getUserDisplayName(user);

    const mLabel = k => {
      const [y,m] = k.split('-');
      return `${UZ_M[+m-1]} ${y}`;
    };

    const txRow = (t, cls) => `<tr>
      <td>${fmtDate(t.date)}</td>
      <td>${CAT[t.cat]||t.cat||'—'}</td>
      <td>${escapeHtml(t.note)||'—'}</td>
      <td class="${cls}" style="white-space:nowrap">${cls==='inc'?'+':'−'}${fmtMoney(t.amount)} so'm</td>
    </tr>`;

    const debtRow = d => `<tr>
      <td>${escapeHtml(d.person)}</td>
      <td>${fmtDate(d.date)}</td>
      <td>${d.dueDate ? fmtDate(d.dueDate) : '—'}</td>
      <td style="white-space:nowrap">${fmtMoney(d.amount)} so'm</td>
      <td>${escapeHtml(d.note)||'—'}</td>
    </tr>`;

    const body = `
      <h1>Tartibla — Moliya Hisoboti</h1>
      <p class="meta">Foydalanuvchi: <b>${escapeHtml(userName)}</b> &nbsp;|&nbsp; Sana: ${now}</p>

      <h2>1. Umumiy ko'rsatkichlar</h2>
      <table>
        <tr><th>Ko'rsatkich</th><th>Qiymat</th></tr>
        <tr><td>Jami daromad</td><td class="inc">+${fmtMoney(totalIncome)} so'm</td></tr>
        <tr><td>Jami xarajat</td><td class="exp">−${fmtMoney(totalExpense)} so'm</td></tr>
        <tr class="total"><td>Sof balans</td><td class="${balance>=0?'inc':'exp'}">${balance>=0?'+':'−'}${fmtMoney(Math.abs(balance))} so'm</td></tr>
        <tr><td>Tejash foizi</td><td class="ora">${savingsRate}%</td></tr>
        <tr><td>Jami tranzaksiyalar</td><td>${txs.length} ta (${incomes.length} daromad, ${expenses.length} xarajat)</td></tr>
      </table>

      <h2>2. Oylik tahlil</h2>
      ${months.length ? `
      <table>
        <tr><th>Oy</th><th>Daromad</th><th>Xarajat</th><th>Sof balans</th></tr>
        ${months.map(([k,m]) => {
          const net = m.income - m.expense;
          return `<tr>
            <td>${mLabel(k)}</td>
            <td class="inc">+${fmtMoney(m.income)} so'm</td>
            <td class="exp">−${fmtMoney(m.expense)} so'm</td>
            <td class="${net>=0?'inc':'exp'}">${net>=0?'+':'−'}${fmtMoney(Math.abs(net))} so'm</td>
          </tr>`;
        }).join('')}
      </table>` : '<p class="empty">Tranzaksiyalar mavjud emas.</p>'}

      <h2>3. Daromadlar ro'yxati (${incomes.length} ta)</h2>
      ${incomes.length ? `
      <table>
        <tr><th>Sana</th><th>Kategoriya</th><th>Izoh</th><th>Miqdor</th></tr>
        ${incomes.map(t=>txRow(t,'inc')).join('')}
        <tr class="total"><td colspan="3">Jami daromad</td><td class="inc">+${fmtMoney(totalIncome)} so'm</td></tr>
      </table>` : '<p class="empty">Daromadlar mavjud emas.</p>'}

      <h2>4. Xarajatlar ro'yxati (${expenses.length} ta)</h2>
      ${expenses.length ? `
      <table>
        <tr><th>Sana</th><th>Kategoriya</th><th>Izoh</th><th>Miqdor</th></tr>
        ${expenses.map(t=>txRow(t,'exp')).join('')}
        <tr class="total"><td colspan="3">Jami xarajat</td><td class="exp">−${fmtMoney(totalExpense)} so'm</td></tr>
      </table>` : '<p class="empty">Xarajatlar mavjud emas.</p>'}

      <h2>5. Xarajatlar kategoriya bo'yicha</h2>
      ${cats.length ? `
      <table>
        <tr><th>Kategoriya</th><th>Miqdor</th><th>Ulush</th></tr>
        ${cats.map(([k,v]) => {
          const pct = totalExpense ? Math.round(v/totalExpense*100) : 0;
          return `<tr>
            <td>${CAT[k]||k}</td>
            <td class="exp">−${fmtMoney(v)} so'm</td>
            <td>${pct}%</td>
          </tr>`;
        }).join('')}
        <tr class="total"><td>Jami xarajat</td><td class="exp">−${fmtMoney(totalExpense)} so'm</td><td>100%</td></tr>
      </table>` : '<p class="empty">Xarajatlar mavjud emas.</p>'}

      <h2>6. Qarzdorligim — to'lanmagan (${borrowed.length} ta)</h2>
      ${borrowed.length ? `
      <table>
        <tr><th>Kimdan</th><th>Sana</th><th>Muddat</th><th>Miqdor</th><th>Izoh</th></tr>
        ${borrowed.map(debtRow).join('')}
        <tr class="total"><td colspan="3">Jami qarzdorlik</td><td class="exp">${fmtMoney(totalOwed)} so'm</td><td></td></tr>
      </table>` : '<p class="empty">To\'lanmagan qarzdorlik yo\'q.</p>'}

      <h2>7. Berganlarim — qaytmagan (${lentD.length} ta)</h2>
      ${lentD.length ? `
      <table>
        <tr><th>Kimga</th><th>Sana</th><th>Muddat</th><th>Miqdor</th><th>Izoh</th></tr>
        ${lentD.map(debtRow).join('')}
        <tr class="total"><td colspan="3">Jami kutilayotgan</td><td class="inc">${fmtMoney(totalLentOut)} so'm</td><td></td></tr>
      </table>` : '<p class="empty">Qaytmagan qarz yo\'q.</p>'}

      ${paidDebts.length ? `
      <h2>8. To'langan qarzlar tarixi (${paidDebts.length} ta)</h2>
      <table>
        <tr><th>Tur</th><th>Kim</th><th>Sana</th><th>Miqdor</th><th>Izoh</th></tr>
        ${paidDebts.map(d=>`<tr>
          <td>${d.type==='borrowed'?'Olgan':'Bergan'}</td>
          <td>${escapeHtml(d.person)}</td>
          <td>${fmtDate(d.date)}</td>
          <td>${fmtMoney(d.amount)} so'm</td>
          <td>${escapeHtml(d.note)||'—'}</td>
        </tr>`).join('')}
      </table>` : ''}
    `;

    downloadDoc(body, `tartibla-moliya-${todayStr()}`);
    App.Toast("Moliya hisoboti yuklab olindi!", 'success');
  }

  // ── BOOKS REPORT ─────────────────────────────────────────────
  function exportBooksReport() {
    const books = DB.getBooks();

    // Har bir kitob o'z asosiy statusida, berilgan bo'lsa ham
    const read    = books.filter(b => b.status === 'read');
    const reading = books.filter(b => b.status === 'reading');
    const unread  = books.filter(b => b.status === 'unread');
    // Berilgan: yangi usul (lentTo bor) + eski usul (status='lent')
    const lentAll = books.filter(b => b.lentTo || b.status === 'lent');

    const user     = Auth.getUser();
    const userName = getUserDisplayName(user);
    const now      = new Date().toLocaleDateString('uz-UZ',{day:'numeric',month:'long',year:'numeric'});

    // Kitob qatori — berilgan bo'lsa belgi qo'shadi
    const bRow = (b, i, extra=[]) => {
      const lentBadge = b.lentTo
        ? ` <span style="color:#D97A10;font-size:9.5pt;font-weight:700">[📤 ${escapeHtml(b.lentTo)}]</span>` : '';
      return `<tr>
        <td>${i+1}</td>
        <td><b>${escapeHtml(b.title)}</b>${lentBadge}</td>
        <td>${escapeHtml(b.author)||'—'}</td>
        ${extra.map(v=>`<td>${v}</td>`).join('')}
      </tr>`;
    };

    // Berilgan kitoblar (barcha statusdan)
    const lentRow = (b,i) => `<tr>
      <td>${i+1}</td>
      <td><b>${escapeHtml(b.title)}</b></td>
      <td>${escapeHtml(b.author)||'—'}</td>
      <td>${b.status==='read'?"O'qilgan":b.status==='reading'?"O'qilmoqda":b.status==='unread'?'Yangi':'—'}</td>
      <td>${escapeHtml(b.lentTo||b.lentTo||'—')}</td>
      <td>${b.lentDate ? fmtDate(b.lentDate) : '—'}</td>
    </tr>`;

    const body = `
      <h1>Tartibla — Kitoblar Hisoboti</h1>
      <p class="meta">Foydalanuvchi: <b>${escapeHtml(userName)}</b> &nbsp;|&nbsp; Sana: ${now}</p>

      <h2>1. Kutubxona ko'rsatkichlari</h2>
      <table>
        <tr><th>Ko'rsatkich</th><th>Soni</th><th>Izoh</th></tr>
        <tr><td>Jami kitoblar</td><td><b>${books.length} ta</b></td><td>—</td></tr>
        <tr><td class="inc">O'qilgan</td><td class="inc">${read.length} ta</td><td>${read.filter(b=>b.lentTo).length} tasi hozir birovda</td></tr>
        <tr><td class="ora">O'qilmoqda</td><td class="ora">${reading.length} ta</td><td>${reading.filter(b=>b.lentTo).length} tasi hozir birovda</td></tr>
        <tr><td>Yangi (o'qilmagan)</td><td>${unread.length} ta</td><td>${unread.filter(b=>b.lentTo).length} tasi hozir birovda</td></tr>
        <tr><td class="exp">Hozir berilgan</td><td class="exp">${lentAll.length} ta</td><td>qaytmagan</td></tr>
      </table>

      <h2>2. O'qilgan kitoblar (${read.length} ta)</h2>
      ${read.length ? `
      <table>
        <tr><th>#</th><th>Nomi</th><th>Muallif</th><th>O'qilgan yil</th><th>Sotib olingan</th></tr>
        ${read.map((b,i)=>bRow(b,i,[b.readYear||'—', b.buyDate ? fmtDate(b.buyDate) : '—'])).join('')}
      </table>` : '<p class="empty">Hali birorta kitob o\'qib bo\'linmagan.</p>'}

      <h2>3. Hozir o'qilayotgan kitoblar (${reading.length} ta)</h2>
      ${reading.length ? `
      <table>
        <tr><th>#</th><th>Nomi</th><th>Muallif</th><th>Sotib olingan</th></tr>
        ${reading.map((b,i)=>bRow(b,i,[b.buyDate ? fmtDate(b.buyDate) : '—'])).join('')}
      </table>` : '<p class="empty">Hozir o\'qilayotgan kitob yo\'q.</p>'}

      <h2>4. Yangi kitoblar — o'qilmagan (${unread.length} ta)</h2>
      ${unread.length ? `
      <table>
        <tr><th>#</th><th>Nomi</th><th>Muallif</th><th>Sotib olingan</th></tr>
        ${unread.map((b,i)=>bRow(b,i,[b.buyDate ? fmtDate(b.buyDate) : '—'])).join('')}
      </table>` : '<p class="empty">Yangi kitob yo\'q.</p>'}

      <h2>5. Berilgan kitoblar — qaytmagan (${lentAll.length} ta)</h2>
      ${lentAll.length ? `
      <table>
        <tr><th>#</th><th>Nomi</th><th>Muallif</th><th>Holati</th><th>Kimga</th><th>Berilgan sana</th></tr>
        ${lentAll.map((b,i)=>lentRow(b,i)).join('')}
      </table>` : '<p class="empty">Hech kimga kitob berilmagan.</p>'}
    `;

    downloadDoc(body, `tartibla-kitoblar-${todayStr()}`);
    App.Toast("Kitoblar hisoboti yuklab olindi!", 'success');
  }

  return {
    render, getInitials, getUserDisplayName,
    openEditProfile, saveProfile,
    openChangePassword, saveNewPassword,
    exportFinanceReport, exportBooksReport,
  };
})();
