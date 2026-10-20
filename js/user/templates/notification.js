/* Flow template: Notification. Card -> Application / Exam tabs -> list -> detail page. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile, tag } = BP.ui;
  const fmt = (d) => BP.ui.fmtDate(d);
  const daysUntil = (d) => -BP.content.caAge(d);

  function deadlineTag(n) {
    const d = daysUntil(n.lastDate);
    if (d < 0) return tag('neutral', 'Closed');
    if (d === 0) return tag('error', 'Closes today');
    if (d <= 7) return tag('warning', 'Closes in ' + d + (d === 1 ? ' day' : ' days'));
    return tag('success', 'Open');
  }
  function examTag(n) {
    const d = daysUntil(n.startDate);
    if (daysUntil(n.endDate) < 0) return tag('neutral', 'Completed');
    if (d <= 0) return tag('warning', 'Ongoing');
    return tag('primary', 'In ' + d + (d === 1 ? ' day' : ' days'));
  }
  const examDates = (n) => (n.startDate === n.endDate ? fmt(n.startDate) : fmt(n.startDate) + ' to ' + fmt(n.endDate));

  function row(n, kind) {
    const isApp = kind === 'application';
    return html`<a class="list-row" href="#/user/notice/${kind}/${n.id}">
      ${iconTile(isApp ? 'megaphone' : 'calendar', isApp ? '' : 'accent')}
      <span class="lr-main">
        <span class="lr-title">${n.title}</span>
        <span class="lr-meta">${isApp ? 'Last date ' + fmt(n.lastDate) + ' · ' + n.qualification : 'Exam ' + examDates(n)}</span>
        <span class="row-wrap gap-2 lr-tags">${isApp ? deadlineTag(n) : examTag(n)}${n.sample ? tag('outline', 'Sample') : ''}</span>
      </span>
      ${raw(BP.icon('chevron-right', 'chev'))}
    </a>`;
  }

  BP.templates = BP.templates || {};
  BP.templates.notification = {
    render(card, section, ctx) {
      const tab = ctx.query.tab === 'exam' ? 'exam' : 'application';
      const apps = BP.store.q.noticesFor(card.id, 'application');
      const exams = BP.store.q.noticesFor(card.id, 'exam');
      const list = tab === 'exam' ? exams : apps;
      return html`
        ${BP.u.pageHead({ back: '#/user/home', backLabel: 'Home', crumbs: [section.title], title: card.title })}
        <div class="filters">${BP.ui.segmented([
          { value: 'application', label: 'Applications', count: apps.length },
          { value: 'exam', label: 'Exams', count: exams.length },
        ], tab, { act: 'tab', label: 'Notification type' })}</div>
        ${list.length ? html`<div class="list">${list.map((n) => row(n, tab))}</div>`
          : BP.ui.emptyState({ icon: 'bell', title: tab === 'exam' ? 'No exams announced yet' : 'No open applications yet', text: 'New notifications appear here, and you will get an alert.' })}
        <p class="t-caption mt-6">Sample notifications for the prototype. Always confirm details on the official Kerala PSC website.</p>`;
    },
    actions: {
      tab(el, e, ctx) { BP.router.go(ctx.path, { tab: el.dataset.value }, { replace: true }); },
    },
  };

  /* Detail page (also opened from alerts) */
  BP.router.add('/user/notice/:kind/:id', {
    role: 'user', chrome: 'user', nav: 'home',
    title: (ctx) => (ctx.params.kind === 'exam' ? 'PSC exam' : 'PSC application'),
    render(ctx) {
      const kind = ctx.params.kind === 'exam' ? 'exam' : 'application';
      const n = BP.store.byId(kind === 'exam' ? 'exams' : 'applications', ctx.params.id);
      if (!n || n.status !== 'published') {
        return BP.ui.emptyState({ icon: 'bell', title: 'This notification is no longer available', text: 'It may have been withdrawn.', action: html`<a class="btn btn--secondary" href="#/user/alerts">Back to alerts</a>` });
      }
      const card = BP.store.byId('cards', n.cardId);
      const back = card ? '#/user/card/' + card.id + (kind === 'exam' ? '?tab=exam' : '') : '#/user/home';
      const facts = kind === 'application'
        ? [['Qualification', n.qualification], ['Last date to apply', fmt(n.lastDate)], ['Vacancies', n.vacancy], ['Extra qualifications', n.extraQualifications], ['Exam stage', n.stage]]
        : [['Exam starts', fmt(n.startDate)], ['Exam ends', fmt(n.endDate)]];
      return html`
        ${BP.u.pageHead({ back, backLabel: card ? card.title : 'Home', crumbs: [kind === 'exam' ? 'PSC exam' : 'PSC application'], title: n.title })}
        <div class="notice-detail">
          <div class="card card--hero stack gap-3">
            <div class="row-wrap gap-2">${kind === 'application' ? deadlineTag(n) : examTag(n)}${n.sample ? tag('outline', 'Sample') : ''}</div>
            <p class="t-body">${kind === 'application' ? 'Apply before ' + fmt(n.lastDate) + '.' : 'Exam ' + examDates(n) + '.'}</p>
          </div>
          <dl class="facts card">${facts.filter((f) => f[1]).map(([k, v]) => html`<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
          ${n.otherDetails ? html`<div class="card stack gap-2"><h2 class="t-h3">Other details</h2><p class="t-body pre-line">${n.otherDetails}</p></div>` : ''}
          ${n.officialLink ? html`<a class="btn btn--primary btn--lg" href="${n.officialLink}" target="_blank" rel="noopener noreferrer">${icon('external-link')}Open the official notification<span class="visually-hidden"> (opens in a new tab)</span></a>` : ''}
          <p class="t-caption">Sample notification for the prototype. Always confirm details on the official Kerala PSC website.</p>
        </div>`;
    },
    mount(root, ctx) {
      const u = ctx.user;
      const unread = BP.store.state.inbox.filter((i) => i.userId === u.id && i.refId === ctx.params.id && !i.read);
      // Opening an item marks its alerts read; refresh once so the bell badge updates.
      if (unread.length) {
        BP.store.update((s) => { s.inbox.forEach((i) => { if (i.userId === u.id && i.refId === ctx.params.id) i.read = true; }); }, { silent: true });
        setTimeout(() => BP.router.refresh());
      }
    },
  });
})();
