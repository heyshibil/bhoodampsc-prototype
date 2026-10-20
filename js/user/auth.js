/* User auth: phone -> OTP -> onboarding, plus the single-session "logged out" screen. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile } = BP.ui;
  const S = BP.store.session;
  const fmtPhone = (p) => '+91 ' + String(p).slice(0, 5) + ' ' + String(p).slice(5);

  /** Two-panel auth layout: brand story on desktop, just the form on phones. */
  function authLayout(inner) {
    return html`<div class="auth">
      <aside class="auth-brand" aria-hidden="true">
        <div class="auth-brand-inner">
          ${raw(BP.logo({ cls: 'logo--onbrand' }))}
          <div class="stack gap-4">
            <h2 class="auth-tagline">Practise Kerala PSC exams the way the real exam feels.</h2>
            <ul role="list" class="auth-points">
              <li>${icon('timer')}Timed tests with negative marking</li>
              <li>${icon('languages')}Every question in English and <span lang="ml">മലയാളം</span></li>
              <li>${icon('bell')}PSC notifications and daily current affairs</li>
            </ul>
          </div>
          <div class="auth-ghost">${raw(BP.logoMark())}</div>
        </div>
      </aside>
      <main class="auth-main" id="main">
        <div class="auth-card">
          <div class="auth-mobile-logo">${raw(BP.logo())}</div>
          ${inner}
        </div>
      </main>
    </div>`;
  }

  /* ---------- 1. Phone ---------- */
  BP.router.add('/user/login', {
    role: 'user', auth: false, guestOnly: true, chrome: 'none', title: 'Log in', rerender: false,
    render() {
      const prefill = BP.store.state.session.pendingPhone || '';
      return authLayout(html`<form class="stack gap-6" id="login-form" novalidate>
        <div class="stack gap-2">
          <h1 class="t-h1">Log in or sign up</h1>
          <p class="t-body t-muted">Enter your mobile number. We will send you a one-time password (OTP).</p>
        </div>
        <div class="field">
          <label class="field-label" for="phone">Mobile number</label>
          <div class="phone-field">
            <span class="phone-prefix">+91</span>
            <input id="phone" class="input" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="10-digit number" value="${prefill}" aria-describedby="phone-err" autofocus>
          </div>
          <span class="field-error" id="phone-err" hidden></span>
        </div>
        <button type="submit" class="btn btn--primary btn--lg btn--block">Get OTP${icon('arrow-right')}</button>
        <div class="notice notice--accent">${icon('info')}<span><b>Demo:</b> use <button type="button" class="inline-link" data-act="use-demo">98765 43210</button> to log in as Anjali, who has test history. Any other number creates a new account.</span></div>
      </form>`);
    },
    mount(root) {
      const form = root.querySelector('#login-form');
      const input = form.querySelector('#phone');
      const err = form.querySelector('#phone-err');
      input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 10); input.removeAttribute('aria-invalid'); err.hidden = true; });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!/^[6-9]\d{9}$/.test(input.value)) {
          input.setAttribute('aria-invalid', 'true');
          err.innerHTML = BP.icon('alert-circle') + 'Enter a valid 10-digit mobile number';
          err.hidden = false;
          input.focus();
          return;
        }
        BP.store.update((s) => { s.session.pendingPhone = input.value; }, { silent: true });
        BP.router.go('/user/otp');
      });
    },
    actions: {
      'use-demo'() { const i = document.getElementById('phone'); i.value = '9876543210'; i.focus(); },
    },
  });

  /* ---------- 2. OTP ---------- */
  let resendTimer = null;
  BP.router.add('/user/otp', {
    role: 'user', auth: false, guestOnly: true, chrome: 'none', title: 'Enter OTP', rerender: false,
    render() {
      const phone = BP.store.state.session.pendingPhone;
      if (!phone) return authLayout(html`<p class="t-body">Start again from the login screen.</p><a class="btn btn--primary" href="#/user/login">Go to log in</a>`);
      return authLayout(html`<form class="stack gap-6" id="otp-form" novalidate>
        <a class="link-btn self-start" href="#/user/login">${icon('arrow-left')}Change number</a>
        <div class="stack gap-2">
          <h1 class="t-h1">Enter the OTP</h1>
          <p class="t-body t-muted">We sent a one-time password to <b class="t-strong">${fmtPhone(phone)}</b>.</p>
        </div>
        <div class="field">
          <label class="field-label" for="otp">One-time password</label>
          <input id="otp" class="input otp-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-describedby="otp-help" autofocus>
          <span class="field-help" id="otp-help">Demo: enter any 4 or 6 digits.</span>
        </div>
        <button type="submit" class="btn btn--primary btn--lg btn--block" id="otp-verify" disabled>Verify and continue</button>
        <p class="t-body-sm t-muted t-center" id="otp-resend"></p>
      </form>`);
    },
    mount(root) {
      const form = root.querySelector('#otp-form');
      if (!form) return;
      const input = form.querySelector('#otp');
      const btn = form.querySelector('#otp-verify');
      const resend = form.querySelector('#otp-resend');
      const valid = () => /^(\d{4}|\d{6})$/.test(input.value);
      input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); btn.disabled = !valid(); });
      let left = 30;
      const tick = () => {
        if (left > 0) resend.textContent = 'Resend OTP in 0:' + String(left--).padStart(2, '0');
        else { clearInterval(resendTimer); resend.innerHTML = '<button type="button" class="inline-link" data-act="resend">Resend OTP</button>'; }
      };
      clearInterval(resendTimer); tick(); resendTimer = setInterval(tick, 1000);
      form.addEventListener('submit', (e) => { e.preventDefault(); if (valid()) verify(); });
    },
    unmount() { clearInterval(resendTimer); },
    actions: {
      resend() { BP.ui.toast('A new OTP has been sent (demo)', { type: 'success' }); BP.router.render(); },
    },
  });

  function verify() {
    const phone = BP.store.state.session.pendingPhone;
    let user = BP.store.get('users').find((u) => u.phone === phone);
    if (!user) {
      user = { id: BP.store.uid('u'), name: null, phone, district: null, qualification: null, isPremium: false, premiumSince: null, joinedAt: Date.now(), sessionToken: null };
      BP.store.update((s) => { s.users.push(user); }, { silent: true });
    }
    BP.store.update((s) => { s.session.pendingPhone = null; }, { silent: true });
    S.loginUser(user.id);
    if (user.name) BP.ui.toast('Welcome back, ' + user.name.split(' ')[0], { type: 'success' });
    BP.router.go(user.name ? '/user/home' : '/user/onboarding');
  }

  /* ---------- 3. Onboarding ---------- */
  BP.router.add('/user/onboarding', {
    role: 'user', onboarding: true, chrome: 'none', title: 'Your details', rerender: false,
    render(ctx) {
      if (ctx.user && ctx.user.name) { setTimeout(() => BP.router.go('/user/home', null, { replace: true })); return ''; }
      return authLayout(html`<form class="stack gap-6" id="onb-form" novalidate>
        <div class="stack gap-2">
          <span class="tag tag--primary self-start">Almost done</span>
          <h1 class="t-h1">Tell us about you</h1>
          <p class="t-body t-muted">Only your name is needed now. You can add the rest later from your profile.</p>
        </div>
        <div class="field">
          <label class="field-label" for="onb-name">Your name</label>
          <input id="onb-name" class="input" autocomplete="name" placeholder="Full name" aria-describedby="onb-name-err" autofocus>
          <span class="field-error" id="onb-name-err" hidden>${icon('alert-circle')}Enter your name to continue</span>
        </div>
        <div class="field">
          <label class="field-label" for="onb-district">District <span class="field-opt">(optional)</span></label>
          <select id="onb-district" class="select"><option value="">Choose your district</option>${BP.seed.DISTRICTS.map((d) => html`<option>${d}</option>`)}</select>
        </div>
        <fieldset class="field">
          <legend class="field-label">Highest qualification <span class="field-opt">(optional)</span></legend>
          <div class="chip-row" role="group" aria-label="Qualification">
            ${BP.seed.QUALIFICATIONS.map((q) => html`<button type="button" class="chip" aria-pressed="false" data-act="qual" data-value="${q}">${q}</button>`)}
          </div>
        </fieldset>
        <div class="stack gap-3">
          <button type="submit" class="btn btn--primary btn--lg btn--block">Continue${icon('arrow-right')}</button>
          <button type="button" class="btn btn--ghost btn--block" data-act="skip">Skip for now</button>
        </div>
      </form>`);
    },
    mount(root) {
      const form = root.querySelector('#onb-form');
      if (form) form.addEventListener('submit', (e) => { e.preventDefault(); finish(true); });
    },
    actions: {
      qual(el) {
        const on = el.getAttribute('aria-pressed') !== 'true';
        el.parentElement.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
        el.setAttribute('aria-pressed', String(on));
      },
      skip() { finish(false); },
    },
  });

  function finish(withOptional) {
    const name = document.getElementById('onb-name');
    const err = document.getElementById('onb-name-err');
    if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); err.hidden = false; name.focus(); return; }
    const district = withOptional ? document.getElementById('onb-district').value || null : null;
    const chip = document.querySelector('[data-act="qual"][aria-pressed="true"]');
    const qualification = withOptional && chip ? chip.dataset.value : null;
    const id = BP.store.state.session.userId;
    BP.store.update((s) => {
      const u = s.users.find((x) => x.id === id);
      u.name = name.value.trim().replace(/\s+/g, ' ');
      u.district = district;
      u.qualification = qualification;
    }, { silent: true });
    BP.ui.toast('Welcome to BoodhamPSC, ' + name.value.trim().split(' ')[0], { type: 'success' });
    BP.router.go('/user/home');
  }

  /* ---------- Single session ---------- */
  BP.router.add('/user/signed-out', {
    role: 'user', auth: false, chrome: 'none', title: 'Logged out', noRemember: true,
    render() {
      return html`<div class="center-page">
        <div class="center-card">
          <div class="card stack gap-6 t-center items-center">
            ${iconTile('smartphone', 'warning', 'lg')}
            <div class="stack gap-2">
              <h1 class="t-h1">You were logged out</h1>
              <p class="t-body t-muted">You were logged out because your account was used on another device. Your account can be active on one device at a time.</p>
            </div>
            <button type="button" class="btn btn--primary btn--lg btn--block" data-act="relogin">Log in again</button>
          </div>
        </div>
      </div>`;
    },
    actions: {
      relogin() {
        S.logoutUser();
        BP.router.go('/user/login');
      },
    },
  });
})();
