/* Admin content library: everything by type and status, with search and Unpublish. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon } = BP.ui;
  const STATUSES = [{ value: '', label: 'All' }, { value: 'published', label: 'Published' }, { value: 'submitted', label: 'In review' }, { value: 'draft', label: 'Drafts' }, { value: 'rejected', label: 'Rejected' }, { value: 'unpublished', label: 'Unpublished' }];
  let search = '';

  BP.router.add('/admin/library', {
    role: 'admin', chrome: 'panel', nav: 'library', title: 'Content library',
    render(ctx) {
      const type = BP.content.TYPES[ctx.query.type] ? ctx.query.type : 'tests';
      const status = ctx.query.status || '';
      const items = BP.store.state[type];
      const q = search.toLowerCase();
      const list = items.filter((it) => (!status || BP.content.stateOf(it).key === status) && (!q || BP.content.titleOf(type, it).toLowerCase().includes(q)))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      const hasAccess = type === 'tests' || type === 'papers';
      return html`${BP.ad.pageHead('Content library', 'All content from every creator. Open an item to preview it, or unpublish anything at any time.')}
        <div class="filters">
          ${BP.ui.segmented(BP.ad.TYPE_TABS.map((t) => ({ value: t.value, label: t.label, count: BP.store.state[t.value].length })), type, { act: 'type', label: 'Content type' })}
          <div class="lib-tools">
            <div class="chip-row" role="group" aria-label="Status">${STATUSES.map((s) => html`<button type="button" class="chip" aria-pressed="${String(s.value === status)}" data-act="status" data-value="${s.value}">${s.label}</button>`)}</div>
            <div class="search"><label class="visually-hidden" for="lib-search">Search by title</label>${icon('search')}<input id="lib-search" class="input" placeholder="Search by title" value="${search}"></div>
          </div>
        </div>
        ${list.length ? html`<div class="table-wrap"><table class="table table--stack">
          <thead><tr><th scope="col">Title</th><th scope="col">Where</th><th scope="col">Creator</th><th scope="col">Status</th>${hasAccess ? html`<th scope="col">Access</th>` : ''}<th scope="col" class="cell-actions">Actions</th></tr></thead>
          <tbody>${list.map((it) => html`<tr>
            <td><a class="t-strong" href="#/admin/approvals/${type}/${it.id}?from=library">${BP.content.titleOf(type, it)}</a></td>
            <td data-label="Where">${BP.content.cardPath(it.cardId).slice(1).join(' › ')}${type === 'tests' && it.year ? ' · ' + it.year : ''}</td>
            <td data-label="Creator">${BP.ad.creatorName(it.createdBy)}</td>
            <td data-label="Status">${BP.cr.statusPill(it)}</td>
            ${hasAccess ? html`<td data-label="Access">${it.status === 'published' ? (it.isPremium ? BP.ui.pill('premium', 'Premium') : BP.ui.pill('success', 'Free')) : '—'}</td>` : ''}
            <td class="cell-actions"><a class="btn btn--secondary btn--sm" href="#/admin/approvals/${type}/${it.id}?from=library">View</a>
              ${it.status === 'published' ? html`<button type="button" class="btn btn--danger btn--sm" data-act="unpublish" data-id="${it.id}">Unpublish</button>` : ''}</td>
          </tr>`)}</tbody></table></div>`
          : BP.ui.emptyState({ icon: 'library', title: 'Nothing matches', text: 'Try another status or clear the search.' })}`;
    },
    mount(root) {
      const s = root.querySelector('#lib-search');
      s.addEventListener('input', () => { search = s.value; const pos = s.selectionStart; BP.router.render({ rerender: true }); const n = document.getElementById('lib-search'); n.focus(); n.setSelectionRange(pos, pos); });
    },
    actions: {
      type(el) { BP.router.go('/admin/library', { type: el.dataset.value }, { replace: true }); },
      status(el, e, ctx) { BP.router.go('/admin/library', { type: ctx.query.type, status: el.dataset.value }, { replace: true }); },
      async unpublish(el, e, ctx) {
        const ok = await BP.ui.confirm({ title: 'Unpublish this item?', body: 'Users will no longer see it. The creator can edit it and submit it again.', confirmLabel: 'Unpublish', danger: true });
        if (!ok) return;
        BP.content.unpublish(ctx.query.type || 'tests', el.dataset.id);
        BP.ui.toast('Unpublished', { type: 'success' });
      },
    },
  });
})();
