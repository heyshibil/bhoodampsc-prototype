/* User app shell: sidebar + slim top bar.
   Desktop (>= 1024): fixed sidebar (logo, Home, Home sections, the user at the bottom) and a top bar
                      with the alerts bell and Go Premium.
   Below 1024:        the same sidebar slides in as a drawer from the menu button in the top bar.
   Sections in the sidebar come from the Home layout (admin data), so new sections appear automatically.
   Alerts live only on the bell; Profile opens from the user at the bottom of the sidebar. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon } = BP.ui;

  const badge = (n) => (n ? html`<span class="badge" aria-hidden="true">${n > 9 ? '9+' : n}</span>` : '');

  /** Which sidebar entry is current: a section (Home with ?section, or a card/test inside it) or Home. */
  function currentSection(ctx) {
    if (ctx.query && ctx.query.section) return ctx.query.section;
    const cardId = ctx.params.cardId || (ctx.params.testId && (BP.store.byId('tests', ctx.params.testId) || {}).cardId)
      || (ctx.params.attemptId && ((BP.engine && BP.engine.get(ctx.params.attemptId)) || { snapshot: {} }).snapshot.cardId);
    const card = cardId && BP.store.byId('cards', cardId);
    return card ? card.sectionId : null;
  }

  function sidebar(ctx) {
    const u = ctx.user;
    const sections = BP.store.q.homeLayout().map((g) => g.section);
    const sec = currentSection(ctx);
    const onHome = ctx.view.nav === 'home' && !sec;
    return html`<aside class="u-side" id="u-side" aria-label="Main navigation">
      <div class="u-side-top">
        <a class="u-side-brand" href="#/user/home" aria-label="BoodhamPSC home">${raw(BP.logoMark())}<span class="logo-word">Boodham<b>PSC</b></span></a>
        <button type="button" class="icon-btn icon-btn--plain u-side-close" data-act="u-drawer-close" aria-label="Close menu">${icon('x')}</button>
      </div>
      <nav class="u-side-nav" aria-label="Main">
        <a class="u-side-item" href="#/user/home" aria-current="${onHome ? 'page' : 'false'}">${icon('home')}<span>Home</span></a>
        ${sections.length ? html`<span class="u-side-label">Sections</span>
          ${sections.map((s) => html`<a class="u-side-item u-side-sec theme-${BP.themeOf(s)}" href="#/user/home?section=${s.id}" aria-current="${sec === s.id ? 'page' : 'false'}"><span class="u-sec-dot" aria-hidden="true"></span><span class="truncate">${s.title}</span></a>`)}` : ''}
      </nav>
      ${u ? html`<a class="u-side-user" href="#/user/profile" aria-current="${ctx.view.nav === 'profile' ? 'page' : 'false'}" aria-label="${u.name}, open profile">
        ${BP.ui.avatar(u.name)}
        <span class="u-side-user-text"><b class="truncate">${u.name}</b><span>${u.isPremium ? 'Premium member' : 'Free plan'}</span></span>
        ${icon('chevron-right', 'u-side-user-chev')}
      </a>` : ''}
    </aside>`;
  }

  function topbar(ctx) {
    const u = ctx.user;
    const unread = u ? BP.store.q.unreadCount(u.id) : 0;
    return html`<header class="u-top">
      <div class="u-top-inner">
        <button type="button" class="icon-btn icon-btn--plain u-menu-btn" data-act="u-drawer-open" aria-label="Open menu" aria-controls="u-side" aria-expanded="false">${icon('menu')}</button>
        <span class="u-top-logo">${raw(BP.logo({ href: '#/user/home' }))}</span>
        <div class="u-top-end">
          ${u && u.isPremium ? html`<span class="premium-tag">${icon('crown')}<span>Premium</span></span>`
            : html`<button type="button" class="btn btn--gold btn--sm" data-act="go-premium" aria-label="Go Premium">${icon('crown')}<span>Go Premium</span></button>`}
          <a class="icon-btn icon-btn--plain u-bell ${ctx.view.nav === 'alerts' ? 'is-current' : ''}" href="#/user/alerts" aria-label="Alerts${unread ? ', ' + unread + ' unread' : ''}" ${ctx.view.nav === 'alerts' ? raw('aria-current="page"') : ''}>${icon('bell')}${badge(unread)}</a>
        </div>
      </div>
    </header>`;
  }

  BP.shells.user = function (content, ctx) {
    return html`<div class="u-shell" id="u-shell">
      ${sidebar(ctx)}
      <div class="u-body">
        ${topbar(ctx)}
        <main id="main" class="u-main">${content}</main>
      </div>
    </div>`;
  };

  /* Drawer (below 1024px): same behaviour as the Creator / Admin drawer. */
  function openDrawer() {
    const shell = document.getElementById('u-shell');
    if (!shell || shell.classList.contains('drawer-open')) return;
    shell.classList.add('drawer-open');
    const scrim = document.createElement('div');
    scrim.className = 'drawer-scrim';
    scrim.addEventListener('click', closeDrawer);
    shell.appendChild(scrim);
    const btn = shell.querySelector('.u-menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    const first = shell.querySelector('#u-side .u-side-item');
    if (first) first.focus();
    document.addEventListener('keydown', onKey);
  }
  function closeDrawer() {
    const shell = document.getElementById('u-shell');
    if (!shell) return;
    shell.classList.remove('drawer-open');
    const scrim = shell.querySelector('.drawer-scrim');
    if (scrim) scrim.remove();
    const btn = shell.querySelector('.u-menu-btn');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') closeDrawer(); }

  BP.shellActions['u-drawer-open'] = openDrawer;
  BP.shellActions['u-drawer-close'] = closeDrawer;
  BP.shellActions['go-premium'] = function () { BP.premium.upgrade(); };
  BP.shellActions['user-logout'] = function () { BP.u.confirmLogout(); };
})();
