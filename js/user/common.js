/* Shared pieces for User screens: page header with breadcrumb, access tags, test rows, formatting. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile, tag } = BP.ui;

  const isLocked = (item, user) => !!item.isPremium && !(user && user.isPremium);

  function accessTag(item, user) {
    if (!item.isPremium) return tag('free', 'Free');
    return isLocked(item, user) ? tag('premium', 'Premium', 'lock') : tag('premium', 'Premium', 'unlock');
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

  /** A test in a list (exam-series row): title, facts, the one action that fits its state, and a footer strip.
      States: start · unlock (premium) · resume (in progress) · solutions + result (attempted). */
  function testRow(t, user) {
    const attempts = user ? BP.store.q.attemptsFor(user.id, t.id) : [];
    const live = attempts.find((a) => a.status === 'in_progress');
    const done = attempts.filter((a) => a.result);
    const latest = done[0];
    const best = done.length ? Math.max(...done.map((a) => a.result.score)) : null;
    const max = latest ? latest.result.max : 0;
    const locked = isLocked(t, user);
    const fmtS = BP.scoring.fmt;
    let cta;
    if (live) cta = html`<a class="btn btn--primary btn--sm" href="#/user/attempt/${live.id}">${icon('timer')}Resume</a>`;
    else if (locked) cta = html`<a class="btn btn--secondary btn--sm test-row-unlock" href="#/user/test/${t.id}">${icon('lock')}Unlock</a>`;
    else if (latest) cta = html`<a class="btn btn--secondary btn--sm" href="#/user/attempt/${latest.id}/review">Solutions</a><a class="btn btn--secondary btn--sm" href="#/user/attempt/${latest.id}/result">Result</a>`;
    else cta = html`<a class="btn btn--primary btn--sm" href="#/user/test/${t.id}">Start${icon('arrow-right')}</a>`;
    return html`<article class="test-row ${latest ? 'is-attempted' : ''}">
      <div class="test-row-body">
        <div class="test-row-main">
          <div class="test-row-head">
            <a class="test-row-title" href="#/user/test/${t.id}">${t.title}</a>
            ${accessTag(t, user)}
          </div>
          <div class="test-row-meta">
            <span>${icon('help-circle')}${t.questions.length} Questions</span>
            <span>${icon('file-text')}${fmtS(t.questions.length * t.marksPerQuestion)} Marks</span>
            <span>${icon('clock')}${t.durationMin} Mins</span>
          </div>
          ${live ? html`<span class="lr-note lr-note--warn">${icon('clock')}In progress · ${Math.max(0, Math.ceil((live.expiresAt - Date.now()) / 60000))} min left</span>`
            : latest ? html`<span class="test-row-score">${icon('award')}Best <b class="t-num">${fmtS(best)} / ${fmtS(max)}</b> · ${done.length} ${done.length === 1 ? 'attempt' : 'attempts'}</span>` : ''}
        </div>
        <div class="test-row-cta">${cta}</div>
      </div>
      <div class="test-row-foot">
        <span>${icon('languages')}English, <span lang="ml">മലയാളം</span></span>
        <span>${t.negativeMarking ? '−' + fmtS(t.negativeValue) + ' per wrong answer' : 'No negative marking'}</span>
        ${latest ? html`<span class="test-row-when">Attempted ${BP.ui.fmtRelative(latest.submittedAt || latest.startedAt)}</span>` : ''}
      </div>
      ${latest && max ? html`<span class="test-row-bar" style="width:${Math.max(2, Math.min(100, best / max * 100))}%" aria-hidden="true"></span>` : ''}
    </article>`;
  }

  /* ---------- Premium (css/premium.css) ---------- */
  /** The premium access action. opts: { act = 'upgrade', title, block, size } */
  const premiumCta = (opts) => {
    opts = opts || {};
    return html`<button type="button" class="btn btn--premium ${opts.block ? 'btn--block' : ''} ${opts.size ? 'btn--' + opts.size : ''}" data-act="${opts.act || 'upgrade'}">${icon('unlock')}${opts.title || 'Premium access'}</button>`;
  };
  /** Status for members: the product's premium tag. */
  const premiumBadge = (label) => tag('premium', label || 'Premium member', 'unlock');

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
