/* Demo panel: prototype tooling only, deliberately styled apart from the product.
   Later phases plug in through BP.demo.hooks (connectionLoss, push). */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, avatar } = BP.ui;
  const S = BP.store.session;
  const hooks = {};

  function targetUser() { return S.user() || BP.store.byId('users', 'u_demo'); }

  function body() {
    const role = BP.store.state.session.role || 'user';
    const loggedIn = S.userState() === 'ok';
    const u = targetUser();
    return html`
      <div class="demo-group">
        <h3>View as</h3>
        ${BP.ui.segmented([
          { value: 'user', label: 'User' }, { value: 'creator', label: 'Creator' }, { value: 'admin', label: 'Admin' },
        ], role, { act: 'role', label: 'Role', block: true })}
      </div>
      <div class="demo-group">
        <h3>Demo user</h3>
        <div class="row">
          ${avatar(u.name)}
          <div class="grow"><div class="t-strong">${u.name}</div><div class="t-caption">${loggedIn ? 'Logged in' : 'Not logged in'} · ${u.isPremium ? 'Premium' : 'Free plan'}</div></div>
          <label class="switch"><input type="checkbox" id="demo-premium" ${u.isPremium ? 'checked' : ''}><span class="switch-track"></span><span class="t-body-sm t-strong">Premium</span></label>
        </div>
        ${loggedIn ? '' : html`<button type="button" class="btn btn--secondary btn--block" data-act="demo-login">${icon('user')}Log in as demo user</button>`}
      </div>
      <div class="demo-group">
        <h3>Simulate</h3>
        <div class="demo-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-act="sim-connection">${icon('wifi-off')}Connection loss</button>
          <button type="button" class="btn btn--secondary btn--sm" data-act="sim-device">${icon('smartphone')}Login on another device</button>
          <button type="button" class="btn btn--secondary btn--sm" data-act="sim-push">${icon('bell')}Push notification</button>
        </div>
      </div>
      <div class="demo-group">
        <h3>Prototype</h3>
        <div class="demo-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-act="defaults">${icon('file-text')}View demo defaults</button>
          <button type="button" class="btn btn--secondary btn--sm" data-act="gallery">${icon('palette')}Component gallery</button>
          <button type="button" class="btn btn--danger btn--sm" data-act="reset">${icon('refresh')}Reset demo data</button>
        </div>
      </div>`;
  }

  function open() {
    BP.ui.sheet({
      title: 'Demo',
      cls: 'demo-sheet',
      body: body(),
      onMount(el, api) {
        // Delegated, so it keeps working after setBody() re-renders the panel.
        el.addEventListener('change', (e) => {
          if (e.target.id !== 'demo-premium') return;
          const on = e.target.checked;
          const id = targetUser().id;
          BP.store.update((s) => {
            const u = s.users.find((x) => x.id === id);
            u.isPremium = on;
            u.premiumSince = on ? Date.now() : null;
          });
          api.setBody(body());
          api.el.querySelector('#demo-premium').focus();
          BP.ui.toast(on ? 'Premium is on for the demo user' : 'Premium is off for the demo user', { type: 'success' });
        });
      },
      actions: {
        role(el, e, api) {
          const role = el.dataset.value;
          api.close(true);
          const last = BP.store.state.session.lastRoute[role];
          BP.router.go(last ? '#' + last : BP.router.DEFAULT_ROUTE[role]);
        },
        'demo-login'(el, e, api) {
          api.close(true);
          S.loginUser('u_demo');
          BP.router.go('/user/home');
        },
        'sim-connection'(el, e, api) {
          if (hooks.connectionLoss && hooks.connectionLoss()) { api.close(true); return; }
          BP.ui.toast('Start a test first. Connection loss is simulated during a test.');
        },
        'sim-device'(el, e, api) {
          if (S.userState() !== 'ok') { BP.ui.toast('Log in as a user first.'); return; }
          api.close(true);
          S.simulateOtherDevice();
          BP.router.go('/user/home');
        },
        'sim-push'() {
          if (hooks.push && hooks.push()) return;
          BP.ui.toast('Push-style alerts are added with notifications in Phase 4.');
        },
        defaults() { openDefaults(); },
        gallery(el, e, api) { api.close(true); BP.router.go('/styleguide'); },
        async reset(el, e, api) {
          const ok = await BP.ui.confirm({
            title: 'Reset demo data?',
            body: 'Everything changed in this demo (users, content, attempts, structure) goes back to the original sample data. You will be logged out.',
            confirmLabel: 'Reset', danger: true,
          });
          if (!ok) return;
          api.close(true);
          BP.store.reset();
          BP.ui.toast('Demo data has been reset', { type: 'success' });
        },
      },
    });
  }

  function openDefaults() {
    BP.ui.sheet({
      title: 'Demo defaults and assumptions',
      size: 'xl',
      body: html`<div class="md">${BP.ui.markdown(BP.decisionsMarkdown || 'Not available.')}</div>`,
    });
  }

  function mount() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'demo-fab';
    btn.setAttribute('aria-label', 'Open demo controls (prototype only)');
    btn.innerHTML = BP.icon('terminal') + '<span>DEMO</span>';
    btn.addEventListener('click', open);
    document.body.appendChild(btn);
  }

  BP.demo = { mount, open, hooks };
})();
