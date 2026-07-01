const Books = (() => {
  const COLORS = ['#F58F20','#467434','#363636','#3B82F6','#8B5CF6','#EC4899','#EF4444','#06B6D4','#64748B'];

  const TYPES = {
    physical: { label: "Qog'oz",   icon: '📖', color: '#467434',  bg: 'rgba(70,116,52,.12)'   },
    audio:    { label: 'Audio',    icon: '🎧', color: '#06B6D4',  bg: 'rgba(6,182,212,.12)'   },
    ebook:    { label: 'Elektron', icon: '💻', color: '#8B5CF6',  bg: 'rgba(139,92,246,.12)'  },
  };

  let activeTab  = 'unread';
  let typeFilter = 'all'; // 'all' | 'physical' | 'audio' | 'ebook'
  let sortOrder  = 'desc';

  function bookType(b) { return b.type || 'physical'; }

  // ── RENDER ────────────────────────────────────────────────────
  function render() {
    const books = DB.getBooks();

    // Per-type totals (umumiy)
    const pBooks = books.filter(b => bookType(b) === 'physical');
    const aBooks = books.filter(b => bookType(b) === 'audio');
    const eBooks = books.filter(b => bookType(b) === 'ebook');

    // Books filtered by selected type
    const canLend  = typeFilter === 'all' || typeFilter === 'physical';
    const typePool = typeFilter === 'all' ? books : books.filter(b => bookType(b) === typeFilter);

    // If we're on lent tab but switched to audio/ebook, reset
    if (!canLend && activeTab === 'lent') activeTab = 'all';

    // Status tabs based on type
    const tabs = {
      all:     'Jami',
      unread:  'Yangi',
      reading: "O'qilmoqda",
      read:    "O'qilgan",
      ...(canLend ? { lent: 'Berilgan' } : {}),
    };

    // Filter within typePool by activeTab
    let filtered;
    if (activeTab === 'all') {
      filtered = [...typePool].sort((a, b) => {
        const da = a.buyDate ? new Date(a.buyDate) : new Date(0);
        const db = b.buyDate ? new Date(b.buyDate) : new Date(0);
        return sortOrder === 'desc' ? db - da : da - db;
      });
    } else if (activeTab === 'lent') {
      filtered = typePool.filter(b => b.lentTo || b.status === 'lent');
    } else if (activeTab === 'read') {
      filtered = typePool.filter(b => b.status === 'read' || (canLend && b.status === 'lent'));
    } else {
      filtered = typePool.filter(b => b.status === activeTab);
    }

    // Status counts within current typePool
    const counts = {
      unread:  typePool.filter(b => b.status === 'unread').length,
      reading: typePool.filter(b => b.status === 'reading').length,
      read:    typePool.filter(b => b.status === 'read' || (canLend && b.status === 'lent')).length,
      lent:    typePool.filter(b => b.lentTo || b.status === 'lent').length,
    };

    const empty = {
      all:     "Hali birorta kitob qo'shilmagan",
      unread:  "Yangi kitob qo'shing",
      reading: "Hozir kitob o'qilmayapti",
      read:    "Hali kitob o'qib bo'linmagan",
      lent:    "Hech kimga kitob berilmagan",
    };

    const sortBar = activeTab === 'all' ? `
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
        <span style="font-size:11px;font-weight:700;color:var(--text2);margin-right:2px">Saralash:</span>
        <button onclick="Books.setSort('desc')" class="btn btn-sm" style="font-size:11px;padding:4px 11px;font-weight:700;${sortOrder==='desc'?'background:var(--orange);color:#fff;border-color:var(--orange)':'background:var(--surface2);color:var(--text2);border-color:var(--border)'}">↓ Yangi</button>
        <button onclick="Books.setSort('asc')"  class="btn btn-sm" style="font-size:11px;padding:4px 11px;font-weight:700;${sortOrder==='asc' ?'background:var(--orange);color:#fff;border-color:var(--orange)':'background:var(--surface2);color:var(--text2);border-color:var(--border)'}">↑ Eski</button>
      </div>` : '';

    const booksHtml = filtered.length === 0
      ? `<div class="empty-state"><span class="empty-icon">📚</span><p>${empty[activeTab]}</p></div>`
      : filtered.map(b => bookCard(b)).join('');

    // Status stat grid
    const statusCards = [
      { k: 'unread',  label: 'Yangi',      color: 'var(--dark)'   },
      { k: 'reading', label: "O'qilmoqda", color: 'var(--orange)' },
      { k: 'read',    label: "O'qilgan",   color: 'var(--green)'  },
      ...(canLend ? [{ k: 'lent', label: 'Berilgan', color: '#D94040' }] : []),
    ];

    return `<div class="page-enter">

      <!-- ── Header ── -->
      <div class="book-header-card">
        <div>
          <div class="book-header-label">Jami kutubxona</div>
          <div class="book-header-total">${books.length} <span class="book-header-unit">ta kitob</span></div>
        </div>
        <div class="book-header-types">
          <div class="book-type-pill" style="color:${TYPES.physical.color};background:${TYPES.physical.bg}">
            ${TYPES.physical.icon} <b>${pBooks.length}</b> qog'oz
          </div>
          <div class="book-type-pill" style="color:${TYPES.audio.color};background:${TYPES.audio.bg}">
            ${TYPES.audio.icon} <b>${aBooks.length}</b> audio
          </div>
          <div class="book-type-pill" style="color:${TYPES.ebook.color};background:${TYPES.ebook.bg}">
            ${TYPES.ebook.icon} <b>${eBooks.length}</b> elektron
          </div>
        </div>
      </div>

      <!-- ── Type filter ── -->
      <div class="book-type-filter">
        ${[
          { k: 'all',      icon: '📚', label: 'Hammasi' },
          { k: 'physical', icon: '📖', label: "Qog'oz"  },
          { k: 'audio',    icon: '🎧', label: 'Audio'   },
          { k: 'ebook',    icon: '💻', label: 'Elektron'},
        ].map(t => `
          <button onclick="Books.setType('${t.k}')" class="book-type-btn${typeFilter===t.k?' active':''}">
            ${t.icon} ${t.label}
          </button>`).join('')}
      </div>

      <!-- ── Status counts ── -->
      <div class="stat-grid" style="grid-template-columns:repeat(${statusCards.length},1fr);margin-bottom:14px">
        ${statusCards.map(s => `
          <div class="stat-card" style="padding:11px 10px;text-align:center;cursor:pointer;${activeTab===s.k?'border-top:3px solid '+s.color:''}" onclick="Books.setTab('${s.k}')">
            <div style="font-size:20px;font-weight:900;color:${s.color}">${counts[s.k]}</div>
            <div style="font-size:9px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.3px;margin-top:2px">${s.label}</div>
          </div>`).join('')}
      </div>

      <!-- ── Status tabs ── -->
      <div class="tabs" style="overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch">
        ${Object.entries(tabs).map(([k, v]) =>
          `<button class="tab-btn ${activeTab===k?'active':''}" style="white-space:nowrap;flex-shrink:0" onclick="Books.setTab('${k}')">${v}</button>`
        ).join('')}
      </div>

      ${sortBar}
      ${booksHtml}
    </div>`;
  }

  // ── BOOK CARD ─────────────────────────────────────────────────
  function bookCard(b) {
    const type   = bookType(b);
    const isLent = !!(b.lentTo || b.status === 'lent');

    let statusActions = '';
    if (isLent && type === 'physical') {
      statusActions = `<button class="btn btn-sm btn-success ob-qaytdi-btn" onclick="Books.returnBook('${b.id}')">↩ Qaytdi</button>`;
    } else if (b.status === 'unread') {
      const startLabel = type === 'audio' ? '▶ Tinglash' : '▶ Boshlash';
      statusActions = `<button class="btn btn-sm" style="background:var(--orange-light);color:var(--orange-dark);font-weight:700;border:none;cursor:pointer;border-radius:6px;padding:7px 12px;font-size:12px" onclick="Books.move('${b.id}','reading')">${startLabel}</button>
        ${type === 'physical' ? `<button class="btn btn-sm btn-ghost ob-lend-btn" onclick="Books.openLend('${b.id}')">📤 Berish</button>` : ''}`;
    } else if (b.status === 'reading') {
      const doneLabel = type === 'audio' ? '✓ Tingladim' : '✓ O\'qidim';
      statusActions = `<button class="btn btn-sm btn-success" onclick="Books.move('${b.id}','read')">${doneLabel}</button>`;
    } else if (b.status === 'read' && type === 'physical') {
      statusActions = `<button class="btn btn-sm btn-ghost ob-lend-btn" onclick="Books.openLend('${b.id}')">📤 Berish</button>`;
    }

    const lentInfo = b.lentTo
      ? `<div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--orange-dark);font-weight:700;background:var(--orange-light);padding:3px 9px;border-radius:20px;margin-top:6px">
           📤 ${escapeHtml(b.lentTo)} · ${fmtDate(b.lentDate)}
         </div>` : '';

    const typeBadge = type !== 'physical'
      ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;font-weight:800;color:${TYPES[type].color};background:${TYPES[type].bg};padding:2px 8px;border-radius:20px;margin-top:4px">${TYPES[type].icon} ${TYPES[type].label}</span>`
      : '';

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
          ${typeBadge}
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

  // ── BOOK FORM ─────────────────────────────────────────────────
  function bookForm(data = {}) {
    const type = data.type || 'physical';
    return `
      <div class="form-group">
        <label class="form-label">Kitob turi</label>
        ${CSelect.html('bk_type', [
          { value: 'physical', label: "📖 Qog'oz kitob"  },
          { value: 'audio',    label: '🎧 Audio kitob'    },
          { value: 'ebook',    label: '💻 Elektron kitob' },
        ], type, 'Books.onTypeChange')}
      </div>
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
        ${CSelect.html('bk_status', [
          { value: 'unread',  label: "Yangi (o'qilmagan)" },
          { value: 'reading', label: "O'qilmoqda"          },
          { value: 'read',    label: "O'qilgan"            },
        ], (data.status === 'lent' ? 'read' : data.status) || 'unread')}
      </div>
      <div class="form-group" id="bk_color_wrap" style="${type!=='physical'&&type!=='ebook'?'display:none':''}">
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

  function onTypeChange(val) {
    const colorWrap = document.getElementById('bk_color_wrap');
    if (colorWrap) colorWrap.style.display = val === 'audio' ? 'none' : '';
  }

  // ── ACTIONS ───────────────────────────────────────────────────
  function setTab(tab)   { activeTab  = tab;   App.renderPage('books'); }
  function setSort(order){ sortOrder  = order;  App.renderPage('books'); }
  function setType(type) { typeFilter = type;   App.renderPage('books'); }

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
    const type    = CSelect.getValue('bk_type');
    const colorEl = document.querySelector('.color-dot.selected');
    const color   = colorEl ? colorEl.dataset.color : COLORS[0];
    const fields  = {
      title, color, type,
      author:   document.getElementById('bk_author').value.trim(),
      buyDate:  document.getElementById('bk_buyDate').value,
      readYear: document.getElementById('bk_readYear').value,
      status:   CSelect.getValue('bk_status'),
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
      if (b.status === 'lent') b.status = 'read';
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

  return { render, setTab, setSort, setType, onTypeChange, openAdd, openEdit, selectColor, save, move, openLend, lend, returnBook, del };
})();
