/* Shared pieces for User screens: page header with breadcrumb, access tags, test rows, formatting. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile, tag } = BP.ui;

  const isLocked = (item, user) => !!item.isPremium && !(user && user.isPremium);

  function accessTag(item, user) {
    if (!item.isPremium) return tag('free', 'Free');
    return isLocked(item, user) ? tag('premium', 'Premium', 'lock') : tag('premium', 'Premium', 'crown');
  }

  /** opts: { back, backLabel, title, crumbs[], sub, actions } */
  function pageHead(o) {
    return html`<div class="u-head">
      ${o.back ? html`<a class="link-btn u-back" href="${o.back}">${icon('arrow-left')}${o.backLabel || 'Back'}</a>` : ''}
      <div class="u-head-row">
        <div class="grow">
          ${o.crumbs && o.crumbs.length ? html`<nav class="crumbs" aria-label="You are here">${o.crumbs.map((c, i) => html`${i ? html`<span class="crumb-sep" aria-hidden="true">›</span>` : ''}<span>${c}</span>`)}</nav>` : ''}
          <h1 class="t-h1">${o.title}</h1>
          ${o.sub ? html`<p class="u-head-sub">${o.sub}</p>` : ''}
        </div>
        ${o.actions || ''}
      </div>
    </div>`;
  }

  const fmtMin = (m) => (m === 1 ? '1 min' : m + ' min');
  function fmtDuration(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m ? m + ' min ' + (s ? s + ' s' : '') : s + ' s';
  }
  const stageLabel = (s) => (s === 'prelims' ? 'Prelims' : s === 'mains' ? 'Mains' : '');
  const marksLabel = (m) => (m === 1 ? '1 mark each' : BP.scoring.fmt(m) + ' marks each');

  function testMeta(t) {
    return [t.questions.length + ' questions', fmtMin(t.durationMin), marksLabel(t.marksPerQuestion), t.negativeMarking ? 'Negative marking' : null].filter(Boolean).join(' · ');
  }

  /** A test in a list. Shows progress (in progress / best score) for the signed-in user. */
  function testRow(t, user) {
    const attempts = user ? BP.store.q.attemptsFor(user.id, t.id) : [];
    const live = attempts.find((a) => a.status === 'in_progress');
    const done = attempts.filter((a) => a.result);
    const best = done.length ? Math.max(...done.map((a) => a.result.score)) : null;
    const locked = isLocked(t, user);
    return html`<a class="list-row" href="#/user/test/${t.id}">
      ${iconTile(locked ? 'lock' : 'file-text', t.isPremium ? 'accent' : '')}
      <span class="lr-main">
        <span class="lr-title">${t.title}</span>
        <span class="lr-meta">${testMeta(t)}</span>
        <span class="row-wrap gap-2 lr-tags">${accessTag(t, user)}${live ? html`<span class="lr-note lr-note--warn">${icon('clock')}In progress</span>` : best != null ? html`<span class="lr-note lr-note--success">${icon('check-circle')}Best ${BP.scoring.fmt(best)} / ${BP.scoring.fmt(done[0].result.max)} · ${done.length} ${done.length === 1 ? 'attempt' : 'attempts'}</span>` : ''}</span>
      </span>
      ${raw(BP.icon('chevron-right', 'chev'))}
    </a>`;
  }

  /* ---------- Premium (css/premium.css) ---------- */
  /** The upgrade button: the standard pill in premium violet. opts: { act = 'upgrade', title, block, size } */
  const premiumCta = (opts) => {
    opts = opts || {};
    return html`<button type="button" class="btn btn--premium ${opts.block ? 'btn--block' : ''} ${opts.size ? 'btn--' + opts.size : ''}" data-act="${opts.act || 'upgrade'}">${icon('crown')}${opts.title || 'Go Premium'}</button>`;
  };
  /** Status for members: the product's premium tag. */
  const premiumBadge = (label) => tag('premium', label || 'Premium member', 'crown');

  /** Log out with the same confirm step everywhere (Profile, sidebar). */
  async function confirmLogout() {
    const ok = await BP.ui.confirm({ title: 'Log out?', body: 'You can log in again any time with your mobile number.', confirmLabel: 'Log out' });
    if (!ok) return;
    BP.store.session.logoutUser();
    BP.ui.toast('You have logged out');
    BP.router.go('/user/login');
  }

  function missingCard() {
    return BP.ui.emptyState({ icon: 'ghost', title: 'This section is not available', text: 'It may have been moved or hidden by the admin.', action: html`<a class="btn btn--secondary" href="#/user/home">${icon('home')}Go to Home</a>` });
  }

  BP.u = { isLocked, accessTag, pageHead, fmtMin, fmtDuration, stageLabel, marksLabel, testMeta, testRow, missingCard, premiumCta, premiumBadge, confirmLogout };
})();
