/* Flow template: Current Affairs. Card -> Daily / Weekly / Monthly -> practice.
   Monthly opens in steps: months -> a month's topic filters -> the tests for that month and topic.
   The bucket is worked out from each question's publish date (BP.content.caBucket); nothing is stored. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile, tag } = BP.ui;
  const TABS = [
    { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];
  const monthKey = (d) => String(d).slice(0, 7);
  const periodText = (tab) => ({ daily: 'Today and the previous six days', weekly: 'Published 7 to 27 days ago', monthly: 'Published 28 or more days ago' }[tab]);
  const weekLabel = (date) => 'Week ' + Math.ceil(Number(String(date).slice(8, 10)) / 7) + ' ' + BP.ui.fmtMonth(String(date).slice(0, 7) + '-01');
  const questionCount = (n) => n + (n === 1 ? ' question' : ' questions');
  const topicsIn = (items) => Array.from(new Set(items.map((x) => x.q.subject).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  /** A month's page: topic filters, then only the tests for that month and topic. */
  function monthPage(card, section, ctx, month, items) {
    const topics = card.settings.usesSubject ? topicsIn(items) : [];
    const active = topics.includes(ctx.query.subject) ? ctx.query.subject : '';
    const practiceHref = (topic) => BP.router.href('/user/practice/' + card.id, { bucket: 'monthly', month, subject: topic });
    const testCard = (title, n, topic) => html`<div class="month-card">
      ${iconTile(topic ? 'newspaper' : 'archive', 'accent')}
      <div class="grow"><h2 class="t-h3">${title}</h2><p class="t-caption">${questionCount(n)}</p></div>
      <a class="btn btn--secondary btn--sm" href="${practiceHref(topic)}" aria-label="Practise ${title}">Practise${icon('arrow-right')}</a>
    </div>`;
    const inTopic = (topic) => items.filter((x) => x.q.subject === topic).length;
    return html`${BP.u.pageHead({ back: '#/user/card/' + card.id + '?tab=monthly', backLabel: 'Monthly', crumbs: [section.title, card.title], title: BP.ui.fmtMonth(month + '-01'), sub: 'Free practice' })}
      ${topics.length ? html`<div class="filters">${BP.u.filterChips({ id: 'ca-topic', label: 'Topic', act: 'subject', items: [{ value: '', label: 'All' }].concat(topics.map((t) => ({ value: t, label: t }))), current: active })}</div>` : ''}
      <div class="month-grid">${active ? testCard(active, inTopic(active), active)
        : html`${testCard(topics.length ? 'All topics' : 'All questions', items.length, '')}${topics.map((t) => testCard(t, inTopic(t), t))}`}</div>`;
  }

  BP.templates = BP.templates || {};
  BP.templates.current_affairs = {
    render(card, section, ctx) {
      const tab = TABS.some((t) => t.value === ctx.query.tab) ? ctx.query.tab : 'daily';
      const all = BP.store.q.caFor(card.id);
      const inTab = all.filter((x) => x.bucket === tab);
      const lang = BP.store.state.session.lang;
      const head = html`${BP.u.pageHead({ back: '#/user/home', backLabel: 'Home', crumbs: [section.title], title: card.title })}
        <div class="filters">${BP.ui.segmented(TABS.map((t) => ({ value: t.value, label: t.label, count: all.filter((x) => x.bucket === t.value).length })), tab, { act: 'tab', label: 'Period', size: 'fit' })}
        <p class="t-caption">${periodText(tab)} · Free practice</p></div>`;
      if (!inTab.length) return html`${head}${BP.ui.emptyState({ icon: 'newspaper', title: 'No questions here yet', text: 'New current affairs questions appear here every day.' })}`;

      if (tab === 'monthly') {
        const groups = {};
        inTab.forEach((x) => { (groups[monthKey(x.q.publishDate)] = groups[monthKey(x.q.publishDate)] || []).push(x); });
        if (groups[ctx.query.month]) return monthPage(card, section, ctx, ctx.query.month, groups[ctx.query.month]);
        return html`${head}<div class="month-grid">${Object.keys(groups).sort().reverse().map((k) => {
          const topics = card.settings.usesSubject ? topicsIn(groups[k]) : [];
          return html`<a class="list-row" href="#/user/card/${card.id}?tab=monthly&month=${k}">
            ${iconTile('archive', 'accent')}
            <span class="lr-main"><span class="lr-title">${BP.ui.fmtMonth(k + '-01')}</span><span class="lr-meta">${questionCount(groups[k].length)}${topics.length ? ' · ' + topics.length + (topics.length === 1 ? ' topic' : ' topics') : ''}</span></span>
            ${raw(BP.icon('chevron-right', 'chev'))}
          </a>`;
        })}</div>`;
      }

      if (tab === 'weekly') {
        const groups = {};
        inTab.forEach((x) => { const k = weekLabel(x.q.publishDate); (groups[k] = groups[k] || []).push(x); });
        return html`${head}<div class="month-grid">${Object.keys(groups).map((label) => html`<div class="month-card">
          ${iconTile('calendar', 'accent')}<div class="grow"><h2 class="t-h3">${label}</h2><p class="t-caption">${groups[label].length} ${groups[label].length === 1 ? 'question' : 'questions'}</p></div>
          <a class="btn btn--secondary btn--sm" href="#/user/practice/${card.id}?bucket=weekly&week=${encodeURIComponent(label)}">Practise${icon('arrow-right')}</a>
        </div>`)}</div>`;
      }

      return html`${head}
        <div class="ca-hero card card--hero">
          <div class="grow stack gap-1"><span class="t-caption">${TABS.find((t) => t.value === tab).label} practice</span><span class="t-h2">${inTab.length} ${inTab.length === 1 ? 'question' : 'questions'}</span><span class="t-caption">See the answer as soon as you choose.</span></div>
          <a class="btn btn--hero" href="#/user/practice/${card.id}?bucket=${tab}">Start practice${icon('arrow-right')}</a>
        </div>
        <div class="list mt-4">${inTab.map((x) => html`<div class="list-row">
          ${iconTile('newspaper')}
          <span class="lr-main"><span class="lr-title" ${raw(lang === 'ml' ? 'lang="ml"' : '')}>${x.q[lang].text}</span><span class="lr-meta">Published ${BP.ui.fmtDate(x.q.publishDate)}${x.q.sample ? ' · Sample' : ''}</span></span>
        </div>`)}</div>`;
    },
    mount(root) { BP.u.showSelectedChips(root); },
    actions: {
      tab(el, e, ctx) { BP.router.go(ctx.path, { tab: el.dataset.value }, { replace: true }); },
      subject(el, e, ctx) { BP.router.go(ctx.path, { tab: 'monthly', month: ctx.query.month, subject: el.dataset.value }, { replace: true }); },
    },
  };

  /* ---------- Practice: one question at a time, answer shown straight after choosing ---------- */
  let P = null; // { key, ids[], index, chosen{} }

  /** Where practice returns to: the month and topic it came from, or its period tab. */
  function practiceBackHref(ctx) {
    const query = ctx.query.month ? { tab: 'monthly', month: ctx.query.month, subject: ctx.query.subject } : { tab: ctx.query.bucket };
    return BP.router.href('/user/card/' + ctx.params.cardId, query);
  }
  function practiceKey(ctx) { return ctx.params.cardId + '|' + (ctx.query.bucket || '') + '|' + (ctx.query.month || '') + '|' + (ctx.query.week || '') + '|' + (ctx.query.subject || ''); }
  function questionsFor(ctx) {
    const all = BP.store.q.caFor(ctx.params.cardId);
    let list = all.filter((x) => x.bucket === (ctx.query.bucket || 'daily'));
    if (ctx.query.month) list = list.filter((x) => monthKey(x.q.publishDate) === ctx.query.month);
    if (ctx.query.week) list = list.filter((x) => weekLabel(x.q.publishDate) === ctx.query.week);
    if (ctx.query.subject) list = list.filter((x) => x.q.subject === ctx.query.subject);
    return list.map((x) => x.q);
  }

  function body(ctx) {
    const qs = P.ids.map((id) => BP.store.byId('caQuestions', id)).filter(Boolean);
    const lang = BP.store.state.session.lang;
    const L = lang === 'ml' ? raw(' lang="ml"') : '';
    if (P.index >= qs.length) {
      const right = qs.filter((q) => P.chosen[q.id] === q.correctIndex).length;
      return html`<div class="practice-done card stack gap-4 items-center t-center">
        ${iconTile('check-circle', 'success', 'lg')}
        <h1 class="t-h1">Practice complete</h1>
        <p class="t-body t-muted">You got <b class="t-strong">${right} of ${qs.length}</b> right.</p>
        <div class="row-wrap gap-3 justify-center">
          <button type="button" class="btn btn--secondary" data-act="again">${icon('refresh')}Practise again</button>
          <a class="btn btn--primary" href="${practiceBackHref(ctx)}">Back to current affairs</a>
        </div>
      </div>`;
    }
    const q = qs[P.index];
    const chosen = P.chosen[q.id];
    const answered = chosen != null;
    return html`<div class="ts-qhead"><span class="t-label t-muted">Question ${P.index + 1} of ${qs.length}</span><span class="t-caption">Published ${BP.ui.fmtDate(q.publishDate)}</span></div>
      <div class="ts-card">
        <p class="ts-qtext"${L}>${q[lang].text}</p>
        <div class="opts" role="radiogroup" aria-label="Options">
          ${q[lang].options.map((o, i) => {
            let cls = '', note = '';
            if (answered && i === q.correctIndex) { cls = 'is-correct'; note = i === chosen ? 'Your answer · Correct' : 'Correct answer'; }
            else if (answered && i === chosen) { cls = 'is-wrong'; note = 'Your answer'; }
            else if (answered) cls = 'is-dim';
            return html`<button type="button" class="opt ${cls}" role="radio" aria-checked="${String(chosen === i)}" ${answered ? 'disabled' : ''} data-act="choose" data-i="${i}">
              <span class="opt-key">${BP.content.LETTERS[i]}</span><span class="opt-text"${L}>${o}</span>
              ${note ? html`<span class="opt-note">${icon(cls === 'is-correct' ? 'check-circle' : 'x-circle')}${note}</span>` : ''}
            </button>`;
          })}
        </div>
        ${answered ? html`<div class="notice ${chosen === q.correctIndex ? 'notice--success' : 'notice--error'}" role="status">${icon(chosen === q.correctIndex ? 'check-circle' : 'x-circle')}<span><b>${chosen === q.correctIndex ? 'Correct!' : 'Not quite.'}</b> The answer is ${BP.content.LETTERS[q.correctIndex]}: <span${L}>${q[lang].options[q.correctIndex]}</span>.</span></div>` : ''}
      </div>`;
  }

  BP.router.add('/user/practice/:cardId', {
    role: 'user', chrome: 'none', title: 'Current affairs practice', rerender: false,
    render(ctx) {
      if (!P || P.key !== practiceKey(ctx)) P = { key: practiceKey(ctx), ids: questionsFor(ctx).map((q) => q.id), index: 0, chosen: {} };
      const lang = BP.store.state.session.lang;
      const label = ctx.query.month ? BP.ui.fmtMonth(ctx.query.month + '-01') + (ctx.query.subject ? ' · ' + ctx.query.subject : '') : ctx.query.week || (TABS.find((t) => t.value === ctx.query.bucket) || TABS[0]).label + ' practice';
      return html`<div class="ts ts--practice">
        <header class="ts-top">
          <a class="icon-btn" href="${practiceBackHref(ctx)}" aria-label="Close practice">${icon('x')}</a>
          <div class="ts-title"><span class="t-h3 truncate">${label}</span><span class="t-caption">Free practice · not timed</span></div>
          ${BP.ui.segmented([{ value: 'en', label: 'EN' }, { value: 'ml', label: raw('<span lang="ml">മല</span>') }], lang, { act: 'lang', label: 'Question language', size: 'sm' })}
        </header>
        <div class="ts-progress" aria-hidden="true"><span id="pr-bar"></span></div>
        <main id="main" class="ts-main"><div id="pr-body"></div></main>
        <footer class="ts-foot" id="pr-foot"></footer>
      </div>`;
    },
    mount(root, ctx) { draw(ctx); },
    actions: {
      choose(el, e, ctx) {
        const id = P.ids[P.index];
        if (P.chosen[id] != null) return;
        P.chosen[id] = Number(el.dataset.i);
        draw(ctx);
      },
      next(el, e, ctx) { P.index++; draw(ctx); window.scrollTo(0, 0); },
      again(el, e, ctx) { P = null; BP.router.render(); },
      lang(el, e, ctx) { BP.store.session.setLang(el.dataset.value); el.parentElement.querySelectorAll('.seg').forEach((s) => s.setAttribute('aria-selected', String(s === el))); draw(ctx); },
    },
  });

  function draw(ctx) {
    const b = document.getElementById('pr-body');
    if (!b) return;
    b.innerHTML = String(P.ids.length ? body(ctx) : BP.ui.emptyState({ icon: 'newspaper', title: 'Nothing to practise here', text: 'Pick another period.' }));
    const done = P.index >= P.ids.length;
    document.getElementById('pr-bar').style.width = (P.ids.length ? Math.min(P.index + (P.chosen[P.ids[P.index]] != null ? 1 : 0), P.ids.length) / P.ids.length * 100 : 0) + '%';
    const answered = !done && P.chosen[P.ids[P.index]] != null;
    document.getElementById('pr-foot').innerHTML = done || !P.ids.length ? '' : String(html`<span class="t-caption grow">${answered ? '' : 'Choose an option to see the answer'}</span>
      <button type="button" class="btn btn--primary" data-act="next" ${answered ? '' : 'disabled'}>${P.index === P.ids.length - 1 ? 'Finish' : 'Next'}${icon('arrow-right')}</button>`);
  }
})();
