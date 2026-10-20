/* Creator panel: menu config and demo login (pick a creator). */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, avatar } = BP.ui;
  const S = BP.store.session;

  BP.panels.creator = {
    label: 'Creator panel',
    person: (ctx) => ctx.creator && { name: ctx.creator.name, sub: 'Creator' },
    menu: () => [
      { key: 'dashboard', label: 'My content', icon: 'dashboard', href: '#/creator/dashboard' },
      { key: 'new', label: 'Create content', icon: 'plus', href: '#/creator/new' },
    ],
    logout: () => S.logoutCreator(),
  };

  BP.router.add('/creator/login', {
    role: 'creator', auth: false, guestOnly: true, chrome: 'none', title: 'Creator sign in',
    render() {
      const creators = BP.store.get('creators');
      return html`<div class="center-page">
        <div class="center-card">
          ${raw(BP.logo({ cls: 'logo--lg' }))}
          <div class="card stack gap-6">
            <div class="stack gap-2">
              <span class="tag tag--primary self-start">Creator panel</span>
              <h1 class="t-h1">Sign in as a creator</h1>
              <p class="t-body-sm t-muted">Demo sign-in. Pick a creator account to continue.</p>
            </div>
            <div class="list">
              ${creators.map((c) => html`<button type="button" class="list-row" data-act="pick" data-id="${c.id}">
                ${avatar(c.name)}
                <span class="lr-main"><span class="lr-title">${c.name}</span><span class="lr-meta">${c.focus}</span></span>
                ${raw(BP.icon('chevron-right', 'chev'))}
              </button>`)}
            </div>
          </div>
        </div>
      </div>`;
    },
    actions: {
      pick(el) {
        S.loginCreator(el.dataset.id);
        BP.router.go('/creator/dashboard');
      },
    },
  });
})();
