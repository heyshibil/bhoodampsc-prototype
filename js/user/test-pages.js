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
      const creatorRules = String(t.rules || '').split('\n').map((r) => r.trim()).filter(Boolean);
      return html`
        ${BP.u.pageHead({ back: backToList(t.cardId), backLabel: card ? card.title : 'Back', crumbs: path, title: t.title })}
        <div class="rules-layout">
          <div class="stack gap-4">
            <div class="stat-grid stat-grid--4 test-facts" role="group" aria-label="Test overview">
              ${infoTile('clock', 'Duration', BP.u.fmtMin(t.durationMin))}
              ${infoTile('list', 'Questions', t.questions.length)}
              ${infoTile('list', 'Marks each', fmt(t.marksPerQuestion))}
              ${infoTile('minus', 'Negative marking', neg ? '−' + neg : 'Off', neg ? 'error' : 'neutral')}
            </div>
            <section class="card instructions-card stack gap-4" aria-labelledby="instructions-title">
              <header class="instructions-head">
                <span class="instructions-icon" aria-hidden="true">${icon('list-checks')}</span>
                <div class="stack gap-1">
                  <span class="t-label instructions-kicker">BEFORE YOU BEGIN</span>
                  <h2 class="t-h2" id="instructions-title">General instructions</h2>
                  <p class="t-body-sm t-muted">Please review the guidance from your test creator.</p>
                </div>
              </header>
              ${creatorRules.length ? html`<ol class="rules-list">${creatorRules.map((r) => html`<li>${r}</li>`)}</ol>`
                : html`<div class="notice notice--info">${icon('info')}<span>No additional instructions were provided for this test.</span></div>`}
              <div class="instruction-notes" role="group" aria-label="Scoring and language options">
                <div class="instruction-note">${icon(t.negativeMarking ? 'minus' : 'check-circle')}<span>${t.negativeMarking ? 'Each wrong answer deducts ' + neg + ' mark. Unanswered questions do not lose marks.' : 'There is no negative marking in this test.'}</span></div>
                <div class="instruction-note">${icon('languages')}<span>Use the EN / <span lang="ml">മല</span> control during the test to switch question language.</span></div>
                <div class="instruction-note">${icon('clock')}<span>The timer cannot be paused after you start.</span></div>
              </div>
            </section>
          </div>
          <aside class="rules-side">
            ${locked ? html`<div class="card locked-card stack gap-4">
                ${iconTile('lock', 'accent', 'lg')}
                <div class="stack gap-2"><h2 class="t-h2">This is a Premium test</h2><p class="t-body-sm t-muted">Upgrade to unlock this test and every other premium test and paper.</p></div>
                ${BP.u.premiumCta({ block: true, title: 'Unlock with Premium' })}
              </div>`
              : html`<div class="card start-card stack gap-4">
                <div class="row-wrap gap-2">${BP.u.accessTag(t, user)}${t.sample ? tag('outline', 'Sample paper') : ''}</div>
                <div class="stack gap-1"><h2 class="t-h2">${live ? 'Continue your test' : other ? 'Test details' : 'Ready when you are'}</h2><p class="t-body-sm t-muted">Find a quiet place and allow enough time to finish.</p></div>
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
  BP.router.add('/user/attempt/:attemptId/result', {
    role: 'user', chrome: 'user', nav: 'home', title: 'Result',
    render(ctx) {
      const a = BP.engine.get(ctx.params.attemptId);
      if (!a || a.userId !== ctx.user.id) return BP.views.notFound.render();
      if (!a.result) { setTimeout(() => BP.router.go('/user/attempt/' + a.id, null, { replace: true })); return ''; }
      const r = a.result, s = a.snapshot;
      const test = BP.store.byId('tests', a.testId);
      const canRetake = test && test.status === 'published';
      const autoMsg = a.autoReason === 'away'
        ? 'Your test was submitted automatically because you were away for more than ' + BP.store.state.settings.reconnectSeconds + ' seconds. Your saved answers were kept.'
        : a.autoReason === 'time' ? 'Time ran out, so your test was submitted automatically with your saved answers.' : '';
      const attempted = r.correct + r.wrong;
      const n = s.questions.length;
      const accuracy = attempted ? Math.round(r.correct / attempted * 1000) / 10 : 0;
      const pct = (v) => (n ? (v / n * 100) : 0);
      const clock = (sec) => { sec = Math.max(0, Math.round(sec || 0)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
      const qTime = (q) => Number(a.questionTimeSec && a.questionTimeSec[q.id]) || 0;
      const rows = BP.testSections(a).map((g) => {
        const sc = BP.scoring.score(Object.assign({}, s, { questions: g.questions }), a.answers);
        const att = sc.correct + sc.wrong;
        return { title: g.title, score: sc.score, max: sc.max, att, n: g.questions.length, acc: att ? Math.round(sc.correct / att * 1000) / 10 : 0, time: g.questions.reduce((t, q) => t + qTime(q), 0) };
      });
      const single = rows.length === 1;
      const statTile = (ic, variant, value, sub, label) => html`<div class="rs-stat">${iconTile(ic, variant)}<div class="rs-stat-text"><span class="rs-stat-value t-num">${value}${sub ? html`<small> / ${sub}</small>` : ''}</span><span class="rs-stat-label">${label}</span></div></div>`;
      return html`
        ${BP.u.pageHead({ back: backToList(s.cardId), backLabel: 'Back to tests', crumbs: s.path, title: s.title, sub: (a.status === 'auto_submitted' ? 'Auto-submitted' : 'Submitted') + ' · ' + BP.ui.fmtRelative(a.submittedAt || a.startedAt) })}
        ${autoMsg ? html`<div class="notice notice--warning mb-4" role="status">${icon(a.autoReason === 'away' ? 'wifi-off' : 'clock')}<span><b>Submitted automatically.</b> ${autoMsg}</span></div>` : ''}
        <div class="result-layout">
          <section class="card rs-stats" aria-label="Your performance">
            ${statTile('award', 'accent', fmt(r.score), fmt(r.max), 'Score')}
            ${statTile('list-checks', 'primary', attempted, n, 'Attempted')}
            ${statTile('target', 'success', accuracy + '%', '', 'Accuracy')}
            ${statTile('clock', 'warning', BP.u.fmtDuration(r.timeTakenSec), BP.u.fmtMin(s.durationMin), 'Time taken')}
          </section>

          <section class="card stack gap-4" aria-labelledby="rs-breakdown">
            <div class="row-between"><h2 class="t-h3" id="rs-breakdown">Answer breakdown</h2><span class="t-caption">${s.negativeMarking ? '+' + fmt(s.marksPerQuestion) + ' correct · −' + fmt(s.negativeValue) + ' wrong' : '+' + fmt(s.marksPerQuestion) + ' correct · no negative marking'}</span></div>
            <div class="rs-bar" role="img" aria-label="${r.correct} correct, ${r.wrong} wrong, ${r.skipped} skipped">
              ${r.correct ? html`<span class="rs-bar-seg rs-bar-seg--correct" style="width:${pct(r.correct)}%"></span>` : ''}
              ${r.wrong ? html`<span class="rs-bar-seg rs-bar-seg--wrong" style="width:${pct(r.wrong)}%"></span>` : ''}
              ${r.skipped ? html`<span class="rs-bar-seg rs-bar-seg--skipped" style="width:${pct(r.skipped)}%"></span>` : ''}
            </div>
            <div class="rs-legend">
              <span><i class="rs-dot rs-dot--correct"></i>Correct <b class="t-num">${r.correct}</b></span>
              <span><i class="rs-dot rs-dot--wrong"></i>Wrong <b class="t-num">${r.wrong}</b>${s.negativeMarking && r.deducted ? html`<small class="t-num">(−${fmt(r.deducted)})</small>` : ''}</span>
              <span><i class="rs-dot rs-dot--skipped"></i>Skipped <b class="t-num">${r.skipped}</b></span>
            </div>
          </section>

          <section class="stack gap-3" aria-labelledby="rs-sections">
            <h2 class="t-h2" id="rs-sections">Sectional summary</h2>
            <div class="table-wrap rs-table-wrap"><table class="table table--stack rs-table">
              <thead><tr><th scope="col">Section</th><th scope="col">Score</th><th scope="col">Attempted</th><th scope="col">Accuracy</th><th scope="col">Time</th></tr></thead>
              <tbody>${rows.map((row) => html`<tr>
                <th scope="row" class="rs-sec-name">${row.title}</th>
                <td data-label="Score"><span class="rs-cell rs-cell--score"><b class="t-num">${fmt(row.score)}</b><small> / ${fmt(row.max)}</small></span></td>
                <td data-label="Attempted"><span class="rs-cell rs-cell--att"><b class="t-num">${row.att}</b><small> / ${row.n}</small></span></td>
                <td data-label="Accuracy"><span class="rs-cell rs-cell--acc"><b class="t-num">${row.acc}%</b></span></td>
                <td data-label="Time"><span class="rs-cell rs-cell--time"><b class="t-num">${clock(row.time)}</b>${single ? html`<small> / ${BP.u.fmtMin(s.durationMin)}</small>` : ''}</span></td>
              </tr>`)}</tbody>
            </table></div>
          </section>

          <div class="result-actions">
            <a class="btn btn--primary btn--lg" href="#/user/attempt/${a.id}/review">${icon('eye')}View solutions</a>
            ${canRetake ? html`<button type="button" class="btn btn--secondary btn--lg" data-act="retake">${icon('refresh')}Retake test</button>` : ''}
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
