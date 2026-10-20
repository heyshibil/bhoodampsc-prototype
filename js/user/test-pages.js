/* Rules page (before a test) and Result page (after). Same pages for every test. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile, tag } = BP.ui;
  const fmt = BP.scoring.fmt;

  function infoTile(ic, label, value, variant) {
    return html`<div class="stat stat--compact"><div class="stat-head">${iconTile(ic, variant || '', 'sm')}<span class="stat-label">${label}</span></div><span class="t-h2">${value}</span></div>`;
  }
  function backToList(cardId) { return BP.store.byId('cards', cardId) ? '#/user/card/' + cardId : '#/user/home'; }

  /* ---------- Rules ---------- */
  BP.router.add('/user/test/:testId', {
    role: 'user', chrome: 'user', nav: 'home',
    title: (ctx) => { const t = BP.store.byId('tests', ctx.params.testId); return t ? t.title : 'Test'; },
    render(ctx) {
      const t = BP.store.byId('tests', ctx.params.testId);
      if (!t || t.status !== 'published') return BP.ui.emptyState({ icon: 'file-text', title: 'This test is not available', text: 'It may have been withdrawn by the admin.', action: html`<a class="btn btn--secondary" href="#/user/home">Go to Home</a>` });
      const user = ctx.user;
      const locked = BP.u.isLocked(t, user);
      const live = BP.engine.inProgress(user.id, t.id);
      const other = !live && BP.engine.inProgress(user.id);
      const past = BP.store.q.attemptsFor(user.id, t.id).filter((a) => a.result);
      const path = BP.content.testPath(t);
      const card = BP.store.byId('cards', t.cardId);
      const neg = t.negativeMarking ? fmt(t.negativeValue) : null;
      return html`
        ${BP.u.pageHead({ back: backToList(t.cardId), backLabel: card ? card.title : 'Back', crumbs: path, title: t.title })}
        <div class="rules-layout">
          <div class="stack gap-4">
            <div class="stat-grid stat-grid--4">
              ${infoTile('clock', 'Duration', BP.u.fmtMin(t.durationMin))}
              ${infoTile('list', 'Questions', t.questions.length)}
              ${infoTile('award', 'Marks each', fmt(t.marksPerQuestion))}
              ${infoTile('minus', 'Negative marking', neg ? '−' + neg : 'Off', neg ? 'error' : 'neutral')}
            </div>
            <div class="card stack gap-3">
              <h2 class="t-h3">Before you start</h2>
              <ul class="rules-list">
                ${t.rules.split('\n').filter((r) => r.trim()).map((r) => html`<li>${r}</li>`)}
                <li>${t.negativeMarking ? 'Each wrong answer deducts ' + neg + ' mark. Skipped questions do not lose marks.' : 'There is no negative marking in this test.'}</li>
                <li>Switch between English and Malayalam at any time with the EN / <span lang="ml">മല</span> button.</li>
                <li>There is no pause. Once you start, the timer keeps running.</li>
              </ul>
            </div>
          </div>
          <aside class="rules-side">
            ${locked ? html`<div class="card locked-card stack gap-4">
                ${iconTile('lock', 'accent', 'lg')}
                <div class="stack gap-2"><h2 class="t-h2">This is a Premium test</h2><p class="t-body-sm t-muted">Upgrade to unlock this test and every other premium test and paper.</p></div>
                ${BP.u.premiumCta({ block: true, title: 'Unlock with Premium' })}
              </div>`
              : html`<div class="card start-card stack gap-4">
                <div class="row-wrap gap-2">${BP.u.accessTag(t, user)}${t.sample ? tag('outline', 'Sample paper') : ''}</div>
                ${other ? html`<div class="notice notice--warning">${icon('alert-triangle')}<span>You have another test in progress. <a href="#/user/attempt/${other.id}">Resume it</a> or let it finish first.</span></div>` : ''}
                ${live ? html`<button type="button" class="btn btn--hero btn--lg btn--block" data-act="resume" data-id="${live.id}">${icon('timer')}Resume test</button>
                    <p class="t-caption">${Math.max(0, Math.ceil((live.expiresAt - Date.now()) / 60000))} min left on your timer.</p>`
                  : html`<button type="button" class="btn btn--hero btn--lg btn--block" data-act="start" ${other ? 'disabled' : ''}>Start test${icon('arrow-right')}</button>
                    <p class="t-caption">The timer starts as soon as you tap Start.</p>`}
              </div>`}
            ${past.length ? html`<div class="card stack gap-3">
              <h2 class="t-h3">Your attempts</h2>
              <div class="list list--divided">${past.slice(0, 4).map((a) => html`<a class="list-row list-row--compact" href="#/user/attempt/${a.id}/result">
                <span class="lr-main"><span class="lr-title t-num">${fmt(a.result.score)} / ${fmt(a.result.max)}</span><span class="lr-meta">${BP.ui.fmtRelative(a.startedAt)}${a.status === 'auto_submitted' ? ' · auto-submitted' : ''}</span></span>
                ${icon('chevron-right', 'chev')}</a>`)}</div>
            </div>` : ''}
          </aside>
        </div>`;
    },
    actions: {
      upgrade() { BP.premium.upgrade({ reason: 'This test is for Premium members.', doneLabel: 'Start practising' }); },
      start(el, e, ctx) {
        const id = BP.engine.start(ctx.params.testId, ctx.user.id);
        BP.router.go('/user/attempt/' + id, null, { replace: true });
      },
      resume(el) { BP.router.go('/user/attempt/' + el.dataset.id); },
    },
  });

  /* ---------- Result ---------- */
  function ring(pct) {
    const r = 52, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
    return BP.ui.raw(`<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" class="ring-track"/><circle cx="60" cy="60" r="${r}" class="ring-fill" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/></svg>`);
  }

  BP.router.add('/user/attempt/:attemptId/result', {
    role: 'user', chrome: 'user', nav: 'home', title: 'Result',
    render(ctx) {
      const a = BP.engine.get(ctx.params.attemptId);
      if (!a || a.userId !== ctx.user.id) return BP.views.notFound.render();
      if (!a.result) { setTimeout(() => BP.router.go('/user/attempt/' + a.id, null, { replace: true })); return ''; }
      const r = a.result, s = a.snapshot;
      const pct = r.max ? Math.round(Math.max(0, r.score) / r.max * 100) : 0;
      const test = BP.store.byId('tests', a.testId);
      const canRetake = test && test.status === 'published';
      const autoMsg = a.autoReason === 'away'
        ? 'Your test was submitted automatically because you were away for more than ' + BP.store.state.settings.reconnectSeconds + ' seconds. Your saved answers were kept.'
        : a.autoReason === 'time' ? 'Time ran out, so your test was submitted automatically with your saved answers.' : '';
      const mood = pct >= 75 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!';
      return html`
        ${BP.u.pageHead({ back: backToList(s.cardId), backLabel: 'Back to tests', crumbs: s.path, title: s.title })}
        ${autoMsg ? html`<div class="notice notice--warning mb-4" role="status">${icon(a.autoReason === 'away' ? 'wifi-off' : 'clock')}<span><b>Submitted automatically.</b> ${autoMsg}</span></div>` : ''}
        <div class="result-layout">
          <div class="card card--hero result-hero">
            <div class="ring-wrap">${ring(pct)}<div class="ring-label"><span class="t-display t-num">${fmt(r.score)}</span><span class="t-caption">out of ${fmt(r.max)}</span></div></div>
            <div class="stack gap-2">
              <span class="tag tag--outline self-start">${a.status === 'auto_submitted' ? 'Auto-submitted' : 'Submitted'} · ${BP.ui.fmtRelative(a.submittedAt || a.startedAt)}</span>
              <h2 class="t-h2">${mood}</h2>
              <p class="t-body-sm t-muted">${s.negativeMarking ? r.correct + ' correct × ' + fmt(s.marksPerQuestion) + ' = ' + fmt(r.gained) + ', minus ' + r.wrong + ' wrong × ' + fmt(s.negativeValue) + ' = ' + fmt(r.deducted) + '.' : 'No negative marking in this test.'}</p>
            </div>
          </div>
          <div class="stat-grid stat-grid--4">
            ${infoTile('check-circle', 'Correct', r.correct, 'success')}
            ${infoTile('x-circle', 'Wrong', r.wrong, 'error')}
            ${infoTile('minus', 'Skipped', r.skipped, 'warning')}
            ${infoTile('clock', 'Time taken', BP.u.fmtDuration(r.timeTakenSec))}
          </div>
          <div class="result-actions">
            <a class="btn btn--primary btn--lg" href="#/user/attempt/${a.id}/review">${icon('eye')}Review answers</a>
            ${canRetake ? html`<button type="button" class="btn btn--dark btn--lg" data-act="retake">${icon('refresh')}Retake test</button>` : ''}
            <a class="btn btn--ghost btn--lg" href="#/user/profile">Attempt history</a>
          </div>
        </div>`;
    },
    actions: {
      retake(el, e, ctx) {
        const a = BP.engine.get(ctx.params.attemptId);
        const t = BP.store.byId('tests', a.testId);
        // Locked (premium lapsed) or another test running: go via the rules page, which explains why.
        if (BP.u.isLocked(t, ctx.user) || BP.engine.inProgress(ctx.user.id)) { BP.router.go('/user/test/' + a.testId); return; }
        const id = BP.engine.start(a.testId, ctx.user.id);
        BP.router.go('/user/attempt/' + id);
      },
    },
  });
})();
