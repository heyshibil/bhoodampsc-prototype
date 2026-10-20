/* Flow template: Paper Test. Optional stage, year and subject filters, then a test list. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html } = BP.ui;
  const q = () => BP.store.q;

  function state(card, ctx) {
    const s = card.settings || {};
    const stage = s.usesStage ? (ctx.query.stage === 'mains' ? 'mains' : 'prelims') : undefined;
    const years = s.usesYear ? q().yearsWithTests(card.id, stage) : [];
    const wanted = Number(ctx.query.year);
    const year = s.usesYear ? (years.includes(wanted) ? wanted : years[0]) : undefined;
    const subjects = s.usesSubject ? BP.store.state.subjects.filter((x) => x.cardId === card.id && q().testsFor(card.id, { stage, year }).some((t) => t.subjectId === x.id)).sort((a, b) => a.order - b.order) : [];
    const requested = ctx.query.subject;
    const subjectId = s.usesSubject && subjects.some((x) => x.id === requested) ? requested : (subjects[0] && subjects[0].id);
    return { s, stage, years, year, subjects, subjectId };
  }

  BP.templates = BP.templates || {};
  BP.templates.paper_test = {
    render(card, section, ctx) {
      const { s, stage, years, year, subjects, subjectId } = state(card, ctx);
      const filters = { stage, year, subjectId: s.usesSubject ? subjectId : undefined };
      const tests = s.usesYear && !year ? [] : s.usesSubject && !subjectId ? [] : q().testsFor(card.id, filters);
      const count = (st) => q().testsFor(card.id, { stage: st }).length;
      return html`
        ${BP.u.pageHead({ back: '#/user/home', backLabel: 'Home', crumbs: [section.title], title: card.title })}
        ${s.usesStage || s.usesYear || s.usesSubject ? html`<div class="filters">
          ${s.usesStage ? BP.ui.segmented([
            { value: 'prelims', label: 'Prelims', count: count('prelims') },
            { value: 'mains', label: 'Mains', count: count('mains') },
          ], stage, { act: 'stage', label: 'Exam stage' }) : ''}
          ${s.usesYear && years.length ? html`<div class="filter-group">
            <span class="filter-label" id="year-label">Year</span>
            <div class="chip-row" role="group" aria-labelledby="year-label">
              ${years.map((y) => html`<button type="button" class="chip" aria-pressed="${String(y === year)}" data-act="year" data-value="${y}">${y}</button>`)}
            </div>
          </div>` : ''}
          ${s.usesSubject && subjects.length ? html`<div class="filter-group"><span class="filter-label" id="subject-label">Subject</span><div class="chip-row" role="group" aria-labelledby="subject-label">${subjects.map((x) => html`<button type="button" class="chip" aria-pressed="${String(x.id === subjectId)}" data-act="subject" data-value="${x.id}">${x.title}</button>`)}</div></div>` : ''}
        </div>` : ''}
        ${tests.length ? html`<div class="list">${tests.map((t) => BP.u.testRow(t, ctx.user))}</div>`
          : BP.ui.emptyState({ icon: 'file-text', title: 'No tests here yet', text: 'New tests appear here as soon as they are approved. Try the other tab or check back soon.' })}`;
    },
    actions: {
      stage(el, e, ctx) { BP.router.go(ctx.path, { stage: el.dataset.value }, { replace: true }); },
      year(el, e, ctx) { BP.router.go(ctx.path, { stage: ctx.query.stage, year: el.dataset.value }, { replace: true }); },
      subject(el, e, ctx) { BP.router.go(ctx.path, { stage: ctx.query.stage, year: ctx.query.year, subject: el.dataset.value }, { replace: true }); },
    },
  };
})();
