/* User app shell (master context §6): bottom tab bar on phones and tablets, top navigation on desktop.
   Phones / tablets (< 1024): slim top bar (logo + premium access) and a bottom tab bar.
   Desktop (>= 1024):         one top navigation bar (logo, menu, premium access, account).
   MENU is the single list of destinations. Add an entry here and it appears in every layout. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon } = BP.ui;

  function menu(ctx) {
    const unread = ctx.user ? BP.store.q.unreadCount(ctx.user.id) : 0;
    return [
      { key: 'home', label: 'Home', icon: 'home', href: '#/user/home' },
      { key: 'alerts', label: 'Alerts', icon: 'bell', href: '#/user/alerts', badge: unread },
      { key: 'profile', label: 'Profile', icon: 'user', href: '#/user/profile' },
    ];
  }
  const current = (ctx, key) => (ctx.view.nav === key ? 'page' : 'false');
  const badge = (n) => (n ? html`<span class="badge" aria-hidden="true">${n > 9 ? '9+' : n}</span>` : '');
  const srCount = (n) => (n ? html`<span class="visually-hidden">, ${n} unread</span>` : '');

  /** Premium access: a quiet button for free users, a member tag for premium users. */
  function premium(u, compact) {
    if (!u) return '';
    if (u.isPremium) return html`<span class="tag tag--premium u-plan-tag">${icon('unlock')}${compact ? 'Premium' : 'Premium member'}</span>`;
    return html`<button type="button" class="btn btn--secondary btn--sm u-premium-btn" data-act="go-premium">${icon('crown')}${compact ? 'Premium' : 'Go Premium'}</button>`;
  }

  BP.shells.user = function (content, ctx) {
    const u = ctx.user;
    const items = menu(ctx);
    return html`<div class="u-shell">
      <header class="u-top">
        <div class="container u-top-inner">
          ${raw(BP.logo({ href: '#/user/home' }))}
          <nav class="u-topnav" aria-label="Main">
            ${items.map((it) => html`<a class="u-topnav-item" href="${it.href}" aria-current="${current(ctx, it.key)}">${icon(it.icon)}<span>${it.label}</span>${badge(it.badge)}${srCount(it.badge)}</a>`)}
          </nav>
          <div class="u-top-end">
            <span class="u-premium-full">${premium(u, false)}</span>
            <span class="u-premium-compact">${premium(u, true)}</span>
            ${u ? html`<a class="u-account" href="#/user/profile" aria-label="Your profile">${BP.ui.avatar(u.name, 'avatar--sm')}<span class="u-account-name">${u.name.split(' ')[0]}</span></a>
              <button type="button" class="icon-btn icon-btn--plain u-logout" data-act="user-logout" aria-label="Log out" title="Log out">${icon('log-out')}</button>` : ''}
          </div>
        </div>
      </header>
      <main id="main" class="u-main container">${content}</main>
      <nav class="u-bottom" aria-label="Main">
        ${items.map((it) => html`<a href="${it.href}" aria-current="${current(ctx, it.key)}">
          <span class="nav-ic">${icon(it.icon)}${badge(it.badge)}</span>${it.label}${srCount(it.badge)}
        </a>`)}
      </nav>
    </div>`;
  };

  BP.shellActions['go-premium'] = function () { BP.premium.upgrade(); };
  BP.shellActions['user-logout'] = function () { BP.u.confirmLogout(); };
})();
