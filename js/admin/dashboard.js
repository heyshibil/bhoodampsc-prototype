/* Admin dashboard: simple tiles and what needs attention. No reports module (pending with the client). */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;

  BP.router.add('/admin/dashboard', {
    role: 'admin', chrome: 'panel', nav: 'dashboard', title: 'Dashboard',
    render(ctx) {
      const st = BP.store.state, q = BP.store.q;
      const pending = q.pendingApprovals();
      const pub = (k) => st[k].filter((x) => x.status === 'published').length;
      const tiles = [
        ['list-checks', 'Pending approvals', pending.length, '#/admin/approvals', 'accent'],
        ['file-text', 'Published tests', pub('tests'), '#/admin/library?type=tests&status=published', ''],
        ['download', 'Published papers', pub('papers'), '#/admin/library?type=papers&status=published', ''],
        ['bell', 'Published notifications', pub('applications') + pub('exams'), '#/admin/library?type=applications&status=published', ''],
        ['users', 'Users', st.users.length, '#/admin/users', ''],
        ['unlock', 'Premium users', st.users.filter((u) => u.isPremium).length, '#/admin/users?plan=premium', 'accent'],
      ];
      const cards = st.cards;
      return html`${BP.ad.pageHead('Hello, ' + ctx.admin.name.split(' ')[0], 'Here is what needs your attention today.')}
        <div class="stat-grid stat-grid--3 mb-6">${tiles.map(([ic, label, n, href, v]) => html`<a class="stat" href="${href}">
          <div class="stat-head">${iconTile(ic, v, 'sm')}<span class="stat-label">${label}</span></div><span class="t-stat">${n}</span></a>`)}</div>
        <div class="dash-grid">
          <section class="card stack gap-4" aria-labelledby="wait-h">
            <div class="row-between"><h2 class="t-h3" id="wait-h">Waiting for review</h2><a class="link-btn" href="#/admin/approvals">View all${icon('arrow-right')}</a></div>
            ${pending.length ? html`<div class="list list--divided">${pending.slice(0, 5).map(({ type, item }) => html`<a class="list-row list-row--compact" href="#/admin/approvals/${type}/${item.id}">
                ${iconTile(BP.content.TYPES[type].icon, '', 'sm')}
                <span class="lr-main"><span class="lr-title clamp-2">${BP.content.titleOf(type, item)}</span><span class="lr-meta">${BP.content.TYPES[type].label} · ${BP.ad.creatorName(item.createdBy)}${item.pending ? ' · changes to live item' : ''}</span></span>
                <span class="btn btn--secondary btn--sm">Review</span></a>`)}</div>`
              : BP.ui.emptyState({ icon: 'check-circle', title: 'All caught up', text: 'New submissions from creators appear here.' })}
          </section>
          <div class="stack gap-4">
            <section class="card stack gap-3" aria-labelledby="qa-h">
              <h2 class="t-h3" id="qa-h">Quick actions</h2>
              <div class="quick-grid">
                <a class="quick" href="#/admin/structure/card/new">${iconTile('plus', '', 'sm')}Add a card</a>
                <a class="quick" href="#/admin/banners/new">${iconTile('image', '', 'sm')}Add a banner</a>
                <a class="quick" href="#/admin/structure/lists">${iconTile('calendar', '', 'sm')}Years and categories</a>
                <a class="quick" href="#/admin/settings">${iconTile('settings', '', 'sm')}Settings</a>
              </div>
            </section>
            <section class="card stack gap-3" aria-labelledby="sg-h">
              <h2 class="t-h3" id="sg-h">Home structure</h2>
              <dl class="facts facts--plain">
                <div class="fact"><dt>Sections</dt><dd>${st.sections.filter((s) => s.status !== 'hidden').length} visible, ${st.sections.filter((s) => s.status === 'hidden').length} hidden</dd></div>
                <div class="fact"><dt>Cards</dt><dd>${cards.filter((c) => c.status === 'live').length} live, ${cards.filter((c) => c.status === 'coming_soon').length} coming soon, ${cards.filter((c) => c.status === 'hidden').length} hidden</dd></div>
                <div class="fact"><dt>Active banners</dt><dd>${q.activeBanners().length}</dd></div>
              </dl>
              <a class="btn btn--secondary btn--sm self-start" href="#/admin/structure">${icon('layers')}Open structure</a>
            </section>
          </div>
        </div>`;
    },
  });
})();
