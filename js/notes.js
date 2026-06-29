const Notes = (() => {
  const BG_COLORS = ['#FFFFFF','#FEF3E4','#EBF2E7','#EEF4FF','#FFF0F8','#F3F0FF','#FFFBEA'];

  function render() {
    const notes = DB.getNotes().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const list = notes.length === 0
      ? `<div class="empty-state"><span class="empty-icon">📝</span><p>Hali eslatma yo'q</p></div>`
      : notes.map(n => `
          <div class="note-card" style="background:${n.color || '#fff'}" onclick="Notes.openEdit('${n.id}')">
            ${n.title ? `<div class="note-title">${escapeHtml(n.title)}</div>` : ''}
            ${n.body  ? `<div class="note-body">${escapeHtml(n.body).slice(0, 150)}${n.body.length > 150 ? '…' : ''}</div>` : ''}
            <div class="note-date">${fmtDate(n.updatedAt)}</div>
          </div>`).join('');

    return `<div class="page-enter">${list}</div>`;
  }

  function openAdd() {
    openModal("Eslatma qo'shish", buildForm({}));
    setTimeout(() => document.getElementById('nt_title')?.focus(), 320);
  }

  function openEdit(id) {
    const n = DB.getNotes().find(x => x.id === id);
    if (!n) return;
    openModal('Eslatmani tahrirlash', buildForm(n) +
      `<button class="btn btn-danger btn-full" style="margin-top:8px" onclick="Notes.del('${id}')">O'chirish</button>`);
  }

  function buildForm(n) {
    return `
      <div class="form-group">
        <label class="form-label">Sarlavha</label>
        <input class="form-input" id="nt_title" type="text" placeholder="Sarlavha..." value="${n.title || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Matn</label>
        <textarea class="form-textarea" id="nt_body" placeholder="Fikringizni yozing...">${n.body || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Fon rangi</label>
        <div class="color-picker">
          ${BG_COLORS.map(c => {
            const selected = (n.color || '#FFFFFF') === c;
            return `<div class="color-dot ${selected?'selected':''}"
              style="background:${c};border-color:${selected?'var(--dark)':'var(--border)'}"
              data-color="${c}" onclick="Notes.pickColor(this)"></div>`;
          }).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-full" style="margin-top:4px" onclick="Notes.save('${n.id || ''}')">Saqlash</button>`;
  }

  function pickColor(el) {
    document.querySelectorAll('.color-dot').forEach(d => { d.classList.remove('selected'); d.style.borderColor = 'var(--border)'; });
    el.classList.add('selected');
    el.style.borderColor = 'var(--dark)';
  }

  function save(id) {
    const title = document.getElementById('nt_title').value.trim();
    const body  = document.getElementById('nt_body').value.trim();
    if (!title && !body) { App.Toast('Sarlavha yoki matn kiriting'); return; }
    const colorEl = document.querySelector('.color-dot.selected');
    const color   = colorEl ? colorEl.dataset.color : '#FFFFFF';
    const notes   = DB.getNotes();
    if (id) {
      const n = notes.find(x => x.id === id);
      if (n) { n.title = title; n.body = body; n.color = color; n.updatedAt = new Date().toISOString(); }
    } else {
      notes.push({ id: uid(), title, body, color, updatedAt: new Date().toISOString() });
    }
    DB.saveNotes(notes);
    closeModal();
    App.renderPage('notes');
  }

  function del(id) {
    App.Confirm("O'chirishni tasdiqlaysizmi?", () => {
      DB.saveNotes(DB.getNotes().filter(n => n.id !== id));
      closeModal();
      App.renderPage('notes');
    });
  }

  return { render, openAdd, openEdit, pickColor, save, del };
})();
