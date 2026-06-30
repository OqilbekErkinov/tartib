const Books = (() => {
  const COLORS = ['#F58F20','#467434','#363636','#3B82F6','#8B5CF6','#EC4899','#EF4444','#06B6D4','#64748B'];
  let activeTab = 'unread';
  let sortOrder = 'desc'; // desc = yangi→eski, asc = eski→yangi

  function render() {
    const books = DB.getBooks();
    const tabs  = { all: 'Jami', unread: 'Yangi', reading: "O'qilmoqda", read: "O'qilgan", lent: 'Berilgan' };

    let filtered;
    if (activeTab === 'all') {
      filtered = [...books].sort((a, b) => {
        const da = a.buyDate ? new Date(a.buyDate) : new Date(0);
        const db = b.buyDate ? new Date(b.buyDate) : new Date(0);
        return sortOrder === 'desc' ? db - da : da - db;
      });
    } else if (activeTab === 'lent') {
      filtered = books.filter(b => b.lentTo || b.status === 'lent');
    } else if (activeTab === 'read') {
      // eski usul (status='lent') o'qilgan deb hisoblanadi
      filtered = books.filter(b => b.status === 'read' || b.status === 'lent');
    } else {
      filtered = books.filter(b => b.status === activeTab);
    }

    const msgs = {
      all:     "Hali birorta kitob qo'shilmagan",
      unread:  "Yangi kitob qo'shing",
      reading: "Hozir kitob o'qilmayapti",
      read:    "Hali kitob o'qib bo'linmagan",
      lent:    "Hech kimga kitob berilmagan",
    };
    const counts = {
      unread:  books.filter(b => b.status === 'unread').length,
      reading: books.filter(b => b.status === 'reading').length,
      read:    books.filter(b => b.status === 'read' || b.status === 'lent').length,
      lent:    books.filter(b => b.lentTo || b.status === 'lent').length,
    };
    const total = books.length;

    const sortBar = activeTab === 'all' ? `
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
        <span style="font-size:11px;font-weight:700;color:var(--text2);margin-right:2px">Saralash:</span>
        <button onclick="Books.setSort('desc')" class="btn btn-sm" style="font-size:11px;padding:4px 11px;font-weight:700;${sortOrder==='desc'?'background:var(--orange);color:#fff;border-color:var(--orange)':'background:var(--surface2);color:var(--text2);border-color:var(--border)'}">↓ Yangi</button>
        <button onclick="Books.setSort('asc')"  class="btn btn-sm" style="font-size:11px;padding:4px 11px;font-weight:700;${sortOrder==='asc' ?'background:var(--orange);color:#fff;border-color:var(--orange)':'background:var(--surface2);color:var(--text2);border-color:var(--border)'}">↑ Eski</button>
      </div>` : '';

    const booksHtml = filtered.length === 0
      ? `<div class="empty-state"><span class="empty-icon">📚</span><p>${msgs[activeTab]}</p></div>`
      : filtered.map(b => bookCard(b)).join('');

    return `<div class="page-enter">
      <div style="background:var(--dark);border-radius:var(--radius);padding:16px 18px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow-dark)">
        <div>
          <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px">Jami kutubxona</div>
          <div style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1">${total} <span style="font-size:16px;font-weight:600;opacity:.6">ta kitob</span></div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:5px">
          <div style="font-size:11px;color:rgba(255,255,255,.55);font-weight:600">
            <span style="color:#FFB045;font-weight:800">${counts.unread}</span> yangi &nbsp;·&nbsp;
            <span style="color:var(--orange);font-weight:800">${counts.reading}</span> o'qilmoqda
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,.55);font-weight:600">
            <span style="color:#6AE06A;font-weight:800">${counts.read}</span> o'qilgan &nbsp;·&nbsp;
            <span style="color:#FF9090;font-weight:800">${counts.lent}</span> berilgan
          </div>
        </div>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
        ${[
          { k:'unread',  label:'Yangi',      color:'var(--dark)' },
          { k:'reading', label:"O'qilmoqda", color:'var(--orange)' },
          { k:'read',    label:"O'qilgan",   color:'var(--green)' },
          { k:'lent',    label:'Berilgan',   color:'#D94040' },
        ].map(s => `
          <div class="stat-card" style="padding:11px 10px;text-align:center;cursor:pointer;${activeTab===s.k?'border-top:3px solid '+s.color:''}" onclick="Books.setTab('${s.k}')">
            <div style="font-size:20px;font-weight:900;color:${s.color}">${counts[s.k]}</div>
            <div style="font-size:9px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.3px;margin-top:2px">${s.label}</div>
          </div>`).join('')}
      </div>

      <div class="tabs" style="overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch">
        ${Object.entries(tabs).map(([k, v]) =>
          `<button class="tab-btn ${activeTab===k?'active':''}" style="white-space:nowrap;flex-shrink:0" onclick="Books.setTab('${k}')">${v}</button>`
        ).join('')}
      </div>

      ${sortBar}
      ${booksHtml}
    </div>`;
  }

  function bookCard(b) {
    const isLent = !!(b.lentTo || b.status === 'lent');
    let statusActions = '';
    if (isLent) {
      statusActions = `<button class="btn btn-sm btn-success ob-qaytdi-btn" onclick="Books.returnBook('${b.id}')">↩ Qaytdi</button>`;
    } else if (b.status === 'unread') {
      statusActions = `
        <button class="btn btn-sm" style="background:var(--orange-light);color:var(--orange-dark);font-weight:700;border:none;cursor:pointer;border-radius:6px;padding:7px 12px;font-size:12px" onclick="Books.move('${b.id}','reading')">▶ Boshlash</button>
        <button class="btn btn-sm btn-ghost ob-lend-btn" onclick="Books.openLend('${b.id}')">📤 Berish</button>`;
    } else if (b.status === 'reading') {
      statusActions = `<button class="btn btn-sm btn-success" onclick="Books.move('${b.id}','read')">✓ O'qidim</button>`;
    } else if (b.status === 'read') {
      statusActions = `<button class="btn btn-sm btn-ghost ob-lend-btn" onclick="Books.openLend('${b.id}')">📤 Berish</button>`;
    }

    const lentInfo = b.lentTo
      ? `<div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--orange-dark);font-weight:700;background:var(--orange-light);padding:3px 9px;border-radius:20px;margin-top:6px">
           📤 ${escapeHtml(b.lentTo)} · ${fmtDate(b.lentDate)}
         </div>` : '';

    const metaParts = [
      b.readYear ? `📖 ${b.readYear}` : '',
      b.buyDate  ? `🛍 ${fmtDate(b.buyDate)}` : '',
    ].filter(Boolean);

    return `<div class="book-card">
      <div class="book-spine" style="background:${b.color || '#F58F20'}"></div>
      <div class="book-content">
        <div class="book-info">
          <div class="book-title">${escapeHtml(b.title)}</div>
          ${b.author ? `<div class="book-author">${escapeHtml(b.author)}</div>` : ''}
          ${metaParts.length ? `<div class="book-meta">${metaParts.map(p=>`<span>${p}</span>`).join('')}</div>` : ''}
          ${lentInfo}
          <div class="book-actions">${statusActions}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0">
          <button class="action-edit" onclick="Books.openEdit('${b.id}')">✎</button>
          <button class="action-del"  onclick="Books.del('${b.id}')">×</button>
        </div>
      </div>
    </div>`;
  }

  // ── BOOK FORM (shared for add & edit) ────────────────────────
  function bookForm(data = {}) {
    return `
      <div class="form-group">
        <label class="form-label">Kitob nomi *</label>
        <input class="form-input" id="bk_title" type="text" placeholder="Kitob nomi..." value="${data.title || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Muallif</label>
        <input class="form-input" id="bk_author" type="text" placeholder="Muallif ismi..." value="${data.author || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sotib olingan sana</label>
          <input class="form-input" id="bk_buyDate" type="date" value="${data.buyDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">O'qilgan yil</label>
          <input class="form-input" id="bk_readYear" type="number" placeholder="2024" min="1900" max="2100" value="${data.readYear || ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Holati</label>
        <select class="form-select" id="bk_status">
          <option value="unread"  ${(data.status||'unread')==='unread'  ?'selected':''}>Yangi (o'qilmagan)</option>
          <option value="reading" ${data.status==='reading'?'selected':''}>O'qilmoqda</option>
          <option value="read"    ${data.status==='read' || data.status==='lent' ?'selected':''}>O'qilgan</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Kitob rangi</label>
        <div class="color-picker">
          ${COLORS.map(c => `
            <div class="color-dot ${(data.color||COLORS[0])===c?'selected':''}"
              style="background:${c};border-color:${(data.color||COLORS[0])===c?'var(--dark)':'var(--border)'}"
              data-color="${c}" onclick="Books.selectColor(this)"></div>
          `).join('')}
        </div>
      </div>`;
  }

  function setTab(tab) { activeTab = tab; App.renderPage('books'); }
  function setSort(order) { sortOrder = order; App.renderPage('books'); }

  function openAdd() {
    openModal("Kitob qo'shish",
      bookForm() +
      `<button class="btn btn-primary btn-full" style="margin-top:6px" onclick="Books.save('')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('bk_title')?.focus(), 320);
  }

  function openEdit(id) {
    const b = DB.getBooks().find(x => x.id === id);
    if (!b) return;
    openModal("Kitobni tahrirlash",
      bookForm(b) +
      `<button class="btn btn-primary btn-full" style="margin-top:6px" onclick="Books.save('${id}')">Saqlash</button>`
    );
    setTimeout(() => document.getElementById('bk_title')?.focus(), 320);
  }

  function selectColor(el) {
    document.querySelectorAll('.color-dot').forEach(d => { d.classList.remove('selected'); d.style.borderColor = 'var(--border)'; });
    el.classList.add('selected'); el.style.borderColor = 'var(--dark)';
  }

  function save(id) {
    const title = document.getElementById('bk_title').value.trim();
    if (!title) { App.Toast('Kitob nomini kiriting'); return; }
    const colorEl = document.querySelector('.color-dot.selected');
    const color   = colorEl ? colorEl.dataset.color : COLORS[0];
    const fields  = {
      title, color,
      author:   document.getElementById('bk_author').value.trim(),
      buyDate:  document.getElementById('bk_buyDate').value,
      readYear: document.getElementById('bk_readYear').value,
      status:   document.getElementById('bk_status').value,
    };
    const books = DB.getBooks();
    if (id) {
      const b = books.find(x => x.id === id);
      if (b) Object.assign(b, fields);
    } else {
      books.push({ id: uid(), ...fields });
    }
    DB.saveBooks(books);
    closeModal();
    App.renderPage('books');
  }

  function move(id, newStatus) {
    const books = DB.getBooks();
    const b = books.find(x => x.id === id);
    if (b) b.status = newStatus;
    DB.saveBooks(books);
    App.renderPage('books');
  }

  function openLend(id) {
    openModal('Kitobni berish', `
      <div class="form-group">
        <label class="form-label">Kimga berildi?</label>
        <input class="form-input" id="lend_to" type="text" placeholder="Ism...">
      </div>
      <div class="form-group">
        <label class="form-label">Sana</label>
        <input class="form-input" id="lend_date" type="date" value="${todayStr()}">
      </div>
      <button class="btn btn-primary btn-full" onclick="Books.lend('${id}')">Tasdiqlash</button>
    `);
    setTimeout(() => document.getElementById('lend_to')?.focus(), 320);
  }

  function lend(id) {
    const to = document.getElementById('lend_to').value.trim();
    if (!to) { App.Toast('Ismni kiriting'); return; }
    const books = DB.getBooks();
    const b = books.find(x => x.id === id);
    if (b) { b.lentTo = to; b.lentDate = document.getElementById('lend_date').value || todayStr(); }
    DB.saveBooks(books);
    closeModal();
    App.renderPage('books');
  }

  function returnBook(id) {
    const books = DB.getBooks();
    const b = books.find(x => x.id === id);
    if (b) {
      if (b.status === 'lent') b.status = 'read'; // eski ma'lumotlarni migratsiya qilish
      b.lentTo   = null;
      b.lentDate = null;
    }
    DB.saveBooks(books);
    App.renderPage('books');
  }

  function del(id) {
    App.Confirm("O'chirishni tasdiqlaysizmi?", () => {
      DB.saveBooks(DB.getBooks().filter(b => b.id !== id));
      App.renderPage('books');
    });
  }

  return { render, setTab, setSort, openAdd, openEdit, selectColor, save, move, openLend, lend, returnBook, del };
})();
