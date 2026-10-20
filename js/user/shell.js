/* User app shell: sidebar (desktop) / icon rail (tablet) / top bar + bottom tabs (phone).
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

  function sideFoot(u) {
    if (!u) return '';
    const plan = BP.store.state.plan;
    const premium = u.isPremium
      ? html`<span class="tag tag--premium u-side-plan">${icon('crown')}Premium member</span><span class="u-rail-premium" title="Premium member">${icon('crown')}<span class="visually-hidden">Premium member</span></span>`
      : html`<div class="premium-card u-side-promo">
          <div class="premium-card-head">${BP.ui.iconTile('crown', 'accent', 'sm')}<span class="premium-card-title">Go Premium</span></div>
          <p>Every premium test and paper, from ₹${plan.pricePerMonth} a month.</p>
          ${BP.u.premiumCta({ act: 'go-premium', title: 'Upgrade', block: true })}
        </div>
        <button type="button" class="u-rail-premium" data-act="go-premium" aria-label="Go Premium">${icon('crown')}</button>`;
    return html`${premium}
      <div class="u-side-sep" role="presentation"></div>
      <button type="button" class="u-side-item u-side-logout" data-act="user-logout"><span class="nav-ic">${icon('log-out')}</span><span>Log out</span></button>`;
  }

  BP.shells.user = function (content, ctx) {
    const u = ctx.user;
    const items = menu(ctx);
    const alerts = items.find((i) => i.key === 'alerts');
    return html`<div class="u-shell">
      <aside class="u-side" aria-label="Main navigation">
        <a class="u-side-brand" href="#/user/home" aria-label="BoodhamPSC home">${raw(BP.logoMark())}<span class="logo-word">Boodham<b>PSC</b></span></a>
        <nav class="u-side-nav" aria-label="Main">
          <span class="u-side-label">Menu</span>
          ${items.map((it) => html`<a class="u-side-item" href="${it.href}" aria-current="${current(ctx, it.key)}">
            <span class="nav-ic">${icon(it.icon)}${badge(it.badge)}</span><span>${it.label}</span>
            ${it.badge ? html`<span class="badge side-count" aria-hidden="true">${it.badge > 9 ? '9+' : it.badge}</span>` : ''}${srCount(it.badge)}
          </a>`)}
        </nav>
        <div class="u-side-foot">${sideFoot(u)}</div>
      </aside>
      <header class="u-top">
        <div class="container u-top-inner">
          ${raw(BP.logo({ href: '#/user/home' }))}
          <a class="icon-btn" href="${alerts.href}" aria-label="Alerts${alerts.badge ? ', ' + alerts.badge + ' unread' : ''}">${icon('bell')}${badge(alerts.badge)}</a>
        </div>
      </header>
      <main id="main" class="u-main container">${content}</main>
      <nav class="u-bottom" aria-label="Main">
        ${items.filter((it) => it.key !== 'alerts').map((it) => html`<a href="${it.href}" aria-current="${current(ctx, it.key)}">
          <span class="nav-ic">${icon(it.icon)}${badge(it.badge)}</span>${it.label}${srCount(it.badge)}
        </a>`)}
      </nav>
    </div>`;
  };

  BP.shellActions['go-premium'] = function () { BP.premium.upgrade(); };
  BP.shellActions['user-logout'] = function () { BP.u.confirmLogout(); };
})();
