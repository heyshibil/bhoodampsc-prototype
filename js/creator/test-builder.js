/* Creator test builder (Paper Test and Topic Test cards). The form adapts to the card's template settings. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;
  const byOrder = (a, b) => a.order - b.order;

  function blank(card) {
    const s = card.settings || {};
    return { title: '', stage: s.usesStage ? 'prelims' : null, year: null, subjectId: null, subsectionId: null,
      durationMin: 8, marksPerQuestion: 1, rules: BP.seedContent.RULES, questions: [] };
  }

  function filtersFor(w) {
    const f = w.fields, card = w.card, st = BP.store.state;
    const out = [];
    if (card.template === 'paper_test') {
      if (card.settings.usesStage) out.push(html`<div class="field"><span class="field-label" id="tb-stage">Exam stage</span>
        ${BP.ui.segmented([{ value: 'prelims', label: 'Prelims' }, { value: 'mains', label: 'Mains' }], f.stage, { act: 'stage', label: 'Exam stage' })}</div>`);
      if (card.settings.usesYear) out.push(html`<div class="field"><label class="field-label" for="tb-year">Year</label>
        <div class="row gap-2"><select id="tb-year" class="select" data-f="year" data-num="1"><option value="">Choose a year</option>${st.years.slice().sort((a, b) => b - a).map((y) => html`<option value="${y}" ${f.year === y ? 'selected' : ''}>${y}</option>`)}</select>
        <button type="button" class="btn btn--secondary shrink-0" data-act="add-year">${icon('plus')}Add year</button></div></div>`);
      if (card.settings.usesSubject) {
        const subjects = st.subjects.filter((s) => s.cardId === card.id).sort(byOrder);
        out.push(html`<div class="field"><label class="field-label" for="tb-subject">Subject</label><select id="tb-subject" class="select" data-f="subjectId"><option value="">Choose a subject</option>${subjects.map((s) => html`<option value="${s.id}" ${f.subjectId === s.id ? 'selected' : ''}>${s.title}</option>`)}</select>${!subjects.length ? html`<span class="field-help">The admin has not added subjects to this card yet.</span>` : ''}</div>`);
      }
    }
    if (card.template === 'topic_test') {
      const subjects = st.subjects.filter((s) => s.cardId === card.id).sort(byOrder);
      const subs = st.subsections.filter((x) => x.subjectId === f.subjectId).sort(byOrder);
      out.push(html`<div class="field"><label class="field-label" for="tb-subject">Subject</label>
        <select id="tb-subject" class="select" data-act-change="subject"><option value="">Choose a subject</option>${subjects.map((s) => html`<option value="${s.id}" ${f.subjectId === s.id ? 'selected' : ''}>${s.title}</option>`)}</select>
        ${!subjects.length ? html`<span class="field-help">The admin has not added subjects to this card yet.</span>` : ''}</div>`);
      if (subs.length) out.push(html`<div class="field"><label class="field-label" for="tb-sub">Subsection</label>
        <select id="tb-sub" class="select" data-f="subsectionId"><option value="">Choose a subsection</option>${subs.map((x) => html`<option value="${x.id}" ${f.subsectionId === x.id ? 'selected' : ''}>${x.title}</option>`)}</select></div>`);
    }
    return out;
  }

  function questionRow(q, i, n) {
    const issues = BP.content.questionIssues(q);
    const ok = (bad) => (bad ? 'qchip qchip--bad' : 'qchip');
    return html`<li class="qrow">
      <span class="qrow-num">${i + 1}</span>
      <div class="grow stack gap-1">
        <span class="qrow-text clamp-2">${q.en.text || html`<span class="t-muted">No English text yet</span>`}</span>
        <span class="qrow-text qrow-text--ml clamp-2" lang="ml">${q.ml.text || ''}</span>
        <span class="row-wrap gap-2">
          <span class="${ok(issues.some((x) => x.startsWith('English')))}">EN</span>
          <span class="${ok(issues.some((x) => x.startsWith('Malayalam')))}">ML</span>
          <span class="${ok(q.correctIndex == null)}">${q.correctIndex == null ? 'No answer' : 'Answer ' + BP.content.LETTERS[q.correctIndex]}</span>
          ${issues.length ? html`<span class="t-caption qrow-warn">${icon('alert-triangle')}Incomplete</span>` : ''}
        </span>
      </div>
      <div class="qrow-actions">
        <button type="button" class="icon-btn icon-btn--plain" data-act="q-up" data-i="${i}" aria-label="Move question ${i + 1} up" ${i === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
        <button type="button" class="icon-btn icon-btn--plain" data-act="q-down" data-i="${i}" aria-label="Move question ${i + 1} down" ${i === n - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
        <button type="button" class="icon-btn icon-btn--plain" data-act="q-edit" data-i="${i}" aria-label="Edit question ${i + 1}">${icon('pencil')}</button>
        <button type="button" class="icon-btn icon-btn--plain" data-act="q-del" data-i="${i}" aria-label="Delete question ${i + 1}">${icon('trash')}</button>
      </div>
    </li>`;
  }

  const W = () => BP.cr.load('tests', BP.router.current.ctx, blank);
  /** Question changes are saved straight away so no work is lost. */
  function saveQuestions(w, msg) {
    const id = BP.content.save('tests', w.id, w.fields, BP.store.state.session.creatorId, false);
    BP.ui.toast(msg, { type: 'success' });
    if (!w.id) { BP.cr.reset(); BP.router.go('/creator/test/' + id, null, { replace: true }); return; }
    w.item = BP.content.find('tests', id);
    BP.router.render({ rerender: true });
  }

  BP.router.add('/creator/test/:id', {
    role: 'creator', chrome: 'panel', nav: 'new', title: 'Test builder', rerender: false,
    render(ctx) {
      const w = BP.cr.load('tests', ctx, blank);
      if (!w || !w.card) return BP.cr.notFound();
      const f = w.fields;
      return html`${BP.cr.head(w, w.id ? f.title || 'Untitled test' : 'New test')}
        <div class="builder">
          ${BP.cr.statusNotice(w.item)}
          ${BP.cr.card('Test details', html`
            <div class="field"><label class="field-label" for="tb-title">Test title</label>
              <input id="tb-title" class="input" data-f="title" value="${f.title}" placeholder="For example: Degree Level Prelims 2023 · Sample paper 3"></div>
            <div class="form-grid">${filtersFor(w)}</div>
            <div class="form-grid">
              <div class="field"><label class="field-label" for="tb-dur">Duration (minutes)</label><input id="tb-dur" class="input" type="number" min="1" max="180" data-f="durationMin" value="${f.durationMin}"></div>
              <div class="field"><label class="field-label" for="tb-marks">Marks per question</label><input id="tb-marks" class="input" type="number" min="0.25" step="0.25" data-f="marksPerQuestion" value="${f.marksPerQuestion}"></div>
            </div>
            <div class="field"><label class="field-label" for="tb-rules">Rules and instructions</label><textarea id="tb-rules" class="textarea" rows="6" data-f="rules">${f.rules}</textarea><span class="field-help">One rule per line. Users see these before they start.</span></div>
            ${BP.cr.lockedFields(w, { negative: true })}`)}
          ${BP.cr.card('Questions (' + f.questions.length + ')', f.questions.length
            ? html`<ol class="qlist" role="list">${f.questions.map((q, i) => questionRow(q, i, f.questions.length))}</ol>`
            : BP.ui.emptyState({ icon: 'list', title: 'No questions yet', text: 'Add questions in English and Malayalam, with the correct answer for each.' }),
            html`<button type="button" class="btn btn--primary btn--sm" data-act="q-add">${icon('plus')}Add question</button>`)}
          <div id="form-errors"></div>
        </div>
        ${BP.cr.actionBar(w)}`;
    },
    mount(root) {
      const w = W();
      if (!w) return;
      BP.cr.bindFields(root, w);
      const subj = root.querySelector('[data-act-change="subject"]');
      if (subj) subj.addEventListener('change', () => { w.fields.subjectId = subj.value || null; w.fields.subsectionId = null; BP.cr.markDirty(w); BP.router.render({ rerender: true }); });
    },
    actions: {
      stage(el) { const w = W(); w.fields.stage = el.dataset.value; BP.cr.markDirty(w); el.parentElement.querySelectorAll('.seg').forEach((s) => s.setAttribute('aria-selected', String(s === el))); },
      'add-year'() { const w = W(); BP.cr.addYear((y) => { w.fields.year = y; BP.cr.markDirty(w); BP.router.render({ rerender: true }); }); },
      'q-add'() {
        const w = W();
        BP.qeditor.open(null, w.fields.questions.length + 1, (q) => { q.id = BP.store.uid('q'); w.fields.questions.push(q); saveQuestions(w, 'Question added and saved'); });
      },
      'q-edit'(el) {
        const w = W(); const i = Number(el.dataset.i);
        BP.qeditor.open(w.fields.questions[i], i + 1, (q) => { w.fields.questions[i] = q; saveQuestions(w, 'Question ' + (i + 1) + ' saved'); });
      },
      async 'q-del'(el) {
        const w = W(); const i = Number(el.dataset.i);
        const ok = await BP.ui.confirm({ title: 'Delete question ' + (i + 1) + '?', body: 'This removes the question from this test.', confirmLabel: 'Delete', danger: true });
        if (!ok) return;
        w.fields.questions.splice(i, 1);
        saveQuestions(w, 'Question deleted');
      },
      'q-up'(el) { const w = W(); const i = Number(el.dataset.i); const q = w.fields.questions; [q[i - 1], q[i]] = [q[i], q[i - 1]]; saveQuestions(w, 'Order saved'); },
      'q-down'(el) { const w = W(); const i = Number(el.dataset.i); const q = w.fields.questions; [q[i + 1], q[i]] = [q[i], q[i + 1]]; saveQuestions(w, 'Order saved'); },
      save() { BP.cr.persist(W(), false); },
      submit() { BP.cr.persist(W(), true); },
    },
  });
})();
