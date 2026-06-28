const SUPABASE_URL = 'https://ynkrzsftxbhqghgnpezt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lmZjQ3IHCa6506L2tqfmCQ_KyPkToeO';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Auth = (() => {
  let currentUser = null;
  let currentFlow = 'login'; // 'login' | 'signup' | 'recovery' | 'otp' | 'new_password'
  let tempEmail = '';
  let otpType = ''; // 'signup' | 'recovery'

  async function init() {
    const { data: { session } } = await sb.auth.getSession();
    
    if (session) {
      currentUser = session.user;
      await DB.initCloud(); // DB ni cloud dan yuklash
      showApp();
    } else {
      showAuthUI();
    }

    sb.auth.onAuthStateChange(async (event, session) => {
      // Agar parol tiklash jarayonida bo'lsak, avtomat kirib ketishni to'xtatamiz
      if (event === 'PASSWORD_RECOVERY' || (session && currentFlow === 'new_password')) {
        return;
      }

      if (session) {
        currentUser = session.user;
        await DB.initCloud();
        showApp();
      } else {
        currentUser = null;
        if (currentFlow === 'new_password') currentFlow = 'login';
        showAuthUI();
      }
    });
  }

  function showApp() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('app');
    
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    if (typeof App !== 'undefined' && typeof App.init === 'function' && !window.appInitialized) {
        App.init();
        window.appInitialized = true;
    }
    // Agar dastur allaqachon ishlab turgan bo'lsa va qayta kirilsa, dashboard ni render qilamiz
    if (window.appInitialized) {
        App.renderPage('dashboard');
    }
  }

  function showAuthUI() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('app');
    
    if (authContainer) {
      authContainer.style.display = 'flex';
      renderAuthUI();
    }
    if (appContainer) appContainer.style.display = 'none';
  }

  const EYE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const EYE_OFF_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  function togglePassword(btn) {
    const input = btn.previousElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = EYE_OFF_ICON;
    } else {
      input.type = 'password';
      btn.innerHTML = EYE_ICON;
    }
  }

  function setFlow(flow) {
    currentFlow = flow;
    renderAuthUI();
  }

  function renderAuthUI() {
    const container = document.getElementById('authContainer');
    if (!container) return;

    let inner = '';

    if (currentFlow === 'login') {
      inner = `
        <div class="auth-icon">🔒</div>
        <h2 class="auth-title">Xush kelibsiz</h2>
        <p class="auth-sub">Tizimga kirish uchun ma'lumotlarni kiriting</p>
        
        <input type="email" id="authEmail" class="auth-input" placeholder="Elektron pochta" value="${tempEmail}">
        <div style="position:relative">
          <input type="password" id="authPassword" class="auth-input" placeholder="Parol" style="padding-right:45px">
          <button type="button" onclick="Auth.togglePassword(this)" style="position:absolute; right:12px; top:12px; background:none; border:none; cursor:pointer; font-size:18px; color:var(--text2); padding:0; display:flex; align-items:center; -webkit-tap-highlight-color:transparent">${EYE_ICON}</button>
        </div>
        
        <div id="authError" class="auth-error"></div>
        
        <button class="auth-btn" id="loginBtn" onclick="Auth.login()">Kirish</button>
        
        <div style="display:flex; justify-content:space-between; margin-top:20px; font-size:13px; font-weight:700">
          <span style="color:var(--text2);cursor:pointer;transition:color 0.2s" onclick="Auth.setFlow('recovery')" onmouseover="this.style.color='var(--orange)'" onmouseout="this.style.color='var(--text2)'">Parolni unutdim</span>
          <span style="color:var(--orange);cursor:pointer" onclick="Auth.setFlow('signup')">Ro'yxatdan o'tish</span>
        </div>
      `;
    } 
    else if (currentFlow === 'signup') {
      inner = `
        <div class="auth-icon">✨</div>
        <h2 class="auth-title">Yangi hisob</h2>
        <p class="auth-sub">Tartibla ilovasiga ro'yxatdan o'ting</p>
        
        <input type="email" id="authEmail" class="auth-input" placeholder="Elektron pochta" value="${tempEmail}">
        <div style="position:relative">
          <input type="password" id="authPassword" class="auth-input" placeholder="Yangi parol o'rnating (min 6 harf)" style="padding-right:45px">
          <button type="button" onclick="Auth.togglePassword(this)" style="position:absolute; right:12px; top:12px; background:none; border:none; cursor:pointer; font-size:18px; color:var(--text2); padding:0; display:flex; align-items:center; -webkit-tap-highlight-color:transparent">${EYE_ICON}</button>
        </div>
        
        <div id="authError" class="auth-error"></div>
        
        <button class="auth-btn" id="signupBtn" onclick="Auth.signup()">Ro'yxatdan o'tish</button>
        
        <div style="text-align:center; margin-top:20px; font-size:13px; font-weight:700">
          <span style="color:var(--text2);cursor:pointer" onclick="Auth.setFlow('login')">← Ortga (Kirish)</span>
        </div>
      `;
    }
    else if (currentFlow === 'recovery') {
      inner = `
        <div class="auth-icon">🔑</div>
        <h2 class="auth-title">Parolni tiklash</h2>
        <p class="auth-sub">Pochtangizni kiriting, biz tasdiqlash kodini yuboramiz</p>
        
        <input type="email" id="authEmail" class="auth-input" placeholder="Elektron pochta" value="${tempEmail}">
        <div id="authError" class="auth-error"></div>
        
        <button class="auth-btn" id="recoveryBtn" onclick="Auth.recoverPassword()">Kod yuborish</button>
        
        <div style="text-align:center; margin-top:20px; font-size:13px; font-weight:700">
          <span style="color:var(--text2);cursor:pointer" onclick="Auth.setFlow('login')">← Ortga bekor qilish</span>
        </div>
      `;
    }
    else if (currentFlow === 'otp') {
      inner = `
        <div class="auth-icon">✉️</div>
        <h2 class="auth-title">Tasdiqlash kodi</h2>
        <p class="auth-sub"><b>${tempEmail}</b> manziliga yuborilgan 6 xonali kodni kiriting</p>
        
        <div class="otp-inputs" style="display:flex; gap:8px; justify-content:center; margin-bottom:15px">
          ${[1,2,3,4,5,6].map(i => `<input type="text" class="auth-input" style="width:45px;text-align:center;font-size:22px;padding:10px 0" maxlength="1" id="otp${i}" onkeyup="Auth.moveOtpFocus(this, ${i})">`).join('')}
        </div>
        
        <div id="authError" class="auth-error"></div>
        
        <button class="auth-btn" id="otpBtn" onclick="Auth.verifyOtp()">Tasdiqlash</button>
        
        <div style="text-align:center; margin-top:20px; font-size:13px; font-weight:700">
          <span style="color:var(--text2);cursor:pointer" onclick="Auth.setFlow('login')">← Boshiga qaytish</span>
        </div>
      `;
    }
    else if (currentFlow === 'new_password') {
      inner = `
        <div class="auth-icon">🛡️</div>
        <h2 class="auth-title">Yangi parol</h2>
        <p class="auth-sub">Iltimos, yangi va xavfsiz parol o'rnating</p>
        
        <div style="position:relative">
          <input type="password" id="authNewPassword" class="auth-input" placeholder="Yangi parol (min 6 belgi)" style="padding-right:45px">
          <button type="button" onclick="Auth.togglePassword(this)" style="position:absolute; right:12px; top:12px; background:none; border:none; cursor:pointer; font-size:18px; color:var(--text2); padding:0; display:flex; align-items:center; -webkit-tap-highlight-color:transparent">${EYE_ICON}</button>
        </div>
        <div id="authError" class="auth-error"></div>
        
        <button class="auth-btn" id="newPassBtn" onclick="Auth.setNewPassword()">Saqlash va Kirish</button>
      `;
    }

    container.innerHTML = `<div class="auth-card">${inner}</div>`;

    // Focus set
    setTimeout(() => {
      const emailInput = document.getElementById('authEmail');
      if (emailInput && !emailInput.value) emailInput.focus();
      else if (currentFlow === 'otp') document.getElementById('otp1')?.focus();
    }, 100);
  }

  function moveOtpFocus(el, idx) {
    if (el.value.length === 1 && idx < 6) {
      document.getElementById('otp' + (idx + 1)).focus();
    }
    if (el.value.length === 0 && idx > 1) {
      document.getElementById('otp' + (idx - 1)).focus();
    }
  }

  function showError(msg) {
    const err = document.getElementById('authError');
    if (err) err.textContent = msg;
  }

  // --- ACTIONS ---

  async function login() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { showError("Pochta va parolni kiriting"); return; }
    
    showError("Tekshirilmoqda...");
    document.getElementById('loginBtn').disabled = true;

    const { error } = await sb.auth.signInWithPassword({ email, password });
    
    if (error) {
      document.getElementById('loginBtn').disabled = false;
      showError(error.message === 'Invalid login credentials' ? "Email yoki parol noto'g'ri" : error.message);
    }
  }

  async function signup() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { showError("Barcha maydonlarni to'ldiring"); return; }
    if (password.length < 6) { showError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    
    showError("Yuborilmoqda...");
    document.getElementById('signupBtn').disabled = true;

    const { data, error } = await sb.auth.signUp({ email, password });
    
    document.getElementById('signupBtn').disabled = false;
    
    if (error) {
      showError(error.message);
    } else {
      if (data.session) {
        // Tizimda "Confirm Email" o'chirilgan bo'lsa, to'g'ridan to'g'ri kiradi
        currentUser = data.session.user;
        await DB.initCloud();
        showApp();
      } else {
        tempEmail = email;
        otpType = 'signup';
        setFlow('otp');
      }
    }
  }

  async function recoverPassword() {
    const email = document.getElementById('authEmail').value.trim();
    if (!email) { showError("Pochtani kiriting"); return; }
    
    showError("Yuborilmoqda...");
    document.getElementById('recoveryBtn').disabled = true;

    const { error } = await sb.auth.resetPasswordForEmail(email);
    
    document.getElementById('recoveryBtn').disabled = false;
    
    if (error) {
      showError(error.message);
    } else {
      tempEmail = email;
      otpType = 'recovery';
      setFlow('otp');
    }
  }

  async function verifyOtp() {
    let token = '';
    for (let i = 1; i <= 6; i++) {
      token += document.getElementById('otp' + i).value;
    }
    if (token.length !== 6) { showError("Kodni to'liq kiriting"); return; }

    showError("Tasdiqlanmoqda...");
    document.getElementById('otpBtn').disabled = true;

    const { data, error } = await sb.auth.verifyOtp({ email: tempEmail, token, type: otpType });
    
    if (error) {
      document.getElementById('otpBtn').disabled = false;
      showError("Kod xato yoki eskirgan");
    } else {
      if (otpType === 'recovery') {
        // Recovery tasdiqlangach, yangi parol o'rnatish sahifasiga o'tamiz
        setFlow('new_password');
      } else {
        // Signup tasdiqlangach o'zi kirib ketadi (onAuthStateChange ishladi)
      }
    }
  }

  async function setNewPassword() {
    const password = document.getElementById('authNewPassword').value;
    if (password.length < 6) { showError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }

    showError("Saqlanmoqda...");
    document.getElementById('newPassBtn').disabled = true;

    const { error } = await sb.auth.updateUser({ password });
    
    document.getElementById('newPassBtn').disabled = false;
    
    if (error) {
      showError(error.message);
    } else {
      // Parol yangilandi, u endi tizimda.
      showApp();
    }
  }

  async function logout() {
    await sb.auth.signOut();
  }

  return { init, togglePassword, setFlow, moveOtpFocus, login, signup, recoverPassword, verifyOtp, setNewPassword, logout };
})();

// Start Auth
Auth.init();
