/* The one test screen, used for every test, plus review mode (same screen, second chance then feedback).
   Distraction-free: no app navigation. Timer is the main element. EN/ML toggle always visible.
   Question progress stays in a desktop side panel and opens as a drawer on smaller screens.
   Layout follows the exam-interface pattern aspirants know: question column, status palette with
   shaped markers (shape + colour, never colour alone), section tabs when a test has several subjects. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon } = BP.ui;
  const E = () => BP.engine;
  let T = null; // { attemptId, review, index, section, timers[], onKey, announced{}, revealed{} }

  const lang = () => BP.store.state.session.lang;
  const L = () => (lang() === 'ml' ? raw(' lang="ml"') : '');
  const attempt = () => E().get(T.attemptId);
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  /** Clock format for time left: h:mm:ss from an hour up, mm:ss below. */
  const clock = (s) => (s >= 3600 ? Math.floor(s / 3600) + ':' + mmss(s % 3600) : mmss(s));

  /* ---------- Sections: any test whose questions carry more than one subject gets section tabs ---------- */
  function sectionList(a) {
    const out = [];
    a.snapshot.questions.forEach((q) => { if (q.subject && !out.includes(q.subject)) out.push(q.subject); });
    return out;
  }
  const hasSections = (a) => sectionList(a).length > 1;
  const sectionForQuestion = (q) => q.subject || null;

  /* ---------- Review helpers ---------- */
  function reviewCategory(a, q) {
    const chosen = a.answers[q.id];
    return chosen == null ? 'unattempted' : chosen === q.correctIndex ? 'correct' : 'incorrect';
  }
  function questionTime(a, q) { return Math.max(0, Number(a.questionTimeSec && a.questionTimeSec[q.id]) || 0); }
  /* Stable per-question number from its id, for demo aggregates the server will provide later. */
  function seeded(q, min, max) {
    let h = 7;
    for (const ch of String(q.id)) h = (h * 31 + ch.charCodeAt(0)) % 100003;
    return min + (h % (max - min + 1));
  }
  /** Average time all aspirants spent on this question (seconds). Demo value until real aggregates exist. */
  const avgTime = (q) => (q.avgTimeSec != null ? q.avgTimeSec : seeded(q, 18, 75));
  /** Speed against the average. Unanswered questions have no speed. */
  function reviewSpeed(a, q) {
    if (reviewCategory(a, q) === 'unattempted') return null;
    const avg = Math.max(1, avgTime(q));
    const spent = questionTime(a, q);
    if (spent <= avg * 0.5) return 'superfast';
    if (spent > avg * 1.25) return 'slow';
    return 'on-time';
  }
  const SPEEDS = [
    ['superfast', 'Superfast', 'speed-fast'],
    ['on-time', 'On time', 'speed-ontime'],
    ['slow', 'Slow', 'speed-slow'],
  ];
  function speedCounts(a) {
    const out = { superfast: 0, 'on-time': 0, slow: 0 };
    a.snapshot.questions.forEach((q) => { const s = reviewSpeed(a, q); if (s) out[s]++; });
    return out;
  }
  /** Questions you can move through: the whole test (every section), narrowed only by the review filter.
      Next / Previous therefore run across sections, and the section tab follows the current question. */
  function visibleIndexes(a) {
    return a.snapshot.questions.reduce((out, q, i) => {
      if (!T.review || !T.filters || T.filters[reviewCategory(a, q)]) out.push(i);
      return out;
    }, []);
  }

  /** Question states.
      Test: answered | notanswered (visited, no answer) | marked | marked-answered | unvisited.
      Review: correct | incorrect | unattempted (from the original attempt). */
  function qState(a, q, k) {
    if (T.review) return reviewCategory(a, q);
    const ans = a.answers[q.id];
    const marked = (a.markedQuestions || []).includes(q.id);
    if (marked) return ans != null ? 'marked-answered' : 'marked';
    if (ans != null) return 'answered';
    return a.visited.includes(q.id) && k !== curIndex(a) ? 'notanswered' : 'unvisited';
  }
  function counts(a, indexes) {
    const c = { answered: 0, notanswered: 0, marked: 0, 'marked-answered': 0, unvisited: 0, correct: 0, incorrect: 0, unattempted: 0 };
    const qs = a.snapshot.questions;
    (indexes || qs.map((q, k) => k)).forEach((k) => { c[qState(a, qs[k], k)]++; });
    return c;
  }
  const STATE_LABEL = { answered: 'answered', notanswered: 'not answered', marked: 'marked for review', 'marked-answered': 'answered and marked for review', unvisited: 'not visited', correct: 'correct', incorrect: 'incorrect', unattempted: 'unattempted' };
  const curIndex = (a) => (T.review ? T.index : a.current || 0);
  const answeredCount = (c) => c.answered + c['marked-answered'];

  /* ---------- Rendering ---------- */
  function frame(ctx, a) {
    return html`<div class="ts ts--panel ${T.review ? 'ts--review' : ''}">
      <header class="ts-top">
        <div class="ts-brand">${raw(BP.logoMark())}<span class="ts-brand-text"><span class="ts-brand-kicker">${T.review ? 'Solutions' : 'Test'}</span><span class="ts-brand-title truncate">${a.snapshot.title}</span></span></div>
        ${T.review ? html`<div class="ts-title"><span class="ts-review-label">${icon('eye')}Review</span></div>`
          : html`<div class="timer" id="ts-timer" role="timer"><span class="timer-ic">${icon('clock')}</span><span class="timer-caption">Time left</span><span id="ts-time" class="t-num">--:--</span><span class="visually-hidden"> left</span></div>`}
        <button type="button" class="icon-btn ts-progress-trigger" data-act="toggle-progress" aria-label="${T.review ? 'Open answer summary' : 'Open question palette, question ' + (curIndex(a) + 1) + ' of ' + a.snapshot.questions.length}" aria-expanded="false" aria-controls="ts-panel">${icon('layout')}<span class="ts-progress-count">${curIndex(a) + 1}/${a.snapshot.questions.length}</span></button>
        <div id="ts-lang">${langToggle()}</div>
      </header>
      <div class="ts-progress" aria-hidden="true"><span id="ts-bar"></span></div>
      <div class="ts-layout">
        <main id="main" class="ts-main">
          <div id="ts-sections"></div>
          <div id="ts-body"></div>
        </main>
        <button type="button" class="ts-progress-backdrop" id="ts-progress-backdrop" data-act="close-progress" aria-label="Close question palette"></button>
        <aside class="ts-panel" id="ts-panel" role="complementary" aria-label="${T.review ? 'Answer summary' : 'Question palette'}" aria-hidden="true"></aside>
      </div>
      <footer class="ts-foot" id="ts-foot"></footer>
      <div class="visually-hidden" aria-live="assertive" id="ts-live"></div>
    </div>`;
  }
  const langToggle = () => BP.ui.segmented([{ value: 'en', label: 'EN' }, { value: 'ml', label: raw('<span lang="ml">മല</span>') }], lang(), { act: 'lang', label: 'Question language', size: 'sm' });

  function sections(a) {
    const path = html`<p class="ts-path t-caption truncate">${a.snapshot.path.join(' › ')}</p>`;
    if (!hasSections(a)) return path;
    const list = sectionList(a);
    const active = T.section || sectionForQuestion(a.snapshot.questions[curIndex(a)]);
    return html`${path}<nav class="ts-sections" aria-label="Test sections">
      <span class="ts-sections-label">Sections</span>
      ${list.map((title) => {
        const n = a.snapshot.questions.filter((q) => q.subject === title).length;
        return html`<button type="button" class="ts-section-tab ${active === title ? 'is-active' : ''}" aria-pressed="${String(active === title)}" data-act="section" data-value="${title}">${title}<span class="t-num">${n}</span></button>`;
      })}
    </nav>`;
  }

  function body(a) {
    const qs = a.snapshot.questions;
    const i = curIndex(a);
    if (T.review && !visibleIndexes(a).length) return html`<div class="card review-empty"><h2 class="t-h3">No questions match these filters</h2><p class="t-body-sm t-muted">Choose another section or change the filter to continue.</p></div>`;
    const q = qs[i];
    const l = lang();
    return T.review ? reviewBody(a, q, i, l) : testBody(a, q, i, l);
  }

  function testBody(a, q, i, l) {
    const chosen = a.answers[q.id];
    const opts = q[l].options.map((o, k) => html`<button type="button" class="opt ${k === chosen ? 'is-selected' : ''}" role="radio" aria-checked="${String(chosen === k)}" data-act="choose" data-i="${k}">
        <span class="opt-key">${BP.content.LETTERS[k]}</span><span class="opt-text"${L()}>${o}</span></button>`);
    return html`<div class="ts-qhead">
        <div class="ts-question-index"><span class="ts-qno">Question ${i + 1}</span><span class="t-caption t-muted">of ${a.snapshot.questions.length}</span></div>
        <span class="saved" id="ts-saved" aria-live="polite"></span>
        <span class="grow"></span>
        <div class="ts-question-marks" aria-label="Marks for this question">
          <span class="ts-marks-label">Marks</span>
          <span class="ts-mark ts-mark--plus" title="For a correct answer">+${BP.scoring.fmt(a.snapshot.marksPerQuestion)}</span>
          ${a.snapshot.negativeMarking ? html`<span class="ts-mark ts-mark--minus" title="For a wrong answer">−${BP.scoring.fmt(a.snapshot.negativeValue)}</span>` : ''}
        </div>
        <button type="button" class="btn btn--secondary btn--sm ts-submit-inline" data-act="submit">${icon('send')}Submit</button>
      </div>
      <div class="ts-card">
        <p class="ts-qtext"${L()} id="ts-q">${q[l].text}</p>
        <div class="opts" role="radiogroup" aria-labelledby="ts-q">${opts}</div>
        <p class="ts-answer-hint">${icon('check-circle')}Answers save automatically. Tap a chosen answer again or use Clear response to remove it.</p>
      </div>`;
  }

  function reviewBody(a, q, i, l) {
    const chosen = a.answers[q.id];
    const reAns = a.reviewAnswers ? a.reviewAnswers[q.id] : undefined;
    const reattempting = T.reattempt && reAns == null && !T.revealed[q.id];
    const st = reviewCategory(a, q);
    const speed = reviewSpeed(a, q);
    const speedMeta = SPEEDS.find((s) => s[0] === speed);
    const scoreLabel = st === 'correct' ? '+' + BP.scoring.fmt(a.snapshot.marksPerQuestion) : st === 'incorrect' && a.snapshot.negativeMarking ? '−' + BP.scoring.fmt(a.snapshot.negativeValue) : '0';
    /* Answer states (see css/test.css "Review answer states"):
       right answer → green ✓ · re-attempt (if wrong) → solid red ↻ · first attempt (if wrong):
       with re-attempt mode on, a plain row with a red ✕ and a "Your first attempt" tag; with it off, solid red ✕.
       Nothing is marked while the question is being re-attempted. */
    const modeOn = !!T.reattempt;
    const opts = q[l].options.map((o, k) => {
      if (reattempting) {
        return html`<button type="button" class="opt" role="radio" aria-checked="false" data-act="reattempt-choose" data-i="${k}">
          <span class="opt-key">${BP.content.LETTERS[k]}</span><span class="opt-text"${L()}>${o}</span></button>`;
      }
      const isRight = k === q.correctIndex;
      const isFirst = k === chosen;
      const isRe = modeOn && reAns != null && k === reAns;
      let cls = 'is-plain', key = BP.content.LETTERS[k];
      const sr = [];
      if (isRight) { cls = 'is-correct'; key = icon('check'); sr.push('correct answer'); }
      else if (isRe) { cls = 'is-wrong'; key = icon('refresh'); sr.push('your re-attempt, wrong'); }
      else if (isFirst) { cls = modeOn ? 'is-first' : 'is-wrong'; key = icon('x'); }
      if (isRe && isRight) sr.push('your re-attempt');
      if (isFirst) sr.push(isRight ? 'your first attempt' : 'your first attempt, wrong');
      const tag = isFirst && modeOn ? html`<span class="opt-tags"><span class="opt-tag opt-tag--first">Your first attempt</span></span>` : '';
      return html`<div class="opt ${cls}" role="listitem"><span class="opt-key">${key}</span><span class="opt-text"${L()}>${o}</span>${tag}
        ${sr.length ? html`<span class="visually-hidden">, ${sr.join(', ')}</span>` : ''}</div>`;
    });
    const statusLabel = { correct: 'Correct', incorrect: 'Incorrect', unattempted: 'Unattempted' }[st];
    return html`<div class="ts-qhead ts-qhead--review">
        <span class="ts-qno">Question ${i + 1}</span>
        <span class="rv-status rv-status--${st}">${statusLabel}</span>
        <span class="rv-sep" aria-hidden="true"></span>
        <span class="rv-time ${speed ? 'rv-time--' + speed : ''}" ${speedMeta ? raw('title="' + speedMeta[1] + '"') : ''}>${icon(speedMeta ? speedMeta[2] : 'clock')}<span>You: <b class="t-num">${mmss(questionTime(a, q))}</b></span><span class="rv-avg">Avg: <b class="t-num">${mmss(avgTime(q))}</b></span></span>
        <span class="rv-sep" aria-hidden="true"></span>
        <span class="rv-marks">Marks <b class="rv-marks-val rv-marks-val--${st}">${scoreLabel}</b></span>
      </div>
      <div class="ts-card">
        <p class="ts-qtext"${L()} id="ts-q">${q[l].text}</p>
        <div class="opts" ${reattempting ? raw('role="radiogroup" aria-labelledby="ts-q"') : raw('role="list" aria-label="Answer review"')}>${opts}</div>
        ${reattempting ? html`<div class="reattempt-box" role="status">
            <span class="reattempt-ic">${icon('refresh')}</span>
            <span class="grow"><b>Re-attempt mode is on</b><span class="t-caption block">Choose an answer to try this question again.</span></span>
            <button type="button" class="btn btn--secondary btn--sm" data-act="view-solution">${icon('eye')}View solution</button>
          </div>`
          : html`${modeOn ? '' : html`<p class="reattempt-off-note">Re-attempt mode is off. Turn it on from the bottom bar.</p>`}<section class="solution" aria-label="Solution">
            <h3 class="solution-title">Solution</h3>
            ${chosen == null ? html`<p class="solution-note">${icon('info')}You did not answer this question.</p>` : ''}
            <p class="solution-answer">The correct answer is <b${L()}>${BP.content.LETTERS[q.correctIndex]}. ${q[l].options[q.correctIndex]}</b></p>
            <p class="solution-text"${L()}>${q[l].explanation || 'No explanation was added for this question.'}</p>
          </section>`}
      </div>`;
  }

  function foot(a) {
    const i = curIndex(a), n = a.snapshot.questions.length;
    const q = a.snapshot.questions[i];
    if (T.review) {
      const list = visibleIndexes(a);
      const pos = list.indexOf(i);
      return html`<button type="button" class="btn btn--secondary ts-nav-prev" data-act="prev" ${pos <= 0 ? 'disabled' : ''} aria-label="Previous question">${icon('arrow-left')}<span class="hide-xs">Previous</span></button>
        <label class="ts-reattempt-toggle">
          <span class="ts-reattempt-label">Re-attempt<span class="hide-xs"> questions</span></span>
          <button type="button" class="ts-switch" role="switch" aria-checked="${String(!!T.reattempt)}" data-act="toggle-reattempt" aria-label="Re-attempt questions"><span class="ts-switch-knob"></span></button>
        </label>
        <button type="button" class="btn btn--next ts-nav-next" data-act="next" ${pos < 0 || pos === list.length - 1 ? 'disabled' : ''}><span class="hide-xs">Next</span>${icon('arrow-right')}</button>`;
    }
    const marked = (a.markedQuestions || []).includes(q.id);
    const hasAnswer = a.answers[q.id] != null;
    return html`<div class="ts-foot-group">
        <button type="button" class="btn btn--secondary ts-mark-button ${marked ? 'is-marked' : ''}" data-act="toggle-mark" aria-pressed="${String(marked)}">${icon('flag')}<span class="hide-xs">${marked ? 'Marked for review' : 'Mark for review'}</span><span class="mobile-mark-label">${marked ? 'Marked' : 'Mark'}</span></button>
        <button type="button" class="btn btn--ghost ts-clear" data-act="clear" ${hasAnswer ? '' : 'disabled'}>${icon('eraser')}<span class="hide-xs">Clear response</span><span class="mobile-mark-label">Clear</span></button>
      </div>
      <div class="ts-foot-group">
        <button type="button" class="btn btn--secondary ts-nav-prev" data-act="prev" ${i === 0 ? 'disabled' : ''} aria-label="Previous question">${icon('arrow-left')}<span class="hide-sm">Previous</span></button>
        ${i === n - 1 ? html`<button type="button" class="btn btn--primary ts-nav-next" data-act="submit">Finish${icon('check')}</button>`
          : html`<button type="button" class="btn btn--next ts-nav-next" data-act="next">${hasAnswer ? 'Save & next' : 'Next'}${icon('arrow-right')}</button>`}
      </div>`;
  }

  /** Small shaped marker used in the palette and its legend. */
  const shape = (st, content, cls) => html`<span class="pal-shape pal--${st} ${cls || ''}" aria-hidden="true">${content}</span>`;

  /** The palette panel: who is taking it, legend with counts, the question grid, the panel action. */
  function panel(a) {
    const qs = a.snapshot.questions, i = curIndex(a);
    const indexes = visibleIndexes(a);
    const c = counts(a);
    const name = userName();
    const legend = T.review
      ? [['correct', 'Correct', c.correct], ['incorrect', 'Incorrect', c.incorrect], ['unattempted', 'Unattempted', c.unattempted]]
      : [['answered', 'Answered', c.answered], ['notanswered', 'Not answered', c.notanswered], ['marked', 'Marked', c.marked], ['marked-answered', 'Marked and answered', c['marked-answered']], ['unvisited', 'Not visited', c.unvisited]];
    const filterDraft = T.filterDraft || T.filters;
    const speed = T.review ? speedCounts(a) : null;
    const groups = hasSections(a)
      ? sectionList(a).map((title) => ({ title, idx: indexes.filter((k) => qs[k].subject === title) })).filter((g) => g.idx.length)
      : [{ title: null, idx: indexes }];
    const current = sectionForQuestion(qs[i]);
    const palBtn = (k) => {
      const st = qState(a, qs[k], k);
      return html`<button type="button" class="pal pal--${st} ${k === i ? 'is-current' : ''}" data-act="jump" data-i="${k}" ${k === i ? raw('aria-current="step"') : ''} aria-label="Question ${k + 1}, ${STATE_LABEL[st]}">${k + 1}</button>`;
    };
    return html`<div class="tp">
      <div class="tp-top">
      <div class="tp-head">
        ${BP.ui.avatar(name, 'avatar--sm')}<span class="tp-user">${name}</span>
        ${T.review ? html`<button type="button" class="tp-filter-trigger ${T.filterOpen ? 'is-open' : ''} ${Object.values(T.filters).every(Boolean) ? '' : 'is-active'}" data-act="toggle-filters" aria-expanded="${String(!!T.filterOpen)}" aria-controls="tp-filter-popover">${icon('filter')}Filter</button>` : ''}
        <button type="button" class="icon-btn icon-btn--plain tp-close" data-act="close-progress" aria-label="Close">${icon('x')}</button>
      </div>
      ${T.review && T.filterOpen ? html`<section class="tp-filters" id="tp-filter-popover" aria-label="Filter questions by result">
        <div class="tp-filters-head"><h3>Show questions</h3><button type="button" class="tp-filter-reset" data-act="reset-filters">Reset</button></div>
        ${legend.map(([key, label, count]) => html`<button type="button" class="tp-filter" data-act="toggle-filter-draft" data-value="${key}" aria-pressed="${String(!!filterDraft[key])}"><span class="tp-filter-check" aria-hidden="true">${filterDraft[key] ? icon('check') : ''}</span>${shape(key, '', 'pal-shape--xs')}<span>${label}</span><b class="t-num">${count}</b></button>`)}
        <button type="button" class="btn btn--primary btn--sm btn--block" data-act="apply-filters">Apply</button>
      </section>` : ''}
      <div class="tp-legend" role="status" aria-live="polite" aria-label="Question status counts">
        ${legend.map(([key, label, count]) => html`<span class="tp-legend-item">${shape(key, count, 'pal-shape--sm t-num')}<span>${label}</span></span>`)}
      </div>
      ${T.review ? html`<section class="tp-speed" aria-labelledby="tp-speed-title"><h3 id="tp-speed-title" class="tp-section-label">Speed indicators</h3><div class="tp-speed-grid">
        ${SPEEDS.map(([key, label, ic]) => html`<div class="tp-speed-item tp-speed-item--${key}">${icon(ic)}<span class="tp-speed-label">${label}</span><b class="t-num">${speed[key]}</b></div>`)}
      </div></section>` : ''}
      </div>
      <div class="tp-scroll" id="tp-scroll">
        ${groups.map((g) => html`<section class="tp-group ${g.title && g.title === current ? 'is-current' : ''}" aria-label="${g.title || 'All questions'}">
          <div class="tp-group-head"><span>${g.title ? html`Section: <b>${g.title}</b>` : html`<b>All questions</b>`}</span><span class="t-num">${g.idx.length}</span></div>
          <div class="tp-grid" role="group" aria-label="Go to a question${g.title ? ' in ' + g.title : ''}">${g.idx.map(palBtn)}</div>
        </section>`)}
        ${indexes.length ? '' : html`<p class="tp-empty">No questions match this filter.</p>`}
      </div>
      <div class="tp-foot">
        ${T.review ? html`<a class="btn btn--secondary btn--block" href="#/user/attempt/${a.id}/result">${icon('list-checks')}Score summary</a>`
          : html`<button type="button" class="btn btn--primary btn--block tp-submit" data-act="submit">${icon('send')}Submit test</button>`}
      </div>
    </div>`;
  }

  function draw() {
    const a = attempt();
    if (!a) return;
    document.getElementById('ts-sections').innerHTML = String(sections(a));
    document.getElementById('ts-body').innerHTML = String(body(a));
    document.getElementById('ts-foot').innerHTML = String(foot(a));
    const oldScroll = document.getElementById('tp-scroll');
    const keepTop = oldScroll ? oldScroll.scrollTop : 0;
    document.getElementById('ts-panel').innerHTML = String(panel(a));
    syncProgressDrawer();
    const scroller = document.getElementById('tp-scroll');
    const cur = scroller && scroller.querySelector('.pal.is-current');
    if (scroller) {
      scroller.scrollTop = keepTop;
      if (cur) {
        const head = (cur.closest('.tp-group') || scroller).querySelector('.tp-group-head');
        const pad = (head ? head.offsetHeight : 0) + 8;
        const top = cur.offsetTop - scroller.offsetTop, bottom = top + cur.offsetHeight;
        if (top - pad < scroller.scrollTop) scroller.scrollTop = Math.max(0, top - pad);
        else if (bottom + 8 > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = bottom + 8 - scroller.clientHeight;
      }
    }
    const c = counts(a);
    const n = a.snapshot.questions.length;
    const pct = T.review ? (curIndex(a) + 1) / n * 100 : answeredCount(c) / n * 100;
    document.getElementById('ts-bar').style.width = pct + '%';
    const trigger = document.querySelector('.ts-progress-trigger');
    if (trigger) {
      const count = trigger.querySelector('.ts-progress-count');
      if (count) count.textContent = (curIndex(a) + 1) + '/' + n;
      trigger.setAttribute('aria-label', T.review ? 'Open answer summary' : 'Open question palette, question ' + (curIndex(a) + 1) + ' of ' + n);
    }
  }

  function syncProgressDrawer() {
    const panel = document.getElementById('ts-panel');
    const backdrop = document.getElementById('ts-progress-backdrop');
    const trigger = document.querySelector('.ts-progress-trigger');
    if (!panel || !backdrop || !trigger) return;
    const mobile = window.matchMedia('(max-width: 1023.98px)').matches;
    const drawerOpen = !!T.progressOpen && mobile;
    panel.classList.toggle('is-open', drawerOpen);
    backdrop.classList.toggle('is-open', drawerOpen);
    panel.setAttribute('role', drawerOpen ? 'dialog' : 'complementary');
    if (drawerOpen) panel.setAttribute('aria-modal', 'true'); else panel.removeAttribute('aria-modal');
    panel.setAttribute('aria-hidden', String(mobile && !drawerOpen));
    panel.inert = mobile && !drawerOpen;
    trigger.setAttribute('aria-expanded', String(drawerOpen));
    document.body.classList.toggle('ts-progress-open', drawerOpen);
  }

  function setProgressOpen(open, restoreFocus) {
    T.progressOpen = !!open;
    syncProgressDrawer();
    if (T.progressOpen) {
      const close = document.querySelector('#ts-panel .tp-close');
      if (close) close.focus({ preventScroll: true });
    } else if (restoreFocus !== false) {
      const trigger = document.querySelector('.ts-progress-trigger');
      if (trigger) trigger.focus({ preventScroll: true });
    }
  }

  /* ---------- Timer, heartbeat, connection ---------- */
  function tick() {
    const a = attempt();
    if (!a) return;
    if (a.status !== 'in_progress') { toResult(a.id); return; }
    const left = Math.max(0, Math.ceil((a.expiresAt - Date.now()) / 1000));
    const t = document.getElementById('ts-timer');
    document.getElementById('ts-time').textContent = clock(left);
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
      <h2 class="t-h2" id="ts-ov-title">Reconnecting… <span id="ts-grace" class="t-num">01:00</span></h2>
      <p class="t-body t-muted">Your answers are saved. If the connection comes back before the countdown ends, you continue exactly where you left off. Otherwise the test is submitted with your saved answers.</p>
      <button type="button" class="btn btn--primary btn--block" data-act="reconnect">${icon('wifi')}Connection restored</button>
      <p class="t-caption">Demo button: simulates the internet coming back.</p>
    </div>`);
    ts.appendChild(o);
    o.querySelector('button').focus();
    tick();
  }

  /* ---------- Full screen (tests only, until submit) ----------
     Browsers allow full screen only right after a tap, so it starts from Start / Resume.
     Leaving it covers the test with a prompt to return; the timer keeps running. Where the
     browser has no full-screen support (iPhone Safari), the test simply runs as a normal page. */
  const FS = {
    supported: () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
    active: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
    enter() {
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!fn) return Promise.reject(new Error('unsupported'));
      try { const r = fn.call(el, { navigationUI: 'hide' }); return r && r.then ? r : Promise.resolve(); } catch (e) { return Promise.reject(e); }
    },
    exit() {
      if (!FS.active()) return;
      const fn = document.exitFullscreen || document.webkitExitFullscreen;
      try { const r = fn && fn.call(document); if (r && r.catch) r.catch(() => {}); } catch (e) { /* already left */ }
    },
  };
  function showFsPrompt(first) {
    const ts = document.querySelector('.ts');
    if (!ts || document.getElementById('ts-fs')) return;
    const o = document.createElement('div');
    o.id = 'ts-fs';
    o.className = 'ts-overlay ts-overlay--fs';
    o.setAttribute('role', 'alertdialog');
    o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-labelledby', 'ts-fs-title');
    o.innerHTML = String(html`<div class="ts-overlay-card">
      <span class="ts-fs-ic" aria-hidden="true">${icon('maximize')}</span>
      <h2 class="t-h2" id="ts-fs-title">${first ? 'Continue in full screen' : 'You left full screen'}</h2>
      <p class="t-body t-muted">This test runs in full screen, like the real exam. Your answers are saved and the timer keeps running.</p>
      <button type="button" class="btn btn--primary btn--lg btn--block" data-act="fs-enter">${icon('maximize')}Return to full screen</button>
    </div>`);
    ts.appendChild(o);
    o.querySelector('button').focus();
  }
  function hideFsPrompt() { const o = document.getElementById('ts-fs'); if (o) o.remove(); }
  function onFsChange() {
    if (!T || T.review) return;
    const a = attempt();
    if (!a || a.status !== 'in_progress') return;
    if (FS.active()) hideFsPrompt(); else showFsPrompt(false);
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
      if (FS.supported()) {
        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);
        if (!FS.active()) FS.enter().catch(() => showFsPrompt(true));
      }
    }
    draw();
    T.onKey = (e) => {
      if (e.key === 'Escape' && T.progressOpen) { setProgressOpen(false); e.preventDefault(); return; }
      if (document.querySelector('#overlay-root .overlay') || document.getElementById('ts-overlay') || document.getElementById('ts-fs')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
      if (!T.review && k in map) { choose(map[k]); e.preventDefault(); }
      if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
    };
    document.addEventListener('keydown', T.onKey);
    T.onResize = syncProgressDrawer;
    window.addEventListener('resize', T.onResize);
  }
  function unmountScreen() {
    if (!T) return;
    (T.timers || []).forEach(clearInterval);
    document.removeEventListener('keydown', T.onKey);
    window.removeEventListener('resize', T.onResize);
    document.removeEventListener('fullscreenchange', onFsChange);
    document.removeEventListener('webkitfullscreenchange', onFsChange);
    if (!T.review) FS.exit(); // leaving the test (submitted, auto-submitted or navigated away)
    document.body.classList.remove('in-test');
    document.body.classList.remove('ts-progress-open');
  }

  function flashSaved(text) {
    const s = document.getElementById('ts-saved');
    if (s) { s.innerHTML = BP.icon('check') + text; s.classList.add('is-on'); clearTimeout(T.savedT); T.savedT = setTimeout(() => s.classList.remove('is-on'), 1600); }
  }
  function choose(k) {
    const a = attempt();
    const q = a.snapshot.questions[curIndex(a)];
    const clearing = a.answers[q.id] === k;
    E().answer(a.id, q.id, clearing ? null : k); // tap again to clear
    draw();
    flashSaved(clearing ? 'Cleared' : 'Saved');
  }
  function move(d) {
    const a = attempt();
    const list = T.review ? visibleIndexes(a) : a.snapshot.questions.map((q, i) => i);
    if (!list.length) return;
    const pos = list.indexOf(curIndex(a));
    goTo(list[Math.min(list.length - 1, Math.max(0, (pos < 0 ? 0 : pos) + d))]);
  }
  function goTo(i) {
    const a = attempt();
    if (T.review) T.index = i; else E().visit(a.id, i);
    if (hasSections(a)) T.section = sectionForQuestion(a.snapshot.questions[i]);
    draw();
    const q = document.getElementById('ts-q'); if (q) { q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  /** Submit confirmation: a per-section summary table, like the exam hall's final check. */
  function confirmSubmit() {
    const a = attempt();
    const qs = a.snapshot.questions;
    const groups = hasSections(a) ? sectionList(a).map((title) => ({ title, idx: qs.map((q, k) => k).filter((k) => qs[k].subject === title) })) : [{ title: 'All questions', idx: qs.map((q, k) => k) }];
    const rows = groups.map((g) => { const c = counts(a, g.idx); return { title: g.title, n: g.idx.length, ans: answeredCount(c), not: c.notanswered, marked: c.marked + c['marked-answered'], unvisited: c.unvisited }; });
    const tot = rows.reduce((t, r) => ({ n: t.n + r.n, ans: t.ans + r.ans, not: t.not + r.not, marked: t.marked + r.marked, unvisited: t.unvisited + r.unvisited }), { n: 0, ans: 0, not: 0, marked: 0, unvisited: 0 });
    const unanswered = tot.n - tot.ans;
    const left = Math.max(0, Math.ceil((a.expiresAt - Date.now()) / 1000));
    const cell = (v, kind) => html`<td class="t-num ${v && kind ? 'sum-cell--' + kind : ''}">${v}</td>`;
    BP.ui.sheet({
      title: 'Submit your test?',
      size: 'wide',
      body: html`<div class="stack gap-4">
        <p class="t-body-sm t-muted">You have <b class="t-strong t-num">${clock(left)}</b> left. Check your summary before you submit.</p>
        <div class="sum-table-wrap"><table class="sum-table">
          <thead><tr><th scope="col">Section</th><th scope="col">Questions</th><th scope="col">Answered</th><th scope="col">Not answered</th><th scope="col">Marked for review</th><th scope="col">Not visited</th></tr></thead>
          <tbody>${rows.map((r) => html`<tr><th scope="row">${r.title}</th><td class="t-num">${r.n}</td>${cell(r.ans, 'answered')}${cell(r.not, 'notanswered')}${cell(r.marked, 'marked')}${cell(r.unvisited)}</tr>`)}</tbody>
          ${rows.length > 1 ? html`<tfoot><tr><th scope="row">Total</th><td class="t-num">${tot.n}</td><td class="t-num">${tot.ans}</td><td class="t-num">${tot.not}</td><td class="t-num">${tot.marked}</td><td class="t-num">${tot.unvisited}</td></tr></tfoot>` : ''}
        </table></div>
        ${unanswered ? html`<div class="notice notice--warning">${icon('alert-triangle')}<span>${unanswered} ${unanswered === 1 ? 'question is' : 'questions are'} not answered. You cannot change answers after submitting.</span></div>`
          : html`<div class="notice notice--success">${icon('check-circle')}<span>You have answered every question.</span></div>`}
      </div>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Keep answering</button><button type="button" class="btn btn--primary" data-act="go">${icon('send')}Submit test</button>`,
      actions: { go(el, e, api) { api.close(true); E().finalize(a.id, 'submitted', null, { silent: true }); toResult(a.id); } },
    });
  }

  function userName() {
    try {
      const u = BP.store.byId('users', BP.store.state.session.userId);
      return u ? u.name : 'User';
    } catch (e) { return 'User'; }
  }

  const actions = {
    choose(el) { if (!T.review) choose(Number(el.dataset.i)); },
    clear() {
      const a = attempt(), q = a.snapshot.questions[curIndex(a)];
      if (a.answers[q.id] == null) return;
      E().answer(a.id, q.id, null);
      draw();
      flashSaved('Cleared');
    },
    'reattempt-choose'(el) {
      const a = attempt(), q = a.snapshot.questions[curIndex(a)], value = Number(el.dataset.i);
      if (T.review && T.reattempt) { E().reviewAnswer(a.id, q.id, value); draw(); }
    },
    'toggle-reattempt'() { T.reattempt = !T.reattempt; draw(); },
    'view-solution'() { const a = attempt(); T.revealed[a.snapshot.questions[curIndex(a)].id] = true; draw(); },
    prev() { move(-1); },
    next() { move(1); },
    skip() {
      const a = attempt();
      if (curIndex(a) === a.snapshot.questions.length - 1) confirmSubmit(); else move(1);
    },
    jump(el) { goTo(Number(el.dataset.i)); if (window.matchMedia('(max-width: 1023.98px)').matches) setProgressOpen(false, false); },
    section(el) {
      const a = attempt(), title = el.dataset.value;
      const first = a.snapshot.questions.findIndex((q) => sectionForQuestion(q) === title && (!T.review || T.filters[reviewCategory(a, q)]));
      if (first >= 0) goTo(first);
      else BP.ui.toast('No questions in ' + title + ' match the filter.');
    },
    'toggle-mark'() { const a = attempt(), q = a.snapshot.questions[curIndex(a)]; E().toggleMark(a.id, q.id); draw(); },
    'toggle-filters'() { T.filterOpen = !T.filterOpen; T.filterDraft = Object.assign({}, T.filters); draw(); },
    'toggle-filter-draft'(el) { const key = el.dataset.value; T.filterDraft[key] = !T.filterDraft[key]; draw(); },
    'reset-filters'() { T.filterDraft = { correct: true, incorrect: true, unattempted: true }; draw(); },
    'apply-filters'() { const a = attempt(); T.filters = Object.assign({}, T.filterDraft); T.filterOpen = false; const allowed = visibleIndexes(a); if (allowed.length && !allowed.includes(curIndex(a))) T.index = allowed[0]; draw(); },
    'toggle-progress'() { setProgressOpen(!T.progressOpen); },
    'close-progress'() { setProgressOpen(false); },
    submit: confirmSubmit,
    'fs-enter'() { FS.enter().then(hideFsPrompt).catch(() => BP.ui.toast('Full screen is not available in this browser.')); },
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
      T = { attemptId: a.id, review: false, section: hasSections(a) ? sectionForQuestion(a.snapshot.questions[a.current || 0]) : null, announced: {}, revealed: {} };
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
      const index = Math.max(0, Math.min(a.snapshot.questions.length - 1, (Number(ctx.query.q) || 1) - 1));
      T = { attemptId: a.id, review: true, index, section: hasSections(a) ? sectionForQuestion(a.snapshot.questions[index]) : null, filters: { correct: true, incorrect: true, unattempted: true }, filterDraft: { correct: true, incorrect: true, unattempted: true }, filterOpen: false, reattempt: true, announced: {}, revealed: {} };
      return frame(ctx, a);
    },
    mount(root, ctx) { if (T && T.review) mountScreen(root, ctx, true); },
    unmount: unmountScreen,
    actions,
  });

  /* Shared with the result page: sections and per-question time for the sectional summary. */
  BP.testSections = function (a) {
    const qs = a.snapshot.questions;
    const titles = [];
    qs.forEach((q) => { if (q.subject && !titles.includes(q.subject)) titles.push(q.subject); });
    if (titles.length < 2) return [{ title: 'Full test', questions: qs }];
    return titles.map((title) => ({ title, questions: qs.filter((q) => q.subject === title) }));
  };

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
