/* Creator forms: PSC application / exam, question paper (mock upload), current affairs question. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon } = BP.ui;
  const byOrder = (a, b) => a.order - b.order;
  const W = (type, blank) => BP.cr.load(type, BP.router.current.ctx, blank);
  const today = () => BP.seed.isoDaysAgo(new Date(), 0);

  const text = (id, label, f, val, opts) => html`<div class="field ${opts && opts.wide ? 'field--wide' : ''}"><label class="field-label" for="${id}">${label}${opts && opts.optional ? html` <span class="field-opt">(optional)</span>` : ''}</label>
    <input id="${id}" class="input" ${opts && opts.type ? html`type="${opts.type}"` : ''} data-f="${f}" value="${val || ''}" placeholder="${(opts && opts.ph) || ''}">${opts && opts.help ? html`<span class="field-help">${opts.help}</span>` : ''}</div>`;
  const area = (id, label, f, val, opts) => html`<div class="field field--wide"><label class="field-label" for="${id}">${label}${opts && opts.optional ? html` <span class="field-opt">(optional)</span>` : ''}</label>
    <textarea id="${id}" class="textarea" data-f="${f}" placeholder="${(opts && opts.ph) || ''}">${val || ''}</textarea></div>`;
  const common = { save: (type) => () => BP.cr.persist(W(type), false), submit: (type) => () => BP.cr.persist(W(type), true) };

  /* ---------- PSC application / exam ---------- */
  const blankApp = () => ({ title: '', qualification: '', lastDate: '', vacancy: '', extraQualifications: '', stage: 'Prelims', otherDetails: '', officialLink: '' });
  const blankExam = () => ({ title: '', startDate: '', endDate: '', otherDetails: '', officialLink: '' });

  BP.router.add('/creator/notice/:kind/:id', {
    role: 'creator', chrome: 'panel', nav: 'new', title: 'PSC notification', rerender: false,
    render(ctx) {
      const isApp = ctx.params.kind !== 'exam';
      const type = isApp ? 'applications' : 'exams';
      const w = BP.cr.load(type, ctx, isApp ? blankApp : blankExam);
      if (!w) return BP.cr.notFound();
      const f = w.fields;
      return html`${BP.cr.head(w, w.id ? f.title || 'Untitled' : isApp ? 'New PSC application' : 'New PSC exam')}
        <div class="builder">
          ${BP.cr.statusNotice(w.item)}
          ${BP.cr.card(isApp ? 'Application details' : 'Exam details', html`<div class="form-grid">
            ${text('n-title', isApp ? 'Post name' : 'Exam name', 'title', f.title, { wide: true, ph: isApp ? 'For example: Lower Division Clerk (various departments)' : 'For example: LDC preliminary exam' })}
            ${isApp ? html`
              ${text('n-qual', 'Qualification', 'qualification', f.qualification, { ph: 'For example: Pass in SSLC or equivalent' })}
              ${text('n-last', 'Last date to apply', 'lastDate', f.lastDate, { type: 'date' })}
              ${text('n-vac', 'Vacancies', 'vacancy', f.vacancy, { ph: 'Number, or "Anticipated vacancies"' })}
              <div class="field"><label class="field-label" for="n-stage">Exam stage</label><select id="n-stage" class="select" data-f="stage">${['Prelims', 'Mains'].map((s) => html`<option ${f.stage === s ? 'selected' : ''}>${s}</option>`)}</select></div>
              ${text('n-extra', 'Extra qualifications', 'extraQualifications', f.extraQualifications, { wide: true, optional: true })}`
            : html`${text('n-start', 'Exam start date', 'startDate', f.startDate, { type: 'date' })}${text('n-end', 'Exam end date', 'endDate', f.endDate, { type: 'date' })}`}
            ${area('n-other', 'Other details', 'otherDetails', f.otherDetails, { optional: true, ph: 'Anything else candidates should know' })}
            ${text('n-link', 'Official PSC link', 'officialLink', f.officialLink, { wide: true, optional: true, type: 'url', ph: 'https://www.keralapsc.gov.in/...', help: 'Shown to users as a button if filled.' })}
          </div>
          <div class="notice">${icon('bell')}<span>When the admin approves this, every user gets an in-app alert and a push notification.</span></div>`)}
          <div id="form-errors"></div>
        </div>${BP.cr.actionBar(w)}`;
    },
    mount(root, ctx) { const w = W(ctx.params.kind === 'exam' ? 'exams' : 'applications'); if (w) BP.cr.bindFields(root, w); },
    actions: {
      save(el, e, ctx) { common.save(ctx.params.kind === 'exam' ? 'exams' : 'applications')(); },
      submit(el, e, ctx) { common.submit(ctx.params.kind === 'exam' ? 'exams' : 'applications')(); },
    },
  });

  /* ---------- Question paper (mock upload) ---------- */
  const blankPaper = () => ({ title: '', categoryId: null, year: null, fileName: '', fileSize: 0 });
  BP.router.add('/creator/paper/:id', {
    role: 'creator', chrome: 'panel', nav: 'new', title: 'Question paper', rerender: false,
    render(ctx) {
      const w = BP.cr.load('papers', ctx, blankPaper);
      if (!w) return BP.cr.notFound();
      const f = w.fields, st = BP.store.state;
      return html`${BP.cr.head(w, w.id ? f.title || 'Untitled paper' : 'New question paper')}
        <div class="builder">
          ${BP.cr.statusNotice(w.item)}
          ${BP.cr.card('Paper details', html`<div class="form-grid">
            ${text('p-title', 'Paper title', 'title', f.title, { wide: true, ph: 'For example: Lower Division Clerk · 2023' })}
            <div class="field"><label class="field-label" for="p-cat">Category</label>
              <select id="p-cat" class="select" data-f="categoryId"><option value="">Choose a category</option>${st.downloadCategories.slice().sort(byOrder).map((c) => html`<option value="${c.id}" ${f.categoryId === c.id ? 'selected' : ''}>${c.title}</option>`)}</select>
              <span class="field-help">Only the admin can add categories.</span></div>
            <div class="field"><label class="field-label" for="p-year">Year</label>
              <div class="row gap-2"><select id="p-year" class="select" data-f="year" data-num="1"><option value="">Choose a year</option>${st.years.slice().sort((a, b) => b - a).map((y) => html`<option value="${y}" ${f.year === y ? 'selected' : ''}>${y}</option>`)}</select>
              <button type="button" class="btn btn--secondary shrink-0" data-act="add-year">${icon('plus')}Add year</button></div></div>
          </div>
          <div class="field"><span class="field-label">Paper file (PDF)</span>
            <label class="dropzone" for="p-file">
              ${BP.cr.iconTile(f.fileName ? 'file-text' : 'upload', f.fileName ? 'success' : '')}
              <span class="grow"><span class="t-h3 block" id="p-file-name">${f.fileName || 'Choose a PDF file'}</span><span class="t-caption" id="p-file-meta">${f.fileName ? Math.round((f.fileSize || 0) / 1024) + ' KB · ready' : 'Demo upload: the file stays on this device.'}</span></span>
              <span class="btn btn--secondary btn--sm">${f.fileName ? 'Replace' : 'Browse'}</span>
            </label>
            <input id="p-file" class="visually-hidden" type="file" accept="application/pdf,.pdf">
            <div class="progress mt-2" id="p-prog" hidden><span style="width:0%"></span></div>
          </div>
          ${BP.cr.lockedFields(w)}`)}
          <div id="form-errors"></div>
        </div>${BP.cr.actionBar(w)}`;
    },
    mount(root) {
      const w = W('papers');
      if (!w) return;
      BP.cr.bindFields(root, w);
      const input = root.querySelector('#p-file');
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        if (!/\.pdf$/i.test(file.name)) { BP.ui.toast('Choose a PDF file', { type: 'error' }); return; }
        const prog = root.querySelector('#p-prog'); const bar = prog.firstElementChild;
        prog.hidden = false; let p = 0;
        const t = setInterval(() => {
          p += 20; bar.style.width = p + '%';
          if (p >= 100) {
            clearInterval(t);
            w.fields.fileName = file.name; w.fields.fileSize = file.size; BP.cr.markDirty(w);
            root.querySelector('#p-file-name').textContent = file.name;
            root.querySelector('#p-file-meta').textContent = Math.round(file.size / 1024) + ' KB · uploaded (demo)';
            BP.ui.toast('File uploaded (demo)', { type: 'success' });
          }
        }, 120);
      });
    },
    actions: {
      'add-year'() { const w = W('papers'); BP.cr.addYear((y) => { w.fields.year = y; BP.cr.markDirty(w); BP.router.render({ rerender: true }); }); },
      save: common.save('papers'), submit: common.submit('papers'),
    },
  });

  /* ---------- Current affairs question ---------- */
  const blankCa = () => Object.assign(BP.qeditor.blank(), { publishDate: today() });
  BP.router.add('/creator/ca/:id', {
    role: 'creator', chrome: 'panel', nav: 'new', title: 'Current affairs question', rerender: false,
    render(ctx) {
      const w = BP.cr.load('caQuestions', ctx, blankCa);
      if (!w) return BP.cr.notFound();
      const f = w.fields;
      const bucket = f.publishDate ? BP.content.caBucket(f.publishDate) : null;
      const where = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', scheduled: 'not shown until that date' }[bucket];
      return html`${BP.cr.head(w, w.id ? 'Current affairs question' : 'New current affairs question')}
        <div class="builder">
          ${BP.cr.statusNotice(w.item)}
          ${BP.cr.card('Publish date', html`<div class="form-grid">
            ${text('ca-date', 'Publish date', 'publishDate', f.publishDate, { type: 'date' })}
            <div class="field"><span class="field-label">Where users will see it today</span><p class="t-body" id="ca-where">${where ? (bucket === 'scheduled' ? 'Scheduled: ' + where : 'Current Affairs › ' + where) : '–'}</p></div>
          </div>
          <p class="t-caption">Questions move from Daily to Weekly to Monthly on their own: days 0–6, days 7–27, then day 28 onward.</p>`)}
          ${w.card.settings.usesSubject ? BP.cr.card('Monthly subject', html`<div class="field"><label class="field-label" for="ca-subject">Subject</label><input id="ca-subject" class="input" data-f="subject" value="${f.subject || ''}" placeholder="For example: Art, Malayalam, English or GK"><span class="field-help">Users see this subject as a filter in Monthly.</span></div>`) : ''}
          ${BP.cr.card('Question', BP.qeditor.form(f, 'caq'))}
          <div id="form-errors"></div>
        </div>${BP.cr.actionBar(w)}`;
    },
    mount(root) {
      const w = W('caQuestions');
      if (!w) return;
      BP.cr.bindFields(root, w);
      BP.qeditor.bind(root, w.fields, 'caq', () => BP.cr.markDirty(w));
      const d = root.querySelector('#ca-date');
      d.addEventListener('change', () => {
        const b = d.value ? BP.content.caBucket(d.value) : null;
        root.querySelector('#ca-where').textContent = !b ? '–' : b === 'scheduled' ? 'Scheduled: not shown until that date' : 'Current Affairs › ' + { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[b];
      });
    },
    actions: { save: common.save('caQuestions'), submit: common.submit('caQuestions') },
  });
})();
