/* Admin: card form (title, icon, section, flow template + settings, status), subjects/subtopics, years and categories. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile } = BP.ui;
  const byOrder = (a, b) => a.order - b.order;
  let F = null; // working copy of the card form { key, id, card }

  function load(ctx) {
    const key = ctx.hash.split('?')[0] + '|' + (ctx.query.section || '');
    if (F && F.key === key) return F;
    if (ctx.params.id === 'new') {
      const secs = BP.store.q.sections({ includeHidden: true });
      F = { key, id: null, card: { title: '', icon: 'book', sectionId: ctx.query.section || (secs[0] && secs[0].id), template: 'paper_test', settings: { usesStage: true, usesYear: false, usesSubject: false }, status: 'live' } };
    } else {
      const c = BP.store.byId('cards', ctx.params.id);
      F = c ? { key, id: c.id, card: BP.content.clone(c) } : null;
    }
    return F;
  }
  const redraw = () => BP.router.render({ rerender: true });

  /** Published tests a newly switched-on filter would hide from users, because they have no value for it. */
  function hiddenByFilters(f) {
    const c = f.card;
    if (!f.id || c.template !== 'paper_test') return null;
    const checks = [['usesLevel', 'level', 'education level'], ['usesStage', 'stage', 'Prelims / Mains stage'], ['usesYear', 'year', 'year']].filter(([key]) => c.settings[key]);
    const tests = BP.store.q.testsFor(f.id);
    const hidden = tests.filter((t) => checks.some(([, field]) => !t[field]));
    if (!hidden.length) return null;
    const missing = checks.filter(([, field]) => hidden.some((t) => !t[field])).map(([, , label]) => label).join(', ');
    return html`<div class="notice notice--warning">${icon('alert-triangle')}<span>${hidden.length} published ${hidden.length === 1 ? 'test has' : 'tests have'} no ${missing}. Users will not see ${hidden.length === 1 ? 'it' : 'them'} until the creator adds this.</span></div>`;
  }

  function previewTile(c) {
    return BP.homeTile(Object.assign({ id: F && F.id }, c), BP.store.byId('sections', c.sectionId), { preview: true, meta: c.status === 'coming_soon' ? 'Coming soon' : BP.TEMPLATES[c.template].label });
  }

  BP.router.add('/admin/structure/card/:id', {
    role: 'admin', chrome: 'panel', nav: 'structure', title: 'Card', rerender: false,
    render(ctx) {
      const f = load(ctx);
      if (!f) return BP.ui.emptyState({ title: 'Card not found', action: html`<a class="btn btn--secondary" href="#/admin/structure">Back to structure</a>` });
      const c = f.card;
      const secs = BP.store.q.sections({ includeHidden: true });
      const usage = f.id ? ['tests', 'papers', 'applications', 'exams', 'caQuestions'].reduce((n, k) => n + BP.store.state[k].filter((x) => x.cardId === f.id).length, 0) : 0;
      return html`${BP.ad.pageHead(f.id ? 'Edit card' : 'Add a card', null, null, ['#/admin/structure', 'Structure'])}
        <div class="form-layout">
          <div class="stack gap-5">
            <section class="card stack gap-5">
              <div class="form-grid">
                <div class="field"><label class="field-label" for="cf-title">Card title</label><input id="cf-title" class="input" value="${c.title}" placeholder="For example: LDC Special" data-cf="title" aria-describedby="cf-title-err"><span class="field-error" id="cf-title-err" hidden>${icon('alert-circle')}Add a card title</span></div>
                <div class="field"><label class="field-label" for="cf-sec">Section</label><select id="cf-sec" class="select" data-cf="sectionId">${secs.map((s) => html`<option value="${s.id}" ${s.id === c.sectionId ? 'selected' : ''}>${s.title}${s.status === 'hidden' ? ' (hidden)' : ''}</option>`)}</select></div>
              </div>
              <fieldset class="field"><legend class="field-label">Icon</legend>
                <div class="icon-picker" role="radiogroup" aria-label="Card icon">${BP.ICON_CHOICES.map((n) => html`<button type="button" class="icon-pick" role="radio" aria-checked="${String(n === c.icon)}" aria-label="${n.replace(/-/g, ' ')}" data-act="pick-icon" data-v="${n}">${icon(n)}</button>`)}</div>
              </fieldset>
              <fieldset class="field"><legend class="field-label">Status</legend>
                ${BP.ui.segmented([{ value: 'live', label: 'Live' }, { value: 'coming_soon', label: 'Coming soon' }, { value: 'hidden', label: 'Hidden' }], c.status, { act: 'cf-status', label: 'Card status' })}
                <span class="field-help">${{ live: 'Users can open it.', coming_soon: 'Users see it with a "Coming soon" note.', hidden: 'Users never see it. Creators cannot add content to it.' }[c.status]}</span>
              </fieldset>
            </section>
            <section class="card stack gap-4">
              <div><h2 class="t-h3">Flow template</h2><p class="t-caption">Decides the screens users go through after tapping this card.</p></div>
              <div class="choice-grid choice-grid--2" role="radiogroup" aria-label="Flow template">${Object.keys(BP.TEMPLATES).map((k) => html`<label class="choice">
                <input type="radio" name="cf-tpl" value="${k}" ${k === c.template ? 'checked' : ''}>
                <span><span class="choice-title">${BP.TEMPLATES[k].label}</span><br><span class="choice-desc">${BP.TEMPLATES[k].description}</span></span></label>`)}</div>
              ${BP.TEMPLATES[c.template].settings.length ? html`<div class="settings-box"><span class="field-label">Template settings</span>
                ${BP.TEMPLATES[c.template].settings.map((s) => {
                  const locked = s.requires && !c.settings[s.requires];
                  return html`<label class="switch"><input type="checkbox" data-setting="${s.key}" ${c.settings[s.key] && !locked ? 'checked' : ''} ${locked ? 'disabled' : ''}><span class="switch-track"></span><span class="t-body-sm t-strong">${s.label}</span></label>`;
                })}</div>` : ''}
              ${hiddenByFilters(f) || ''}
              ${c.template === 'topic_test' || (c.template === 'paper_test' && c.settings.usesSubject) ? html`<div class="notice">${icon('layers')}<span>${f.id ? html`Manage this card's subjects${c.template === 'topic_test' || c.settings.usesSubtopic ? ' and subtopics' : ''} on the <a href="#/admin/structure/card/${f.id}/subjects">Subjects page</a>.` : `After saving, you can add subjects${c.template === 'topic_test' || c.settings.usesSubtopic ? ' and subtopics' : ''}.`}</span></div>` : ''}
              ${c.template === 'current_affairs' && c.settings.usesSubject ? html`<p class="field-help">Creators add a topic to each question. Users choose a topic after opening a month in Monthly.</p>` : ''}
              ${usage && c.template !== BP.store.byId('cards', f.id).template ? html`<div class="notice notice--warning">${icon('alert-triangle')}<span>This card already has ${usage} content items made for the ${BP.TEMPLATES[BP.store.byId('cards', f.id).template].label} flow. They may not show correctly in the new flow.</span></div>` : ''}
              <div class="notice notice--accent">${icon('lightbulb')}<span><b>New cards need no development. A new kind of flow does.</b> Any card can use any of these five flows.</span></div>
            </section>
          </div>
          <aside class="form-side">
            <div class="card stack gap-3 sticky-side">
              <span class="t-label t-muted">Preview on Home</span>
              <div class="preview-tilebox">${previewTile(c)}</div>
              <p class="t-caption">${(BP.store.byId('sections', c.sectionId) || {}).title || ''} · ${BP.TEMPLATES[c.template].label} flow</p>
              <button type="button" class="btn btn--primary btn--block" data-act="save-card">${icon('check')}${f.id ? 'Save changes' : 'Add card'}</button>
              <a class="btn btn--ghost btn--block" href="#/admin/structure">Cancel</a>
            </div>
          </aside>
        </div>`;
    },
    mount(root) {
      if (!F) return;
      root.querySelectorAll('[data-cf]').forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
        F.card[el.dataset.cf] = el.value;
        if (el.tagName === 'SELECT') redraw();
        else { const t = root.querySelector('.tile--preview .tile-title'); if (t) t.textContent = el.value || 'Card title'; }
      }));
      root.querySelectorAll('input[name="cf-tpl"]').forEach((el) => el.addEventListener('change', () => {
        F.card.template = el.value;
        F.card.settings = el.value === 'paper_test' ? { usesStage: true, usesYear: false, usesSubject: false } : el.value === 'current_affairs' ? { usesSubject: false } : {};
        redraw();
      }));
      root.querySelectorAll('[data-setting]').forEach((el) => el.addEventListener('change', () => {
        const key = el.dataset.setting;
        F.card.settings[key] = el.checked;
        // Settings that depend on this one switch off with it.
        BP.TEMPLATES[F.card.template].settings.filter((s) => s.requires === key && !el.checked).forEach((s) => { F.card.settings[s.key] = false; });
        redraw();
        const again = document.querySelector('[data-setting="' + key + '"]');
        if (again) again.focus();
      }));
    },
    actions: {
      'pick-icon'(el) { F.card.icon = el.dataset.v; redraw(); },
      'cf-status'(el) { F.card.status = el.dataset.value; redraw(); },
      'save-card'() {
        const c = F.card;
        if (!c.title.trim()) { const i = document.getElementById('cf-title'); i.setAttribute('aria-invalid', 'true'); document.getElementById('cf-title-err').hidden = false; i.focus(); return; }
        let id = F.id;
        BP.store.update((s) => {
          if (id) Object.assign(s.cards.find((x) => x.id === id), { title: c.title.trim(), icon: c.icon, sectionId: c.sectionId, template: c.template, settings: c.settings, status: c.status });
          else {
            id = BP.store.uid('card');
            s.cards.push({ id, sectionId: c.sectionId, order: BP.ad.nextOrder(s.cards.filter((x) => x.sectionId === c.sectionId)), title: c.title.trim(), icon: c.icon, template: c.template, settings: c.settings, status: c.status });
          }
        });
        const isNew = !F.id;
        F = null;
        BP.ui.toast(isNew ? 'Card added. ' + (c.status === 'live' ? 'Users can see it now.' : '') : 'Card saved', { type: 'success' });
        BP.router.go(isNew && (c.template === 'topic_test' || (c.template === 'paper_test' && c.settings.usesSubject)) ? '/admin/structure/card/' + id + '/subjects' : '/admin/structure');
      },
    },
  });

  /* ---------- Subjects and subtopics (Topic Test and subject-filtered Paper Test cards) ---------- */
  BP.router.add('/admin/structure/card/:id/subjects', {
    role: 'admin', chrome: 'panel', nav: 'structure', title: 'Subjects',
    render(ctx) {
      const card = BP.store.byId('cards', ctx.params.id);
      if (!card || (card.template !== 'topic_test' && !(card.template === 'paper_test' && card.settings.usesSubject))) return BP.ui.emptyState({ title: 'Subjects are not enabled for this card' });
      const st = BP.store.state;
      const subjects = st.subjects.filter((s) => s.cardId === card.id).sort(byOrder);
      const isTopic = card.template === 'topic_test';
      const usesSubtopics = isTopic || card.settings.usesSubtopic;
      const intro = isTopic ? 'Users choose a subject, then a subtopic if the subject has any. Creators pick from these when building tests.'
        : 'Users filter this card\'s tests by subject' + (usesSubtopics ? ', then by subtopic' : '') + '. Creators pick from these when building tests.';
      return html`${BP.ad.pageHead(card.title + ': subjects', intro,
          html`<button type="button" class="btn btn--primary" data-act="add-subject">${icon('plus')}Add subject</button>`, ['#/admin/structure', 'Structure'])}
        ${subjects.length ? html`<div class="stack gap-4">${subjects.map((s, i) => {
          const subs = st.subsections.filter((x) => x.subjectId === s.id).sort(byOrder);
          return html`<section class="card card--flush struct-section">
            <header class="struct-head">${iconTile(s.icon || 'book', '', 'sm')}<div class="grow"><h2 class="t-h3">${s.title}</h2><span class="t-caption">${usesSubtopics ? (subs.length ? subs.length + (subs.length === 1 ? ' subtopic' : ' subtopics') : 'No subtopics: users go straight to the tests') + ' · ' : ''}${((n) => n + (n === 1 ? ' published test' : ' published tests'))(BP.store.q.testsFor(card.id, { subjectId: s.id }).length)}</span></div>
              <button type="button" class="icon-btn icon-btn--plain" data-act="subj-up" data-id="${s.id}" aria-label="Move ${s.title} up" ${i === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
              <button type="button" class="icon-btn icon-btn--plain" data-act="subj-down" data-id="${s.id}" aria-label="Move ${s.title} down" ${i === subjects.length - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
              <button type="button" class="icon-btn icon-btn--plain" data-act="subj-rename" data-id="${s.id}" aria-label="Rename ${s.title}">${icon('pencil')}</button></header>
            ${usesSubtopics && subs.length ? html`<ul class="struct-cards" role="list">${subs.map((x, j) => html`<li class="struct-card">${icon('list')}<span class="grow">${x.title}</span>
              <button type="button" class="icon-btn icon-btn--plain" data-act="sub-up" data-id="${x.id}" aria-label="Move ${x.title} up" ${j === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
              <button type="button" class="icon-btn icon-btn--plain" data-act="sub-down" data-id="${x.id}" aria-label="Move ${x.title} down" ${j === subs.length - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
              <button type="button" class="icon-btn icon-btn--plain" data-act="sub-rename" data-id="${x.id}" aria-label="Rename ${x.title}">${icon('pencil')}</button></li>`)}</ul>` : ''}
            ${usesSubtopics ? html`<footer class="struct-foot"><button type="button" class="btn btn--ghost btn--sm" data-act="add-sub" data-id="${s.id}">${icon('plus')}Add subtopic</button></footer>` : ''}
          </section>`;
        })}</div>` : BP.ui.emptyState({ icon: 'layers', title: 'No subjects yet', text: 'Add the first subject, for example "Kerala History".' })}`;
    },
    actions: {
      'add-subject'(el, e, ctx) {
        BP.ad.prompt({ title: 'Add a subject', label: 'Subject name', placeholder: 'For example: Indian Geography', confirm: 'Add subject' }, (v) => {
          BP.store.update((s) => { s.subjects.push({ id: BP.store.uid('subj'), cardId: ctx.params.id, title: v, icon: 'book', order: BP.ad.nextOrder(s.subjects.filter((x) => x.cardId === ctx.params.id)) }); });
          BP.ui.toast('Subject added', { type: 'success' });
        });
      },
      'subj-rename'(el) { const s0 = BP.store.byId('subjects', el.dataset.id); BP.ad.prompt({ title: 'Rename subject', label: 'Subject name', value: s0.title }, (v) => { BP.store.update((s) => { s.subjects.find((x) => x.id === s0.id).title = v; }); }); },
      'add-sub'(el) {
        BP.ad.prompt({ title: 'Add a subtopic', label: 'Subtopic name', placeholder: 'For example: Social reformers', confirm: 'Add subtopic' }, (v) => {
          BP.store.update((s) => { s.subsections.push({ id: BP.store.uid('subsec'), subjectId: el.dataset.id, title: v, order: BP.ad.nextOrder(s.subsections.filter((x) => x.subjectId === el.dataset.id)) }); });
          BP.ui.toast('Subtopic added', { type: 'success' });
        });
      },
      'sub-rename'(el) { const x0 = BP.store.byId('subsections', el.dataset.id); BP.ad.prompt({ title: 'Rename subtopic', label: 'Subtopic name', value: x0.title }, (v) => { BP.store.update((s) => { s.subsections.find((x) => x.id === x0.id).title = v; }); }); },
      'subj-up'(el) { BP.ad.move('subjects', el.dataset.id, -1, (a, b) => a.cardId === b.cardId); },
      'subj-down'(el) { BP.ad.move('subjects', el.dataset.id, 1, (a, b) => a.cardId === b.cardId); },
      'sub-up'(el) { BP.ad.move('subsections', el.dataset.id, -1, (a, b) => a.subjectId === b.subjectId); },
      'sub-down'(el) { BP.ad.move('subsections', el.dataset.id, 1, (a, b) => a.subjectId === b.subjectId); },
    },
  });

  /* ---------- Years (shared) and download categories ---------- */
  BP.router.add('/admin/structure/lists', {
    role: 'admin', chrome: 'panel', nav: 'structure', title: 'Years and categories',
    render() {
      const st = BP.store.state;
      const cats = st.downloadCategories.slice().sort(byOrder);
      return html`${BP.ad.pageHead('Years and categories', null, null, ['#/admin/structure', 'Structure'])}
        <div class="dash-grid">
          <section class="card stack gap-4"><div class="row-between"><div><h2 class="t-h3">Years</h2><p class="t-caption">Shared by every card. Creators can add years too.</p></div><button type="button" class="btn btn--primary btn--sm" data-act="add-year">${icon('plus')}Add year</button></div>
            <div class="row-wrap gap-2">${st.years.slice().sort((a, b) => b - a).map((y) => html`<span class="chip chip--static">${y}</span>`)}</div></section>
          <section class="card stack gap-4"><div class="row-between"><div><h2 class="t-h3">Download categories</h2><p class="t-caption">Only the admin can add categories.</p></div><button type="button" class="btn btn--primary btn--sm" data-act="add-cat">${icon('plus')}Add category</button></div>
            <ul class="struct-cards struct-cards--boxed" role="list">${cats.map((c, i) => html`<li class="struct-card">${icon('folder')}<span class="grow">${c.title}</span><span class="t-caption">${((n) => n + (n === 1 ? ' paper' : ' papers'))(st.papers.filter((p) => p.categoryId === c.id && p.status === 'published').length)}</span>
              <button type="button" class="icon-btn icon-btn--plain" data-act="cat-up" data-id="${c.id}" aria-label="Move ${c.title} up" ${i === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
              <button type="button" class="icon-btn icon-btn--plain" data-act="cat-down" data-id="${c.id}" aria-label="Move ${c.title} down" ${i === cats.length - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
              <button type="button" class="icon-btn icon-btn--plain" data-act="cat-rename" data-id="${c.id}" aria-label="Rename ${c.title}">${icon('pencil')}</button></li>`)}</ul></section>
        </div>`;
    },
    actions: {
      'add-year'() { BP.cr.addYear(() => BP.router.refresh()); },
      'add-cat'() {
        BP.ad.prompt({ title: 'Add a download category', label: 'Category name', placeholder: 'For example: Plus Two', confirm: 'Add category' }, (v) => {
          if (BP.store.state.downloadCategories.some((c) => c.title.toLowerCase() === v.toLowerCase())) return 'That category already exists';
          BP.store.update((s) => { s.downloadCategories.push({ id: BP.store.uid('dc'), title: v, order: BP.ad.nextOrder(s.downloadCategories) }); });
          BP.ui.toast('Category added', { type: 'success' });
        });
      },
      'cat-rename'(el) { const c0 = BP.store.byId('downloadCategories', el.dataset.id); BP.ad.prompt({ title: 'Rename category', label: 'Category name', value: c0.title }, (v) => { BP.store.update((s) => { s.downloadCategories.find((x) => x.id === c0.id).title = v; }); }); },
      'cat-up'(el) { BP.ad.move('downloadCategories', el.dataset.id, -1, () => true); },
      'cat-down'(el) { BP.ad.move('downloadCategories', el.dataset.id, 1, () => true); },
    },
  });
})();
