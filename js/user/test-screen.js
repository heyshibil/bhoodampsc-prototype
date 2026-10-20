/* The one test screen, used for every test, plus review mode (same screen, second chance then feedback).
   Distraction-free: no app navigation. Timer is the main element. EN/ML toggle always visible.
   A question-progress panel is always on screen: on the right from 1024px, a compact strip above the question below that. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon } = BP.ui;
  const E = () => BP.engine;
  let T = null; // { attemptId, review, index, timers[], onKey, announced{} }

  const lang = () => BP.store.state.session.lang;
  const L = () => (lang() === 'ml' ? raw(' lang="ml"') : '');
  const attempt = () => E().get(T.attemptId);
  const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

  /** answered | skipped (left unanswered) | unvisited (still to do, including the one on screen); review: correct | wrong | skipped */
  function qState(a, q, k) {
    const ans = a.answers[q.id];
    if (T.review) {
      const reviewAns = a.reviewAnswers && a.reviewAnswers[q.id];
      return reviewAns == null ? 'unvisited' : reviewAns === q.correctIndex ? 'correct' : 'wrong';
    }
    if (ans != null) return 'answered';
    return a.visited.includes(q.id) && k !== curIndex(a) ? 'skipped' : 'unvisited';
  }
  function counts(a) {
    const c = { answered: 0, skipped: 0, unvisited: 0, correct: 0, wrong: 0 };
    a.snapshot.questions.forEach((q, k) => { c[qState(a, q, k)]++; });
    return c;
  }
  const STATE_LABEL = { answered: 'attempted', skipped: 'skipped', unvisited: 'not attempted yet', correct: 'correct', wrong: 'wrong' };
  const stateLabel = (st) => T.review && st === 'unvisited' ? 'not reviewed yet' : STATE_LABEL[st];
  const curIndex = (a) => (T.review ? T.index : a.current || 0);

  /* ---------- Rendering ---------- */
  function frame(ctx, a) {
    return html`<div class="ts ts--panel ${T.review ? 'ts--review' : ''}">
      <header class="ts-top">
        <div class="ts-brand">${raw(BP.logoMark())}<span class="ts-brand-title truncate">${a.snapshot.title}</span></div>
        ${T.review ? html`<div class="ts-title"><span class="t-h3">Review</span></div>`
          : html`<div class="timer" id="ts-timer"><span class="timer-ic">${icon('clock')}</span><span id="ts-time" class="t-num">--:--</span><span class="visually-hidden"> left</span></div>`}
        <div id="ts-lang">${langToggle()}</div>
      </header>
      <div class="ts-progress" aria-hidden="true"><span id="ts-bar"></span></div>
      <div class="ts-layout">
        <main id="main" class="ts-main">
          <p class="ts-path t-caption truncate">${a.snapshot.path.join(' › ')}</p>
          <div id="ts-body"></div>
        </main>
        <aside class="ts-panel" id="ts-panel" aria-label="${T.review ? 'Answer summary' : 'Question progress'}"></aside>
      </div>
      <footer class="ts-foot" id="ts-foot"></footer>
      <div class="visually-hidden" aria-live="assertive" id="ts-live"></div>
    </div>`;
  }
  const langToggle = () => BP.ui.segmented([{ value: 'en', label: 'EN' }, { value: 'ml', label: raw('<span lang="ml">മല</span>') }], lang(), { act: 'lang', label: 'Question language', size: 'sm' });

  function body(a) {
    const qs = a.snapshot.questions;
    const i = curIndex(a);
    const q = qs[i];
    const chosen = a.answers[q.id];
    const reviewChoice = a.reviewAnswers && a.reviewAnswers[q.id];
    const reviewed = T.review && reviewChoice != null;
    const st = qState(a, q, i);
    const l = lang();
    const opts = q[l].options.map((o, k) => {
      let cls = '', note = '';
      if (T.review) {
        if (reviewed) {
          if (k === q.correctIndex) { cls = 'is-correct'; note = 'Correct answer'; }
          else if (k === reviewChoice && k === chosen) { cls = 'is-wrong'; note = 'First answer · Current answer'; }
          else if (k === chosen) { cls = 'is-wrong'; note = 'First answer'; }
          else if (k === reviewChoice) { cls = 'is-selected'; note = 'Current review answer'; }
        }
      } else if (k === chosen) cls = 'is-selected';
      return html`<button type="button" class="opt ${cls}" role="radio" aria-checked="${String((T.review ? reviewChoice : chosen) === k)}" data-act="choose" data-i="${k}">
        <span class="opt-key">${BP.content.LETTERS[k]}</span><span class="opt-text"${L()}>${o}</span>
        ${note ? html`<span class="opt-note">${icon(cls === 'is-correct' ? 'check-circle' : 'x-circle')}${note}</span>` : ''}
      </button>`;
    });
    const reviewPill = { correct: ['success', 'Correct'], wrong: ['error', 'Wrong'], unvisited: ['neutral', 'To review'] }[st];
    return html`<div class="ts-qhead">
        <span class="t-label t-muted">Question ${i + 1} of ${qs.length}${q.subject ? ' · ' + q.subject : ''}</span>
        ${T.review ? html`<span class="row-wrap gap-2">${BP.ui.pill(reviewPill[0], reviewPill[1])}<span class="t-caption">Time spent ${fmtTime(a.questionTimeSec && a.questionTimeSec[q.id])}</span></span>` : html`<span class="saved" id="ts-saved" aria-live="polite"></span>`}
        <span class="grow"></span>
        ${T.review ? '' : html`<button type="button" class="btn btn--dark btn--sm ts-submit-inline" data-act="submit">${icon('send')}Submit</button>`}
      </div>
      <div class="ts-card">
        <p class="ts-qtext"${L()} id="ts-q">${q[l].text}</p>
        <div class="opts" role="radiogroup" aria-labelledby="ts-q">${opts}</div>
        ${T.review ? (reviewed ? html`<div class="review-feedback stack gap-3">
          <div class="row-wrap gap-2"><span class="review-answer ${chosen == null ? 'review-answer--warning' : chosen === q.correctIndex ? 'review-answer--correct' : 'review-answer--first'}"${L()}>First answer: ${chosen == null ? 'Skipped' : BP.content.LETTERS[chosen] + ' · ' + q[l].options[chosen]}</span>
            <span class="review-answer ${reviewChoice === q.correctIndex ? 'review-answer--correct' : 'review-answer--current'}"${L()}>Current review: ${BP.content.LETTERS[reviewChoice]} · ${q[l].options[reviewChoice]}</span>
            <span class="review-answer review-answer--correct"${L()}>Correct answer: ${BP.content.LETTERS[q.correctIndex]} · ${q[l].options[q.correctIndex]}</span></div>
          <div class="notice ${reviewChoice === q.correctIndex ? 'notice--success' : 'notice--info'}">${icon('lightbulb')}<span><b>Explanation</b><br><span${L()}>${q[l].explanation || 'No explanation was added for this question.'}</span></span></div>
        </div>` : html`<p class="t-caption review-hint">Choose an option to compare your first answer with this review answer and reveal the explanation.</p>`) : ''}
      </div>`;
  }

  function fmtTime(seconds) {
    if (seconds == null) return '—';
    const s = Math.max(0, Number(seconds) || 0);
    return s >= 60 ? Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's' : s + 's';
  }

  function foot(a) {
    const i = curIndex(a), n = a.snapshot.questions.length;
    if (T.review) {
      return html`<button type="button" class="btn btn--secondary" data-act="prev" ${i === 0 ? 'disabled' : ''}>${icon('arrow-left')}<span class="hide-xs">Previous</span></button>
        <a class="btn btn--ghost" href="#/user/attempt/${a.id}/result">Back to result</a>
        <button type="button" class="btn btn--primary" data-act="next" ${i === n - 1 ? 'disabled' : ''}><span class="hide-xs">Next</span>${icon('arrow-right')}</button>`;
    }
    return html`<button type="button" class="btn btn--secondary" data-act="prev" ${i === 0 ? 'disabled' : ''}>${icon('arrow-left')}<span class="hide-xs">Previous</span></button>
      <button type="button" class="btn btn--ghost" data-act="skip">Skip</button>
      ${i === n - 1 ? html`<button type="button" class="btn btn--primary" data-act="submit">Finish${icon('check')}</button>`
        : html`<button type="button" class="btn btn--primary" data-act="next">Next${icon('arrow-right')}</button>`}`;
  }

  /** The question-progress panel: counts, a proportion bar and every question as a jump button. */
  function panel(a) {
    const qs = a.snapshot.questions, n = qs.length, i = curIndex(a), c = counts(a);
    const stats = T.review
      ? [['correct', 'Correct', c.correct], ['wrong', 'Wrong', c.wrong], ['unvisited', 'To review', c.unvisited]]
      : [['answered', 'Attempted', c.answered], ['skipped', 'Skipped', c.skipped], ['unvisited', 'Remaining', c.unvisited]];
    return html`<div class="tp">
      <div class="tp-head">
        <h2 class="tp-title">${T.review ? 'Answer summary' : 'Your progress'}</h2>
        <span class="tp-sub t-num">${T.review ? c.correct + ' of ' + n + ' correct' : c.answered + ' of ' + n + ' attempted'}</span>
      </div>
      <div class="tp-stats" role="status" aria-live="polite">${stats.map((s) => html`<div class="tp-stat tp-stat--${s[0]}"><b class="t-num">${s[2]}</b><span>${s[1]}</span></div>`)}</div>
      <div class="tp-bar" aria-hidden="true">${stats.map((s) => (s[2] ? html`<span class="tp-seg tp-seg--${s[0]}" style="flex-grow:${s[2]}"></span>` : ''))}</div>
      ${qs.some((q) => q.subject) ? subjectGroups(qs).map((g) => html`<section class="tp-subject-group"><button type="button" class="tp-subject-title" data-act="jump" data-i="${g.start}">${g.title}<span>${g.items.length}</span></button><div class="tp-grid" role="group" aria-label="${g.title} questions">${g.items.map(({ q, k }) => {
        const st = qState(a, q, k);
        return html`<button type="button" class="pal pal--${st} ${k === i ? 'is-current' : ''}" data-act="jump" data-i="${k}" ${k === i ? raw('aria-current="step"') : ''} aria-label="Question ${k + 1}, ${stateLabel(st)}">${k + 1}</button>`;
      })}</div></section>`) : html`<div class="tp-grid" role="group" aria-label="Go to a question">${qs.map((q, k) => { const st = qState(a, q, k); return html`<button type="button" class="pal pal--${st} ${k === i ? 'is-current' : ''}" data-act="jump" data-i="${k}" ${k === i ? raw('aria-current="step"') : ''} aria-label="Question ${k + 1}, ${stateLabel(st)}">${k + 1}</button>`; })}</div>`}
      ${T.review ? '' : html`<button type="button" class="btn btn--dark btn--block tp-submit" data-act="submit">${icon('send')}Submit test</button>`}
    </div>`;
  }

  function subjectGroups(qs) {
    const groups = [];
    qs.forEach((q, k) => {
      const title = q.subject || 'Questions';
      let g = groups.find((x) => x.title === title);
      if (!g) { g = { title, start: k, items: [] }; groups.push(g); }
      g.items.push({ q, k });
    });
    return groups;
  }

  function draw() {
    const a = attempt();
    if (!a) return;
    document.getElementById('ts-body').innerHTML = String(body(a));
    document.getElementById('ts-foot').innerHTML = String(foot(a));
    document.getElementById('ts-panel').innerHTML = String(panel(a));
    const c = counts(a);
    const pct = T.review ? (curIndex(a) + 1) / a.snapshot.questions.length * 100 : c.answered / a.snapshot.questions.length * 100;
    document.getElementById('ts-bar').style.width = pct + '%';
    // Phones: keep the current question visible in the horizontal strip.
    const cur = document.querySelector('.tp-grid .is-current');
    const strip = cur && cur.closest('.tp-grid');
    if (cur && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2;
  }

  /* ---------- Timer, heartbeat, connection ---------- */
  function tick() {
    const a = attempt();
    if (!a) return;
    if (a.status !== 'in_progress') { toResult(a.id); return; }
    const left = Math.max(0, Math.ceil((a.expiresAt - Date.now()) / 1000));
    const t = document.getElementById('ts-timer');
    document.getElementById('ts-time').textContent = mmss(left);
    t.classList.toggle('is-warn', left <= 300 && left > 60);
    t.classList.toggle('is-danger', left <= 60);
    [[300, 'Five minutes left'], [60, 'One minute left']].forEach(([s, msg]) => {
      if (left <= s && left > s - 5 && !T.announced[s]) { T.announced[s] = true; document.getElementById('ts-live').textContent = msg; if (s === 300) BP.ui.toast(msg); }
    });
    if (left <= 0) { E().finalize(a.id, 'auto_submitted', 'time', { silent: true }); toResult(a.id); return; }
    if (E().isOffline(a.id)) {
      const g = E().graceLeft(a);
      const el = document.getElementById('ts-grace');
      if (el) el.textContent = mmss(g);
      if (g <= 0) { E().finalize(a.id, 'auto_submitted', 'away', { silent: true }); toResult(a.id); }
    }
  }
  function toResult(id) { BP.router.go('/user/attempt/' + id + '/result', null, { replace: true }); }

  function showOverlay() {
    const ts = document.querySelector('.ts');
    if (!ts || document.getElementById('ts-overlay')) return;
    const o = document.createElement('div');
    o.id = 'ts-overlay';
    o.className = 'ts-overlay';
    o.setAttribute('role', 'alertdialog');
    o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-labelledby', 'ts-ov-title');
    o.innerHTML = String(html`<div class="ts-overlay-card">
      <span class="spinner spinner--lg" aria-hidden="true"></span>
      <h2 class="t-h2" id="ts-ov-title">Reconnecting… <span id="ts-grace" class="t-num">1:00</span></h2>
      <p class="t-body t-muted">Your answers are saved. If the connection comes back before the countdown ends, you continue exactly where you left off. Otherwise the test is submitted with your saved answers.</p>
      <button type="button" class="btn btn--primary btn--block" data-act="reconnect">${icon('wifi')}Connection restored</button>
      <p class="t-caption">Demo button: simulates the internet coming back.</p>
    </div>`);
    ts.appendChild(o);
    o.querySelector('button').focus();
    tick();
  }

  /* ---------- Routes ---------- */
  function mountScreen(root, ctx, review) {
    const a = E().get(ctx.params.attemptId);
    document.body.classList.add('in-test');
    T.timers = [];
    if (!review) {
      tick();
      T.timers.push(setInterval(tick, 1000));
      T.timers.push(setInterval(() => E().beat(a.id), BP.store.state.settings.heartbeatSeconds * 1000));
      if (E().isOffline(a.id)) showOverlay();
    }
    draw();
    T.onKey = (e) => {
      if (document.querySelector('#overlay-root .overlay') || document.getElementById('ts-overlay')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
      if (!T.review && k in map) { choose(map[k]); e.preventDefault(); }
      if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
    };
    document.addEventListener('keydown', T.onKey);
  }
  function unmountScreen() {
    if (!T) return;
    (T.timers || []).forEach(clearInterval);
    document.removeEventListener('keydown', T.onKey);
    document.body.classList.remove('in-test');
  }

  function choose(k) {
    const a = attempt();
    const q = a.snapshot.questions[curIndex(a)];
    E().answer(a.id, q.id, a.answers[q.id] === k ? null : k); // tap again to clear
    draw();
    const s = document.getElementById('ts-saved');
    if (s) { s.innerHTML = BP.icon('check') + 'Saved'; s.classList.add('is-on'); clearTimeout(T.savedT); T.savedT = setTimeout(() => s.classList.remove('is-on'), 1600); }
  }
  function move(d) {
    const a = attempt();
    const n = a.snapshot.questions.length;
    const i = Math.min(n - 1, Math.max(0, curIndex(a) + d));
    goTo(i);
  }
  function goTo(i) {
    const a = attempt();
    if (T.review) T.index = i; else E().visit(a.id, i);
    draw();
    window.scrollTo(0, 0);
    const q = document.getElementById('ts-q'); if (q) { q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
  }

  function confirmSubmit() {
    const a = attempt();
    const c = counts(a);
    BP.ui.sheet({
      title: 'Submit your test?',
      body: html`<div class="stack gap-4">
        <div class="submit-counts">
          <div class="sc sc--answered"><b>${c.answered}</b><span>Attempted</span></div>
          <div class="sc sc--skipped"><b>${c.skipped}</b><span>Skipped</span></div>
          <div class="sc sc--unvisited"><b>${c.unvisited}</b><span>Remaining</span></div>
        </div>
        ${c.skipped + c.unvisited ? html`<div class="notice notice--warning">${icon('alert-triangle')}<span>${c.skipped + c.unvisited} ${c.skipped + c.unvisited === 1 ? 'question is' : 'questions are'} not answered. You cannot change answers after submitting.</span></div>`
          : html`<div class="notice notice--success">${icon('check-circle')}<span>You have answered every question.</span></div>`}
      </div>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Keep answering</button><button type="button" class="btn btn--primary" data-act="go">${icon('send')}Submit test</button>`,
      actions: { go(el, e, api) { api.close(true); E().finalize(a.id, 'submitted', null, { silent: true }); toResult(a.id); } },
    });
  }

  const actions = {
    choose(el) {
      const a = attempt(), q = a.snapshot.questions[curIndex(a)], value = Number(el.dataset.i);
      if (T.review) { E().reviewAnswer(a.id, q.id, value); draw(); }
      else choose(value);
    },
    prev() { move(-1); },
    next() { move(1); },
    skip() {
      const a = attempt();
      if (curIndex(a) === a.snapshot.questions.length - 1) confirmSubmit(); else move(1);
    },
    jump(el) { goTo(Number(el.dataset.i)); },
    submit: confirmSubmit,
    lang(el) { BP.store.session.setLang(el.dataset.value); document.getElementById('ts-lang').innerHTML = String(langToggle()); draw(); },
    reconnect() {
      E().reconnect();
      const o = document.getElementById('ts-overlay'); if (o) o.remove();
      BP.ui.toast('Connection restored. Your answers are safe.', { type: 'success' });
    },
  };

  BP.router.add('/user/attempt/:attemptId', {
    role: 'user', chrome: 'none', title: 'Test', rerender: false,
    render(ctx) {
      const a = E().get(ctx.params.attemptId);
      if (!a || a.userId !== ctx.user.id) return BP.views.notFound.render();
      if (a.status !== 'in_progress') { setTimeout(() => toResult(a.id)); return ''; }
      T = { attemptId: a.id, review: false, announced: {} };
      return frame(ctx, a);
    },
    mount(root, ctx) { const a = E().get(ctx.params.attemptId); if (a && a.status === 'in_progress') mountScreen(root, ctx, false); },
    unmount: unmountScreen,
    actions,
  });

  BP.router.add('/user/attempt/:attemptId/review', {
    role: 'user', chrome: 'none', title: 'Review', rerender: false,
    render(ctx) {
      const a = E().get(ctx.params.attemptId);
      if (!a || a.userId !== ctx.user.id || !a.result) return BP.views.notFound.render();
      T = { attemptId: a.id, review: true, index: Math.max(0, Math.min(a.snapshot.questions.length - 1, (Number(ctx.query.q) || 1) - 1)), announced: {} };
      return frame(ctx, a);
    },
    mount(root, ctx) { if (T && T.review) mountScreen(root, ctx, true); },
    unmount: unmountScreen,
    actions,
  });

  // Demo panel: simulate connection loss during a running test.
  BP.demo.hooks.connectionLoss = function () {
    if (!T || T.review) return false;
    const a = attempt();
    if (!a || a.status !== 'in_progress' || !document.querySelector('.ts')) return false;
    E().goOffline(a.id);
    showOverlay();
    return true;
  };
})();
