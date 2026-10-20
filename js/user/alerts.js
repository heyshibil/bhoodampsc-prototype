/* Alerts: the bell inbox, and a push-style banner (simulated browser push) for new alerts. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;

  const hrefFor = (n) => '#/user/notice/' + n.kind + '/' + n.refId;
  function markRead(userId, ids) {
    BP.store.update((s) => { s.inbox.forEach((n) => { if (n.userId === userId && (!ids || ids.includes(n.id))) n.read = true; }); });
  }

  BP.router.add('/user/alerts', {
    role: 'user', chrome: 'user', nav: 'alerts', title: 'Alerts',
    render(ctx) {
      const items = BP.store.q.inboxFor(ctx.user.id);
      const unread = items.filter((n) => !n.read).length;
      return html`${BP.u.pageHead({ title: 'Alerts', sub: unread ? unread + ' unread' : 'You are all caught up',
        actions: unread ? html`<button type="button" class="btn btn--secondary btn--sm" data-act="all-read">${icon('check')}Mark all as read</button>` : '' })}
        ${items.length ? html`<div class="list">${items.map((n) => html`<button type="button" class="list-row alert-row ${n.read ? '' : 'is-unread'}" data-act="open" data-id="${n.id}">
            ${iconTile(n.kind === 'exam' ? 'calendar' : 'megaphone', n.kind === 'exam' ? 'accent' : '')}
            <span class="lr-main"><span class="lr-title">${n.title}</span><span class="lr-meta">${n.body}</span><span class="lr-note">${BP.ui.fmtRelative(n.createdAt)}</span></span>
            ${n.read ? '' : html`<span class="unread-dot" aria-label="Unread"></span>`}
          </button>`)}</div>`
          : BP.ui.emptyState({ icon: 'bell', title: 'No alerts yet', text: 'You will get an alert here when a new PSC application or exam is published.' })}`;
    },
    actions: {
      'all-read'(el, e, ctx) { markRead(ctx.user.id); BP.ui.toast('All alerts marked as read', { type: 'success' }); },
      open(el, e, ctx) {
        const n = BP.store.byId('inbox', el.dataset.id);
        markRead(ctx.user.id, [n.id]);
        BP.router.go(hrefFor(n).slice(1));
      },
    },
  });

  /* ---------- Push-style banner ---------- */
  let hideTimer = null;
  function showPush(n, more) {
    let root = document.getElementById('push-root');
    if (!root) { root = document.createElement('div'); root.id = 'push-root'; document.body.appendChild(root); }
    root.innerHTML = String(html`<div class="push" role="status">
      <a class="push-body" href="${hrefFor(n)}" data-push="${n.id}">
        <span class="push-app">${BP.ui.raw(BP.logoMark())}</span>
        <span class="grow"><span class="push-meta">BoodhamPSC · now${more ? ' · +' + more + ' more' : ''}</span><span class="push-title">${n.title}</span><span class="push-text">${n.body}</span></span>
      </a>
      <button type="button" class="icon-btn icon-btn--plain push-close" aria-label="Dismiss">${icon('x')}</button>
    </div>`);
    const el = root.firstElementChild;
    el.querySelector('.push-close').addEventListener('click', hide);
    el.querySelector('.push-body').addEventListener('click', () => { markRead(n.userId, [n.id]); hide(); });
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 7000);
  }
  function hide() {
    const el = document.querySelector('#push-root .push');
    if (!el) return;
    el.classList.add('is-leaving');
    setTimeout(() => { if (el.parentNode) el.remove(); }, 220);
  }

  /** On every User screen: show new alerts that have not been pushed yet. */
  function maybePush(ctx) {
    if (!ctx || !ctx.view || ctx.view.chrome !== 'user' || !ctx.user) return;
    const fresh = BP.store.state.inbox.filter((n) => n.userId === ctx.user.id && !n.pushed).sort((a, b) => b.createdAt - a.createdAt);
    if (!fresh.length) return;
    BP.store.update((s) => { s.inbox.forEach((n) => { if (n.userId === ctx.user.id) n.pushed = true; }); }, { silent: true });
    setTimeout(() => showPush(fresh[0], fresh.length - 1), 350);
  }
  BP.store.on('rendered', maybePush);

  /* Demo panel: send a push for the newest published notification to the logged-in user. */
  BP.demo.hooks.push = function () {
    const S = BP.store.session;
    if (S.userState() !== 'ok') { BP.ui.toast('Log in as a user first.'); return true; }
    const st = BP.store.state;
    const latest = st.applications.concat(st.exams).filter((n) => n.status === 'published').sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))[0];
    if (!latest) { BP.ui.toast('There is no published notification to send.'); return true; }
    const kind = st.applications.includes(latest) ? 'application' : 'exam';
    BP.store.update((s) => {
      s.inbox.push({ id: BP.store.uid('in'), userId: s.session.userId, kind, refId: latest.id,
        title: (kind === 'application' ? 'New PSC application: ' : 'Exam date: ') + latest.title,
        body: 'Simulated browser push. Tap to see the details.', createdAt: Date.now(), read: false, pushed: false });
    });
    const cur = BP.router.current;
    if (cur && cur.view.chrome === 'user') maybePush(cur.ctx);
    else BP.ui.toast('Push sent. Switch to the User view to see it.', { type: 'success' });
    return true;
  };

  BP.alerts = { maybePush };
})();
