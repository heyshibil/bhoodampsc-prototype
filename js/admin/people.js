/* Admin: users and creators (simple lists with search). */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, avatar, pill } = BP.ui;
  const searches = { users: '', creators: '' };
  const phone = (p) => '+91 ' + String(p).slice(0, 5) + ' ' + String(p).slice(5);

  function searchBox(kind, label) {
    return html`<div class="search lib-search"><label class="visually-hidden" for="ppl-search">${label}</label>${icon('search')}<input id="ppl-search" class="input" placeholder="${label}" value="${searches[kind]}"></div>`;
  }
  function bindSearch(root, kind) {
    const s = root.querySelector('#ppl-search');
    s.addEventListener('input', () => { searches[kind] = s.value; const pos = s.selectionStart; BP.router.render({ rerender: true }); const n = document.getElementById('ppl-search'); n.focus(); n.setSelectionRange(pos, pos); });
  }

  BP.router.add('/admin/users', {
    role: 'admin', chrome: 'panel', nav: 'users', title: 'Users',
    render(ctx) {
      const st = BP.store.state;
      const q = searches.users.toLowerCase();
      const plan = ctx.query.plan || '';
      const list = st.users.filter((u) => u.name && (!plan || (plan === 'premium') === !!u.isPremium) && (!q || u.name.toLowerCase().includes(q) || u.phone.includes(q.replace(/\s/g, ''))))
        .sort((a, b) => b.joinedAt - a.joinedAt);
      const attempts = (id) => st.attempts.filter((a) => a.userId === id && a.result).length;
      return html`${BP.ad.pageHead('Users', st.users.length + ' registered · ' + st.users.filter((u) => u.isPremium).length + ' premium')}
        <div class="filters"><div class="lib-tools">
          <div class="chip-row" role="group" aria-label="Plan">${[['', 'All'], ['premium', 'Premium'], ['free', 'Free']].map(([v, l]) => html`<button type="button" class="chip" aria-pressed="${String(v === plan)}" data-act="plan" data-value="${v}">${l}</button>`)}</div>
          ${searchBox('users', 'Search by name or phone')}</div></div>
        ${list.length ? html`<div class="table-wrap"><table class="table table--stack">
          <thead><tr><th scope="col">User</th><th scope="col">District</th><th scope="col">Qualification</th><th scope="col">Plan</th><th scope="col">Attempts</th><th scope="col">Joined</th><th scope="col" class="cell-actions">Action</th></tr></thead>
          <tbody>${list.map((u) => html`<tr>
            <td><div class="cell-person">${avatar(u.name, 'avatar--sm')}<div><b>${u.name}</b><span>${phone(u.phone)}</span></div></div></td>
            <td data-label="District">${u.district || '—'}</td><td data-label="Qualification">${u.qualification || '—'}</td>
            <td data-label="Plan">${u.isPremium ? pill('premium', 'Premium') : pill('neutral', 'Free')}</td>
            <td data-label="Attempts" class="t-num">${attempts(u.id)}</td><td data-label="Joined">${BP.ui.fmtDate(u.joinedAt)}</td>
            <td class="cell-actions"><button type="button" class="btn btn--secondary btn--sm" data-act="view" data-id="${u.id}">View</button></td>
          </tr>`)}</tbody></table></div>` : BP.ui.emptyState({ icon: 'users', title: 'No users match', text: 'Try another search.' })}`;
    },
    mount(root) { bindSearch(root, 'users'); },
    actions: {
      plan(el) { BP.router.go('/admin/users', { plan: el.dataset.value }, { replace: true }); },
      view(el) {
        const u = BP.store.byId('users', el.dataset.id);
        const at = BP.store.q.attemptsFor(u.id);
        const done = at.filter((a) => a.result);
        BP.ui.sheet({
          title: u.name,
          body: html`<div class="stack gap-4">
            <div class="row gap-3">${avatar(u.name, 'avatar--lg')}<div><div class="t-h3">${u.name}</div><div class="t-caption">${phone(u.phone)}</div></div></div>
            <dl class="facts card">
              <div class="fact"><dt>Subscription</dt><dd>${u.isPremium ? 'Premium since ' + BP.ui.fmtDate(u.premiumSince || u.joinedAt) : 'Free plan'}</dd></div>
              <div class="fact"><dt>Attempts</dt><dd>${done.length} completed${at.length > done.length ? ', 1 in progress' : ''}</dd></div>
              <div class="fact"><dt>District</dt><dd>${u.district || 'Not set'}</dd></div>
              <div class="fact"><dt>Qualification</dt><dd>${u.qualification || 'Not set'}</dd></div>
              <div class="fact"><dt>Joined</dt><dd>${BP.ui.fmtDate(u.joinedAt)}</dd></div>
            </dl>
            ${done.length ? html`<div class="stack gap-2"><span class="field-label">Recent attempts</span>${done.slice(0, 4).map((a) => html`<div class="row-between t-body-sm"><span class="truncate">${a.snapshot.title}</span><b class="t-num">${BP.scoring.fmt(a.result.score)}/${BP.scoring.fmt(a.result.max)}</b></div>`)}</div>` : ''}
          </div>`,
          foot: html`<button type="button" class="btn btn--primary" data-act="close">Close</button>`,
        });
      },
    },
  });

  BP.router.add('/admin/creators', {
    role: 'admin', chrome: 'panel', nav: 'creators', title: 'Creators',
    render() {
      const q = searches.creators.toLowerCase();
      const list = BP.store.state.creators.filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
      const count = (id, key) => BP.store.q.contentByCreator(id).filter((x) => BP.content.stateOf(x.item).key === key).length;
      return html`${BP.ad.pageHead('Creators', 'Creators can add content to any card. Everything they make comes to you for approval.')}
        <div class="filters">${searchBox('creators', 'Search creators')}</div>
        ${list.length ? html`<div class="table-wrap"><table class="table table--stack">
          <thead><tr><th scope="col">Creator</th><th scope="col">Works on</th><th scope="col">Published</th><th scope="col">In review</th><th scope="col">Drafts</th><th scope="col">Rejected</th></tr></thead>
          <tbody>${list.map((c) => html`<tr>
            <td><div class="cell-person">${avatar(c.name, 'avatar--sm')}<div><b>${c.name}</b><span>${c.email}</span></div></div></td>
            <td data-label="Works on">${c.focus}</td>
            <td data-label="Published" class="t-num">${count(c.id, 'published')}</td><td data-label="In review" class="t-num">${count(c.id, 'submitted')}</td>
            <td data-label="Drafts" class="t-num">${count(c.id, 'draft')}</td><td data-label="Rejected" class="t-num">${count(c.id, 'rejected')}</td>
          </tr>`)}</tbody></table></div>` : BP.ui.emptyState({ icon: 'user-check', title: 'No creators match' })}
        <p class="t-caption mt-4">Adding creator accounts is handled outside the prototype.</p>`;
    },
    mount(root) { bindSearch(root, 'creators'); },
  });
})();
