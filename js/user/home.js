/* User Home: banner area + sections and cards, all from BP.store. No section or card is named in code. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile } = BP.ui;
  let cleanupBanner = () => {};

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  /** Live, data-driven line for a card: how much is inside it right now. */
  function cardMeta(card) {
    if (card.status === 'coming_soon') return 'Coming soon';
    const q = BP.store.q;
    const n = (k, word) => k + ' ' + word + (k === 1 ? '' : 's');
    switch (card.template) {
      case 'paper_test': case 'topic_test': { const k = q.testsFor(card.id).length; return k ? n(k, 'test') : 'Tests coming'; }
      case 'notification': { const k = q.noticesFor(card.id, 'application').length + q.noticesFor(card.id, 'exam').length; return k ? n(k, 'notice') : 'No notices yet'; }
      case 'paper_download': { const k = q.papersFor(card.id).length; return k ? n(k, 'paper') : 'Papers coming'; }
      case 'current_affairs': { const all = q.caFor(card.id); const d = all.filter((x) => x.bucket === 'daily').length; return d ? d + ' in Daily' : n(all.length, 'question'); }
      default: return '';
    }
  }

  /* Decorative layers for the cards (inspired by illustrated app cards): two soft waves, a glow and sparkles. */
  const WAVES = '<svg viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true"><path class="w3" d="M118 0C138 22 166 36 200 30V0Z"/><path class="w1" d="M0 74C38 56 78 92 124 72S186 50 200 58V120H0Z"/><path class="w2" d="M0 98C46 82 96 116 146 94S192 86 200 90V120H0Z"/></svg>';
  const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 13.9 10.1 22.5 12 13.9 13.9 12 22.5 10.1 13.9 1.5 12 10.1 10.1Z"/></svg>';

  /** Section-themed card. Used on Home, in the Admin card preview and in the component gallery. */
  function tile(card, section, opts) {
    opts = opts || {};
    const theme = 'theme-' + BP.themeOf(section);
    const soon = card.status === 'coming_soon';
    const inner = html`<span class="tile-decor" aria-hidden="true">${raw(WAVES)}</span>
      <span class="tile-spark tile-spark--a" aria-hidden="true">${raw(SPARK)}</span><span class="tile-spark tile-spark--b" aria-hidden="true">${raw(SPARK)}</span>
      <span class="tile-art" aria-hidden="true">${icon(card.icon)}</span>
      <span class="tile-title">${card.title || 'Card title'}</span>
      <span class="tile-meta">${soon ? icon('sparkles') : ''}${opts.meta || cardMeta(card)}</span>`;
    if (opts.preview) return html`<div class="tile ${theme} ${soon ? 'tile--soon' : ''} tile--preview">${inner}</div>`;
    if (soon) return html`<button type="button" class="tile ${theme} tile--soon" data-act="soon" data-id="${card.id}">${inner}</button>`;
    return html`<a class="tile ${theme}" href="#/user/card/${card.id}">${inner}</a>`;
  }
  BP.homeTile = tile;

  function resumeCard(user) {
    const live = BP.store.q.attemptsFor(user.id).find((a) => a.status === 'in_progress');
    if (!live) return '';
    const left = Math.max(0, Math.round((live.expiresAt - Date.now()) / 1000));
    return html`<a class="resume-card" href="#/user/attempt/${live.id}">
      ${iconTile('timer', 'warning')}
      <span class="grow"><span class="t-h3">Test in progress</span><span class="t-caption block">${live.snapshot.title} · ${Math.ceil(left / 60)} min left</span></span>
      <span class="btn btn--primary btn--sm">Resume${icon('arrow-right')}</span>
    </a>`;
  }

  BP.router.add('/user/home', {
    role: 'user', chrome: 'user', nav: 'home', title: 'Home',
    render(ctx) {
      const u = ctx.user;
      const layout = BP.store.q.homeLayout();
      return html`
        <div class="home-head">
          <div>
            <p class="t-body-sm t-muted">${greeting()},</p>
            <h1 class="t-display">${u.name.split(' ')[0]}</h1>
          </div>
          <div class="home-plan">${u.isPremium ? BP.u.premiumBadge('Premium') : BP.u.premiumCta()}</div>
        </div>
        ${resumeCard(u)}
        ${BP.banners.render(BP.store.q.activeBanners())}
        <div class="stack gap-8 home-sections">
          ${layout.length ? layout.map((g) => html`<section id="section-${g.section.id}" class="home-sec theme-${BP.themeOf(g.section)}" aria-labelledby="sec-${g.section.id}">
            <div class="section-head"><h2 id="sec-${g.section.id}">${g.section.title}</h2></div>
            <div class="tile-grid">${g.cards.map((c) => tile(c, g.section))}</div>
          </section>`) : BP.ui.emptyState({ title: 'Nothing here yet', text: 'Sections appear here once the admin publishes them.' })}
        </div>`;
    },
    mount(root, ctx) {
      cleanupBanner = BP.banners.mount(root);
      if (ctx.query.section) {
        const el = document.getElementById('section-' + ctx.query.section);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    },
    unmount() { cleanupBanner(); },
    actions: {
      upgrade() { BP.premium.upgrade(); },
      soon(el) {
        const card = BP.store.byId('cards', el.dataset.id);
        BP.ui.sheet({
          title: card.title,
          body: html`<div class="stack gap-4 items-center t-center pt-2">
            ${iconTile(card.icon, 'accent', 'lg')}
            <div class="stack gap-2">
              <span class="tag tag--accent self-center">${icon('sparkles')}Coming soon</span>
              <p class="t-body t-muted">We are preparing ${card.title} for you. It will open here as soon as it is ready.</p>
            </div>
          </div>`,
          foot: html`<button type="button" class="btn btn--primary" data-act="close">Got it</button>`,
        });
      },
    },
  });

  /* Any card route: hand over to the card's flow template. Hidden cards are never shown; Coming soon shows a note. */
  BP.templates = BP.templates || {};
  BP.router.add('/user/card/:cardId', {
    role: 'user', chrome: 'user', nav: 'home',
    title: (ctx) => { const c = BP.store.byId('cards', ctx.params.cardId); return c ? c.title : 'Not found'; },
    render(ctx) {
      const card = BP.store.byId('cards', ctx.params.cardId);
      const section = card && BP.store.byId('sections', card.sectionId);
      if (!card || card.status === 'hidden' || !section || section.status === 'hidden') return BP.u.missingCard();
      if (card.status === 'coming_soon') {
        return html`${BP.u.pageHead({ back: '#/user/home', backLabel: 'Home', crumbs: [section.title], title: card.title })}
          ${BP.ui.emptyState({ icon: 'sparkles', title: 'Coming soon', text: 'We are preparing this for you. It will open here as soon as it is ready.' })}`;
      }
      const tpl = BP.templates[card.template];
      return tpl ? tpl.render(card, section, ctx) : BP.u.missingCard();
    },
    mount(root, ctx) { const c = BP.store.byId('cards', ctx.params.cardId); const t = c && BP.templates[c.template]; if (t && t.mount) t.mount(root, ctx, c); },
    actions: new Proxy({}, {
      get(_, name) {
        const ctx = BP.router.current && BP.router.current.ctx;
        const c = ctx && BP.store.byId('cards', ctx.params.cardId);
        const t = c && BP.templates[c.template];
        return t && t.actions ? t.actions[name] : undefined;
      },
    }),
  });
})();
