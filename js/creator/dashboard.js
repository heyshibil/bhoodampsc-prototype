/* Creator: "My content" grouped by status, and "Create content" (pick a card from the admin's structure). */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;

  const TABS = [
    { value: 'draft', label: 'Drafts' }, { value: 'submitted', label: 'In review' },
    { value: 'published', label: 'Published' }, { value: 'rejected', label: 'Rejected' }, { value: 'unpublished', label: 'Unpublished' },
  ];

  function row(type, item) {
    const st = BP.content.stateOf(item);
    const src = item.pending || item;
    return html`<a class="list-row creator-row" href="${BP.cr.editHref(type, item)}">
      ${iconTile(BP.content.TYPES[type].icon, st.key === 'rejected' ? 'error' : st.live ? 'success' : '')}
      <span class="lr-main">
        <span class="lr-title clamp-2">${BP.content.titleOf(type, item)}</span>
        <span class="lr-meta">${BP.content.TYPES[type].label} · ${BP.content.cardPath(item.cardId).join(' › ')}${type === 'tests' ? ' · ' + (src.questions || []).length + ' questions' : ''}</span>
        ${st.key === 'rejected' && st.note ? html`<span class="lr-note lr-note--error">${icon('alert-circle')}Admin note: ${st.note}</span>` : ''}
        <span class="row-wrap gap-2 lr-tags">${BP.cr.statusPill(item)}<span class="lr-note">Updated ${BP.ui.fmtRelative(src.updatedAt || item.updatedAt)}</span></span>
      </span>
      ${icon('chevron-right', 'chev')}
    </a>`;
  }

  BP.router.add('/creator/dashboard', {
    role: 'creator', chrome: 'panel', nav: 'dashboard', title: 'My content',
    render(ctx) {
      const mine = BP.store.q.contentByCreator(ctx.creator.id);
      const groups = {};
      TABS.forEach((t) => { groups[t.value] = []; });
      mine.forEach((x) => { const k = BP.content.stateOf(x.item).key; (groups[k] = groups[k] || []).push(x); });
      const tabs = TABS.filter((t) => t.value !== 'unpublished' || groups.unpublished.length);
      const tab = tabs.some((t) => t.value === ctx.query.status) ? ctx.query.status : 'draft';
      const list = groups[tab];
      return html`<div class="page-head">
          <div><h1 class="t-h1">Hello, ${ctx.creator.name.split(' ')[0]}</h1><p>Everything you create goes to the admin for approval before users can see it.</p></div>
          <a class="btn btn--primary" href="#/creator/new">${icon('plus')}Create content</a>
        </div>
        <div class="stat-grid stat-grid--4 mb-6">
          ${[['draft', 'pencil', 'Drafts', ''], ['submitted', 'clock', 'In review', ''], ['published', 'check-circle', 'Published', 'success'], ['rejected', 'x-circle', 'Rejected', 'error']].map(([k, ic, label, v]) =>
            html`<a class="stat" href="#/creator/dashboard?status=${k}"><div class="stat-head">${iconTile(ic, v, 'sm')}<span class="stat-label">${label}</span></div><span class="t-stat">${groups[k].length}</span></a>`)}
        </div>
        <div class="filters">${BP.ui.segmented(tabs.map((t) => ({ value: t.value, label: t.label, count: groups[t.value].length })), tab, { act: 'tab', label: 'Status' })}</div>
        ${list.length ? html`<div class="list">${list.map((x) => row(x.type, x.item))}</div>`
          : BP.ui.emptyState({ icon: tab === 'rejected' ? 'check-circle' : 'file-text', title: { draft: 'No drafts', submitted: 'Nothing in review', published: 'Nothing published yet', rejected: 'Nothing rejected', unpublished: 'Nothing unpublished' }[tab],
            text: tab === 'draft' ? 'Start something new. You can save it as a draft and finish it later.' : 'Items move here as the admin reviews them.',
            action: tab === 'draft' ? html`<a class="btn btn--primary" href="#/creator/new">${icon('plus')}Create content</a>` : '' })}`;
    },
    actions: {
      tab(el) { BP.router.go('/creator/dashboard', { status: el.dataset.value }, { replace: true }); },
    },
  });

  /* ---------- Create: pick a card ---------- */
  const NEW_ROUTE = { paper_test: '/creator/test/new', topic_test: '/creator/test/new', paper_download: '/creator/paper/new', current_affairs: '/creator/ca/new' };
  const WHAT = { paper_test: 'Test', topic_test: 'Topic test', notification: 'Application or exam', paper_download: 'Question paper', current_affairs: 'Current affairs question' };

  BP.router.add('/creator/new', {
    role: 'creator', chrome: 'panel', nav: 'new', title: 'Create content',
    render() {
      const secs = BP.store.q.sections({ includeHidden: true });
      return html`<div class="page-head"><div><h1 class="t-h1">Create content</h1><p>Choose where it belongs. These cards come from the structure the admin built, and the form adapts to each card.</p></div></div>
        <div class="stack gap-8">${secs.map((s) => {
          const cards = BP.store.q.cardsOf(s.id); // Live and Coming soon; hidden cards are not offered
          if (!cards.length || s.status === 'hidden') return '';
          return html`<section aria-labelledby="cs-${s.id}"><div class="section-head"><h2 id="cs-${s.id}">${s.title}</h2></div>
            <div class="pick-grid">${cards.map((c) => html`<button type="button" class="pick-card" data-act="pick" data-id="${c.id}">
              ${iconTile(c.icon)}<span class="grow"><span class="t-h3 block">${c.title}</span><span class="t-caption">${WHAT[c.template]} · ${BP.TEMPLATES[c.template].label} flow</span></span>
              ${c.status === 'coming_soon' ? BP.ui.tag('neutral', 'Soon') : ''}${icon('plus')}
            </button>`)}</div></section>`;
        })}</div>`;
    },
    actions: {
      pick(el) {
        const card = BP.store.byId('cards', el.dataset.id);
        BP.cr.reset();
        if (card.template === 'notification') {
          BP.ui.sheet({
            title: 'What are you adding?',
            body: html`<div class="stack gap-3">
              <button type="button" class="pick-card" data-act="kind" data-kind="application">${iconTile('megaphone')}<span class="grow"><span class="t-h3 block">PSC application</span><span class="t-caption">Qualification, last date, vacancies, stage</span></span>${icon('chevron-right')}</button>
              <button type="button" class="pick-card" data-act="kind" data-kind="exam">${iconTile('calendar', 'accent')}<span class="grow"><span class="t-h3 block">PSC exam</span><span class="t-caption">Start and end dates, details</span></span>${icon('chevron-right')}</button>
            </div>`,
            actions: { kind(b, e, api) { api.close(true); BP.router.go('/creator/notice/' + b.dataset.kind + '/new', { card: card.id }); } },
          });
          return;
        }
        BP.router.go(NEW_ROUTE[card.template], { card: card.id });
      },
    },
  });
})();
