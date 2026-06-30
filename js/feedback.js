const Feedback = (() => {
  const TG_TOKEN   = '8882771749:AAHxNiPH3Przt8NIv_rL3vVIRzyMqQRrRMU';
  const TG_CHAT_ID = '1771891844';

  // ── RENDER ────────────────────────────────────────────────────
  async function render() {
    const items = await loadMine();
    const hasNew = items.some(f => f.admin_reply && !seenReply(f.id));

    const listHtml = items.length === 0
      ? `<div class="empty-state" style="padding:28px 0">
           <span class="empty-icon">💬</span>
           <p>Hali muammo yoki taklif yubormagansiz</p>
         </div>`
      : items.map(fCard).join('');

    return `<div class="page-enter">

      <!-- New feedback form -->
      <div class="card" style="margin-bottom:14px">
        <div class="section-head" style="padding:0 0 10px"><h2>Muammo yoki taklif</h2></div>
        <div class="form-group">
          <label class="form-label">Xabaringiz</label>
          <textarea class="form-input" id="fbMsg" rows="4"
            placeholder="Muammo, taklif yoki savol yozing..."
            style="resize:none;font-size:14px;line-height:1.55"></textarea>
        </div>
        <button class="btn btn-primary btn-full" id="fbSendBtn" onclick="Feedback.send()">
          📨 Yuborish
        </button>
      </div>

      <!-- Past feedbacks -->
      ${items.length > 0 ? `
        <div class="section-head"><h2>Yuborilganlar</h2></div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:8px">
          ${listHtml}
        </div>` : listHtml}

    </div>`;
  }

  function fCard(f) {
    const date    = new Date(f.created_at).toLocaleDateString('uz-UZ', { day:'numeric', month:'short' });
    const hasReply= !!f.admin_reply;
    const isNew   = hasReply && !seenReply(f.id);

    return `<div class="fb-card${isNew ? ' fb-card-new' : ''}" onclick="Feedback.markSeen('${f.id}');this.classList.remove('fb-card-new')">
      <div class="fb-card-top">
        <span class="fb-date">${date}</span>
        ${hasReply
          ? `<span class="fb-badge reply${isNew ? ' new' : ''}">
               ${isNew ? '🔔 Yangi javob' : '✓ Javob keldi'}
             </span>`
          : `<span class="fb-badge pending">⏳ Kutilmoqda</span>`}
      </div>
      <div class="fb-msg">${escapeHtml(f.message)}</div>
      ${hasReply ? `
        <div class="fb-reply">
          <div class="fb-reply-label">Admin javobi:</div>
          <div class="fb-reply-text">${escapeHtml(f.admin_reply)}</div>
        </div>` : ''}
    </div>`;
  }

  // ── SEND ──────────────────────────────────────────────────────
  async function send() {
    const msg = document.getElementById('fbMsg')?.value.trim();
    if (!msg) { App.Toast('Xabar matnini kiriting'); return; }
    if (msg.length < 5) { App.Toast('Xabar juda qisqa'); return; }

    const btn = document.getElementById('fbSendBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Yuborilmoqda...'; }

    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { App.Toast('Iltimos avval tizimga kiring', 'error'); return; }

      // Supabase ga saqlash
      const { error } = await sb.from('feedback').insert({
        user_id:    user.id,
        user_email: user.email,
        message:    msg,
      });
      if (error) throw error;

      // Telegram ga xabar
      await sendTelegram(user.email, msg);

      App.Toast('Xabaringiz yuborildi! Tez orada javob beramiz ✅', 'success');
      document.getElementById('fbMsg').value = '';
      // Ro'yxatni yangilash
      setTimeout(() => App.renderPage('feedback'), 600);

    } catch(e) {
      console.error('Feedback error:', e);
      App.Toast('Xatolik yuz berdi, qayta urinib ko\'ring', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '📨 Yuborish'; }
    }
  }

  // ── TELEGRAM ─────────────────────────────────────────────────
  async function sendTelegram(email, message) {
    const text =
      `📨 *Yangi muammo/taklif*\n\n` +
      `👤 Foydalanuvchi: ${email}\n\n` +
      `💬 Xabar:\n${message}\n\n` +
      `🔗 Javob berish: Supabase Studio → feedback jadvali → admin\\_reply ustuniga yozing`;

    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    TG_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    }).catch(() => {}); // Telegram fail bo'lsa ham feedback saqlanadi
  }

  // ── DATA ─────────────────────────────────────────────────────
  async function loadMine() {
    try {
      const { data, error } = await sb.from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch { return []; }
  }

  // ── SEEN TRACKING ─────────────────────────────────────────────
  function seenReply(id) {
    const seen = JSON.parse(localStorage.getItem('fb_seen') || '[]');
    return seen.includes(id);
  }

  function markSeen(id) {
    const seen = JSON.parse(localStorage.getItem('fb_seen') || '[]');
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem('fb_seen', JSON.stringify(seen));
    }
  }

  return { render, send, markSeen };
})();
