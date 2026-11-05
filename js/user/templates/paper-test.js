/* Flow template: Paper Test. The admin's card settings decide which filters show, then a test list.
   Filters narrow from top to bottom: Education level, Prelims / Mains, Subject, Subtopic, Year.
   Each row only offers values that still have tests, so no filter leads to an empty choice. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html } = BP.ui;
  const q = () => BP.store.q;
  const byOrder = (a, b) => a.order - b.order;

  function state(card, ctx) {
    const st = BP.store.state;
    const s = card.settings || {};
    const levels = s.usesLevel ? BP.seed.QUALIFICATIONS : [];
    const level = s.usesLevel ? (levels.includes(ctx.query.level) ? ctx.query.level : levels.find((l) => q().testsFor(card.id, { level: l }).length) || levels[0]) : undefined;
    const stage = s.usesStage ? (ctx.query.stage === 'mains' ? 'mains' : 'prelims') : undefined;
    const base = { level, stage };

    const subjects = s.usesSubject ? st.subjects.filter((x) => x.cardId === card.id && q().testsFor(card.id, Object.assign({ subjectId: x.id }, base)).length).sort(byOrder) : [];
    const subject = subjects.find((x) => x.id === ctx.query.subject);
    const subjectId = subject ? subject.id : undefined;

    const subtopics = subject && s.usesSubtopic ? st.subsections.filter((x) => x.subjectId === subject.id && q().testsFor(card.id, Object.assign({ subjectId, subsectionId: x.id }, base)).length).sort(byOrder) : [];
    const subtopic = subtopics.find((x) => x.id === ctx.query.sub);
    const subsectionId = subtopic ? subtopic.id : undefined;

    const narrowed = Object.assign({ subjectId, subsectionId }, base);
    const years = s.usesYear ? q().yearsWithTests(card.id, narrowed) : [];
    const wanted = Number(ctx.query.year);
    const year = s.usesYear ? (years.includes(wanted) ? wanted : years[0]) : undefined;
    const tests = s.usesYear && !year ? [] : q().testsFor(card.id, Object.assign({ year }, narrowed));
    return { s, levels, level, stage, subjects, subjectId, subtopics, subsectionId, years, year, tests };
  }

  /** Keep the current filters and change one or more of them. */
  function setFilter(ctx, change) {
    BP.router.go(ctx.path, Object.assign({}, ctx.query, change), { replace: true });
  }
  const withAll = (label, items) => [{ value: '', label }].concat(items.map((x) => ({ value: x.id, label: x.title })));

  BP.templates = BP.templates || {};
  BP.templates.paper_test = {
    render(card, section, ctx) {
      const { s, levels, level, stage, subjects, subjectId, subtopics, subsectionId, years, year, tests } = state(card, ctx);
      const count = (f) => q().testsFor(card.id, f).length;
      const hasFilters = s.usesLevel || s.usesStage || subjects.length || (s.usesYear && years.length);
      return html`
        ${BP.u.pageHead({ back: '#/user/home', backLabel: 'Home', crumbs: [section.title], title: card.title })}
        ${hasFilters ? html`<div class="filters">
          ${s.usesLevel ? BP.ui.segmented(levels.map((l) => ({ value: l, label: l, count: count({ level: l }) })), level, { act: 'level', label: 'Education level' }) : ''}
          ${s.usesStage ? BP.ui.segmented([
            { value: 'prelims', label: 'Prelims', count: count({ level, stage: 'prelims' }) },
            { value: 'mains', label: 'Mains', count: count({ level, stage: 'mains' }) },
          ], stage, { act: 'stage', label: 'Exam stage' }) : ''}
          ${subjects.length ? BP.u.filterChips({ id: 'subject', label: 'Subject', act: 'subject', items: withAll('All', subjects), current: subjectId || '' }) : ''}
          ${subtopics.length ? BP.u.filterChips({ id: 'subtopic', label: 'Subtopic', act: 'sub', items: withAll('All', subtopics), current: subsectionId || '' }) : ''}
          ${s.usesYear && years.length ? BP.u.filterChips({ id: 'year', label: 'Year', act: 'year', items: years.map((y) => ({ value: y, label: y })), current: year }) : ''}
        </div>` : ''}
        ${tests.length ? html`<div class="list">${tests.map((t) => BP.u.testRow(t, ctx.user))}</div>`
          : BP.ui.emptyState({ icon: 'file-text', title: 'No tests here yet', text: 'New tests appear here as soon as they are approved. Try another filter or check back soon.' })}`;
    },
    mount(root) { BP.u.showSelectedChips(root); },
    actions: {
      level(el, e, ctx) { setFilter(ctx, { level: el.dataset.value }); },
      stage(el, e, ctx) { setFilter(ctx, { stage: el.dataset.value }); },
      subject(el, e, ctx) { setFilter(ctx, { subject: el.dataset.value, sub: '' }); },
      sub(el, e, ctx) { setFilter(ctx, { sub: el.dataset.value }); },
      year(el, e, ctx) { setFilter(ctx, { year: el.dataset.value }); },
    },
  };
})();
