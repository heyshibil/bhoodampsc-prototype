/* Admin panel: menu config and demo login. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, avatar } = BP.ui;
  const S = BP.store.session;

  BP.panels.admin = {
    label: 'Admin panel',
    person: (ctx) => ctx.admin && { name: ctx.admin.name, sub: 'Admin' },
    menu: () => {
      const pending = BP.store.q.pendingApprovals().length;
      return [
        { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#/admin/dashboard' },
        { key: 'structure', label: 'Structure', icon: 'layers', href: '#/admin/structure' },
        { key: 'approvals', label: 'Approvals', icon: 'list-checks', href: '#/admin/approvals', badge: pending },
        { key: 'library', label: 'Content library', icon: 'library', href: '#/admin/library' },
        { key: 'banners', label: 'Banners', icon: 'image', href: '#/admin/banners' },
        { key: 'users', label: 'Users', icon: 'users', href: '#/admin/users' },
        { key: 'creators', label: 'Creators', icon: 'user-check', href: '#/admin/creators' },
        { key: 'plan', label: 'Plan', icon: 'receipt', href: '#/admin/plan' },
        { key: 'settings', label: 'Settings', icon: 'settings', href: '#/admin/settings' },
      ];
    },
    logout: () => S.logoutAdmin(),
  };

  BP.router.add('/admin/login', {
    role: 'admin', auth: false, guestOnly: true, chrome: 'none', title: 'Admin sign in',
    render() {
      const admin = BP.store.get('admins')[0];
      return html`<div class="center-page">
        <div class="center-card">
          ${raw(BP.logo({ cls: 'logo--lg' }))}
          <div class="card stack gap-6">
            <div class="stack gap-2">
              <span class="tag tag--accent self-start">${icon('shield-check')}Admin panel</span>
              <h1 class="t-h1">Sign in as admin</h1>
              <p class="t-body-sm t-muted">Demo sign-in. The admin manages structure, approvals, banners and users.</p>
            </div>
            <button type="button" class="list-row" data-act="enter" data-id="${admin.id}">
              ${avatar(admin.name)}
              <span class="lr-main"><span class="lr-title">${admin.name}</span><span class="lr-meta">${admin.email}</span></span>
              ${raw(BP.icon('chevron-right', 'chev'))}
            </button>
          </div>
        </div>
      </div>`;
    },
    actions: {
      enter(el) {
        S.loginAdmin(el.dataset.id);
        BP.router.go('/admin/dashboard');
      },
    },
  });
})();
