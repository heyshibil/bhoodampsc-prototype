/* Creator / Admin shell: sidebar (drawer below 1024px) + top bar. Menus come from BP.panels[role]. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, avatar } = BP.ui;
  BP.panels = BP.panels || {};

  BP.shells.panel = function (content, ctx) {
    const role = ctx.view.role;
    const cfg = BP.panels[role];
    const person = cfg.person(ctx) || { name: '', sub: '' };
    return html`<div class="p-shell" id="p-shell">
      <aside class="sidebar" id="sidebar" aria-label="${cfg.label} menu">
        ${raw(BP.logo({ href: '#' + BP.router.DEFAULT_ROUTE[role] }))}
        <span class="tag tag--primary side-role">${cfg.label}</span>
        <nav class="side-group" aria-label="${cfg.label}">
          <div class="side-label">Menu</div>
          ${cfg.menu(ctx).map((m) => html`<a class="side-item" href="${m.href}" aria-current="${ctx.view.nav === m.key ? 'page' : 'false'}">
            ${icon(m.icon)}<span>${m.label}</span>${m.badge ? html`<span class="badge">${m.badge}</span><span class="visually-hidden">, ${m.badge} waiting</span>` : ''}
          </a>`)}
        </nav>
        <div class="side-foot">
          <button type="button" class="side-item" data-act="panel-logout">${icon('log-out')}<span>Log out</span></button>
        </div>
      </aside>
      <div class="p-body">
        <header class="p-top">
          <button type="button" class="icon-btn menu-btn" data-act="drawer-open" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button>
          <div class="p-top-title">${raw(BP.logo({ cls: 'mobile-only' }))}</div>
          <div class="who">${avatar(person.name)}<span class="who-text"><b>${person.name}</b><span>${person.sub}</span></span></div>
        </header>
        <main id="main" class="p-main">${content}</main>
      </div>
    </div>`;
  };

  /* Drawer behaviour (below 1024px) */
  function openDrawer() {
    const shell = document.getElementById('p-shell');
    if (!shell || shell.classList.contains('drawer-open')) return;
    shell.classList.add('drawer-open');
    const scrim = document.createElement('div');
    scrim.className = 'drawer-scrim';
    scrim.addEventListener('click', closeDrawer);
    shell.appendChild(scrim);
    const btn = shell.querySelector('.menu-btn');
    btn.setAttribute('aria-expanded', 'true');
    const first = shell.querySelector('#sidebar .side-item');
    if (first) first.focus();
    document.addEventListener('keydown', onKey);
  }
  function closeDrawer() {
    const shell = document.getElementById('p-shell');
    if (!shell) return;
    shell.classList.remove('drawer-open');
    const scrim = shell.querySelector('.drawer-scrim');
    if (scrim) scrim.remove();
    const btn = shell.querySelector('.menu-btn');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') closeDrawer(); }

  BP.shellActions['drawer-open'] = openDrawer;
  BP.shellActions['panel-logout'] = function (el, e, ctx) {
    const role = ctx.view.role;
    BP.panels[role].logout();
    BP.ui.toast('You have logged out');
    BP.router.go(BP.router.LOGIN_ROUTE[role]);
  };
})();
