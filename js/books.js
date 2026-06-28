const Books = (() => {
  const COLORS = ['#F58F20','#467434','#363636','#3B82F6','#8B5CF6','#EC4899','#EF4444','#06B6D4','#64748B'];
  let activeTab = 'unread';

  function render() {
    const books = DB.getBooks();
    const tabs  = { unread: 'Yangi', reading: "O'qilmoqda", read: "O'qilgan", lent: 'Berilgan' };
    const filtered = books.filter(b => b.status === activeTab);
    const msgs = {
      unread:  "Yangi kitob qo'shing",
      reading: "Hozir kitob o'qilmayapti",
      read:    "Hali kitob o'qib bo'linmagan",
      lent:    "Hech kimga kitob berilmagan",
    };

    const booksHtml = filtered.length === 0
      ? `<div class="empty-state"><span class="empty-icon">📚</span><p>${msgs[activeTab]}</p></div>`
      : filtered.map(b => bookCard(b)).join('');

    const counts = {
      unread:  books.filter(b => b.status === 'unread').length,
      reading: books.filter(b => b.status === 'reading').length,
      read:    books.filter(b => b.status === 'read').length,
      lent:    books.filter(b => b.status === 'lent').length,
    };

    const total = books.length;

    return `<div class="page-enter">
      <!-- Jami summary card -->
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
          { k:'unread',  label:'Yangi',         color:'var(--dark)' },
          { k:'reading', label:"O'qilmoqda",    color:'var(--orange)' },
          { k:'read',    label:"O'qilgan",       color:'var(--green)' },
          { k:'lent',    label:'Berilgan',       color:'#D94040' },
        ].map(s => `
          <div class="stat-card" style="padding:11px 10px;text-align:center;cursor:pointer;${activeTab===s.k?'border-top:3px solid '+s.color:''}" onclick="Books.setTab('${s.k}')">
            <div style="font-size:20px;font-weight:900;color:${s.color}">${counts[s.k]}</div>
            <div style="font-size:9px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.3px;margin-top:2px">${s.label}</div>
          </div>`).join('')}
      </div>

      <div class="tabs">
        ${Object.entries(tabs).map(([k, v]) => `
          <button class="tab-btn ${activeTab === k ? 'active' : ''}" onclick="Books.setTab('${k}')">${v}</button>
        `).join('')}
      </div>

      ${booksHtml}
    </div>`;
  }

  function bookCard(b) {
    let actions = '';
    if (b.status === 'unread') {
      actions = `<button class="btn btn-sm" style="background:var(--orange-light);color:var(--orange-dark);font-weight:700;border:none;cursor:pointer;border-radius:6px;padding:7px 12px;font-size:12px" onclick="Books.move('${b.id}','reading')">▶ Boshlash</button>`;
    } else if (b.status === 'reading') {
      actions = `
        <button class="btn btn-sm btn-success" onclick="Books.move('${b.id}','read')">✓ Tugatdim</button>
        <button class="btn btn-sm btn-ghost" onclick="Books.openLend('${b.id}')">📤 Ber</button>`;
    } else if (b.status === 'read') {
      actions = `<button class="btn btn-sm btn-ghost" onclick="Books.openLend('${b.id}')">📤 Berish</button>`;
    } else if (b.status === 'lent') {
      actions = `<button class="btn btn-sm btn-success" onclick="Books.move('${b.id}','read')">↩ Qaytdi</button>`;
    }

    const lentInfo = b.status === 'lent' && b.lentTo
      ? `<div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--orange-dark);font-weight:700;background:var(--orange-light);padding:3px 9px;border-radius:20px;margin-top:6px">
           📤 ${b.lentTo} · ${fmtDate(b.lentDate)}
         </div>`
      : '';

    const metaParts = [
      b.readYear ? `📖 ${b.readYear}` : '',
      b.buyDate  ? `🛍 ${fmtDate(b.buyDate)}` : '',
    ].filter(Boolean);

    return `<div class="book-card">
      <div class="book-spine" style="background:${b.color || '#F58F20'}"></div>
      <div class="book-content">
        <div class="book-info">
          <div class="book-title">${b.title}</div>
          ${b.author ? `<div class="book-author">${b.author}</div>` : ''}
          ${metaParts.length ? `<div class="book-meta">${metaParts.map(p=>`<span>${p}</span>`).join('')}</div>` : ''}
          ${lentInfo}
          <div class="book-actions">${actions}</div>
        </div>
        <button onclick="Books.del('${b.id}')" style="border:none;background:none;color:var(--text3);cursor:pointer;font-size:20px;padding:2px;align-self:flex-start;line-height:1">×</button>
      </div>
    </div>`;
  }

  function setTab(tab) { activeTab = tab; App.renderPage('books'); }

  function openAdd() {
    openModal("Kitob qo'shish", `
      <div class="form-group">
        <label class="form-label">Kitob nomi *</label>
        <input class="form-input" id="bk_title" type="text" placeholder="Kitob nomi...">
      </div>
      <div class="form-group">
        <label class="form-label">Muallif</label>
        <input class="form-input" id="bk_author" type="text" placeholder="Muallif ismi...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sotib olingan sana</label>
          <input class="form-input" id="bk_buyDate" type="date">
        </div>
        <div class="form-group">
          <label class="form-label">O'qilgan yil</label>
          <input class="form-input" id="bk_readYear" type="number" placeholder="2024" min="1900" max="2100">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Holati</label>
        <select class="form-select" id="bk_status">
          <option value="unread">Yangi (o'qilmagan)</option>
          <option value="reading">O'qilmoqda</option>
          <option value="read">O'qilgan</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Kitob rangi</label>
        <div class="color-picker" id="bk_colorPicker">
          ${COLORS.map((c, i) => `
            <div class="color-dot ${i===0?'selected':''}" style="background:${c}" data-color="${c}" onclick="Books.selectColor(this)"></div>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-full" style="margin-top:6px" onclick="Books.save()">Saqlash</button>
    `);
    setTimeout(() => document.getElementById('bk_title')?.focus(), 320);
  }

  function selectColor(el) {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
  }

  function save() {
    const title = document.getElementById('bk_title').value.trim();
    if (!title) { alert('Kitob nomini kiriting'); return; }
    const colorEl = document.querySelector('.color-dot.selected');
    const books = DB.getBooks();
    books.push({
      id: uid(), title,
      author:   document.getElementById('bk_author').value.trim(),
      buyDate:  document.getElementById('bk_buyDate').value,
      readYear: document.getElementById('bk_readYear').value,
      status:   document.getElementById('bk_status').value,
      color:    colorEl ? colorEl.dataset.color : COLORS[0],
    });
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
    if (!to) { alert('Ismni kiriting'); return; }
    const date  = document.getElementById('lend_date').value || todayStr();
    const books = DB.getBooks();
    const b = books.find(x => x.id === id);
    if (b) { b.status = 'lent'; b.lentTo = to; b.lentDate = date; }
    DB.saveBooks(books);
    closeModal();
    App.renderPage('books');
  }

  function del(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    DB.saveBooks(DB.getBooks().filter(b => b.id !== id));
    App.renderPage('books');
  }

  return { render, setTab, openAdd, selectColor, save, move, openLend, lend, del };
})();
