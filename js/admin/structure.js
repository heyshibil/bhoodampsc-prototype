/* Admin structure: sections (add, rename, reorder, hide) and their cards (reorder, status, edit). */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile, tag } = BP.ui;
  const sameSection = (a, b) => a.sectionId === b.sectionId;
  const all = () => true;

  function settingTags(c) {
    const s = c.settings || {};
    if (c.template !== 'paper_test' && c.template !== 'current_affairs') return '';
    return html`${s.usesStage ? tag('primary', 'Prelims / Mains') : ''}${s.usesYear ? tag('primary', 'Year') : ''}${s.usesSubject ? tag('primary', c.template === 'current_affairs' ? 'Monthly subjects' : 'Subject') : ''}`;
  }
  function contentCount(c) {
    const st = BP.store.state;
    const n = ['tests', 'papers', 'applications', 'exams', 'caQuestions'].reduce((sum, k) => sum + st[k].filter((x) => x.cardId === c.id && x.status === 'published').length, 0);
    return n + ' published';
  }

  BP.router.add('/admin/structure', {
    role: 'admin', chrome: 'panel', nav: 'structure', title: 'Structure',
    render() {
      const secs = BP.store.q.sections({ includeHidden: true });
      return html`${BP.ad.pageHead('Structure', 'Sections and cards on the User Home, in this order. New cards need no development. A new kind of flow does.',
          html`<a class="btn btn--secondary" href="#/admin/structure/lists">${icon('calendar')}Years and categories</a><button type="button" class="btn btn--primary" data-act="add-section">${icon('plus')}Add section</button>`)}
        <div class="stack gap-5">${secs.map((s, si) => {
          const cards = BP.store.q.cardsOf(s.id, { includeHidden: true });
          return html`<section class="card card--flush struct-section ${s.status === 'hidden' ? 'is-hidden' : ''}" aria-labelledby="sh-${s.id}">
            <header class="struct-head">
              <div class="grow row-wrap gap-2"><span class="theme-dot theme-${BP.themeOf(s)}" title="Colour: ${BP.themeOf(s)}"></span><h2 class="t-h2" id="sh-${s.id}">${s.title}</h2>${s.status === 'hidden' ? BP.ui.pill('hidden', 'Hidden') : BP.ui.pill('live', 'Visible')}<span class="t-caption">${cards.length} ${cards.length === 1 ? 'card' : 'cards'}</span></div>
              <div class="row gap-1">
                <button type="button" class="icon-btn icon-btn--plain" data-act="sec-up" data-id="${s.id}" aria-label="Move ${s.title} up" ${si === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
                <button type="button" class="icon-btn icon-btn--plain" data-act="sec-down" data-id="${s.id}" aria-label="Move ${s.title} down" ${si === secs.length - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
                <button type="button" class="icon-btn icon-btn--plain" data-act="sec-rename" data-id="${s.id}" aria-label="Rename ${s.title}">${icon('pencil')}</button>
                <button type="button" class="icon-btn icon-btn--plain" data-act="sec-theme" data-id="${s.id}" aria-label="Change colour of ${s.title}">${icon('palette')}</button>
                <button type="button" class="icon-btn icon-btn--plain" data-act="sec-toggle" data-id="${s.id}" aria-label="${s.status === 'hidden' ? 'Show' : 'Hide'} ${s.title}">${icon(s.status === 'hidden' ? 'eye' : 'eye-off')}</button>
              </div>
            </header>
            ${cards.length ? html`<ul class="struct-cards" role="list">${cards.map((c, ci) => html`<li class="struct-card ${c.status === 'hidden' ? 'is-hidden' : ''}">
                ${iconTile(c.icon, c.status === 'live' ? 'primary' : 'neutral', 'sm')}
                <div class="grow stack gap-1">
                  <span class="row-wrap gap-2"><b class="t-strong">${c.title}</b>${BP.ui.cardPill(c.status)}</span>
                  <span class="row-wrap gap-2 t-caption">${BP.TEMPLATES[c.template].label} flow ${settingTags(c)} · ${contentCount(c)}</span>
                </div>
                <div class="row gap-1 struct-actions">
                  <button type="button" class="icon-btn icon-btn--plain" data-act="card-up" data-id="${c.id}" aria-label="Move ${c.title} up" ${ci === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
                  <button type="button" class="icon-btn icon-btn--plain" data-act="card-down" data-id="${c.id}" aria-label="Move ${c.title} down" ${ci === cards.length - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
                  ${c.template === 'topic_test' || (c.template === 'paper_test' && c.settings.usesSubject) ? html`<a class="btn btn--ghost btn--sm" href="#/admin/structure/card/${c.id}/subjects">Subjects</a>` : ''}
                  <a class="btn btn--secondary btn--sm" href="#/admin/structure/card/${c.id}">${icon('pencil')}Edit</a>
                </div>
              </li>`)}</ul>` : html`<p class="t-body-sm t-muted struct-empty">No cards in this section yet.</p>`}
            <footer class="struct-foot"><a class="btn btn--ghost btn--sm" href="#/admin/structure/card/new?section=${s.id}">${icon('plus')}Add card to ${s.title}</a></footer>
          </section>`;
        })}</div>`;
    },
    actions: {
      'add-section'() {
        BP.ad.prompt({ title: 'Add a section', label: 'Section name', placeholder: 'For example: Boodham Specials', confirm: 'Add section', help: 'It appears at the bottom of Home. Add cards to it next.' }, (v) => {
          BP.store.update((s) => {
            const used = s.sections.map((x) => x.theme);
            const theme = (BP.SECTION_THEMES.find((t) => !used.includes(t.value)) || BP.SECTION_THEMES[s.sections.length % BP.SECTION_THEMES.length]).value;
            s.sections.push({ id: BP.store.uid('sec'), title: v, order: BP.ad.nextOrder(s.sections), status: 'visible', theme });
          });
          BP.ui.toast('Section added', { type: 'success' });
        });
      },
      'sec-rename'(el) {
        const sec = BP.store.byId('sections', el.dataset.id);
        BP.ad.prompt({ title: 'Rename section', label: 'Section name', value: sec.title }, (v) => {
          BP.store.update((s) => { s.sections.find((x) => x.id === sec.id).title = v; });
          BP.ui.toast('Section renamed', { type: 'success' });
        });
      },
      'sec-theme'(el) {
        const sec = BP.store.byId('sections', el.dataset.id);
        const cur = BP.themeOf(sec);
        const sample = (BP.store.q.cardsOf(sec.id)[0]) || { title: 'Card title', icon: 'book', status: 'live', template: 'paper_test' };
        BP.ui.sheet({
          title: 'Colour for ' + sec.title,
          body: html`<div class="stack gap-4">
            <p class="t-body-sm t-muted">Cards in this section use this colour on the User Home.</p>
            <div class="theme-picker" role="radiogroup" aria-label="Section colour">${BP.SECTION_THEMES.map((t) => html`<label class="theme-opt">
              <input type="radio" name="sec-theme" value="${t.value}" ${t.value === cur ? 'checked' : ''}>
              ${BP.homeTile(sample, Object.assign({}, sec, { theme: t.value }), { preview: true })}<span class="t-body-sm t-strong">${t.label}</span></label>`)}</div>
          </div>`,
          size: 'wide',
          foot: html`<button type="button" class="btn btn--secondary" data-act="close">Cancel</button><button type="button" class="btn btn--primary" data-act="save-theme">Save colour</button>`,
          actions: {
            'save-theme'(b, e, api) {
              const v = api.el.querySelector('input[name="sec-theme"]:checked').value;
              api.close();
              BP.store.update((s) => { s.sections.find((x) => x.id === sec.id).theme = v; });
              BP.ui.toast('Colour saved. Users see it on Home now.', { type: 'success' });
            },
          },
        });
      },
      'sec-toggle'(el) {
        let now;
        BP.store.update((s) => { const x = s.sections.find((y) => y.id === el.dataset.id); x.status = x.status === 'hidden' ? 'visible' : 'hidden'; now = x.status; });
        BP.ui.toast(now === 'hidden' ? 'Section hidden from users' : 'Section visible to users', { type: 'success' });
      },
      'sec-up'(el) { BP.ad.move('sections', el.dataset.id, -1, all); },
      'sec-down'(el) { BP.ad.move('sections', el.dataset.id, 1, all); },
      'card-up'(el) { BP.ad.move('cards', el.dataset.id, -1, sameSection); },
      'card-down'(el) { BP.ad.move('cards', el.dataset.id, 1, sameSection); },
    },
  });
})();
