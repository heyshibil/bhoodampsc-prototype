/* Shared Admin pieces: page header, text prompt sheet, reorder helper, type metadata. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon } = BP.ui;

  function pageHead(title, sub, actions, back) {
    return html`<div class="page-head"><div class="grow">
      ${back ? html`<a class="link-btn" href="${back[0]}">${icon('arrow-left')}${back[1]}</a>` : ''}
      <h1 class="t-h1">${title}</h1>${sub ? html`<p>${sub}</p>` : ''}</div>${actions ? html`<div class="row-wrap gap-2">${actions}</div>` : ''}</div>`;
  }

  /** Ask for one line of text. onSave(value) — return a string to show it as an error instead. */
  function prompt(o, onSave) {
    BP.ui.sheet({
      title: o.title,
      body: html`<div class="field"><label class="field-label" for="pr-in">${o.label}</label>
        <input id="pr-in" class="input" value="${o.value || ''}" placeholder="${o.placeholder || ''}" autofocus aria-describedby="pr-err">
        <span class="field-error" id="pr-err" hidden></span>${o.help ? html`<span class="field-help">${o.help}</span>` : ''}</div>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Cancel</button><button type="button" class="btn btn--primary" data-act="ok">${o.confirm || 'Save'}</button>`,
      onMount(el, api) {
        const input = el.querySelector('#pr-in');
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.querySelector('[data-act="ok"]').click(); } });
        setTimeout(() => input.select(), 50);
      },
      actions: {
        ok(el, e, api) {
          const input = api.el.querySelector('#pr-in');
          const v = input.value.trim().replace(/\s+/g, ' ');
          const err = api.el.querySelector('#pr-err');
          const problem = !v ? 'This cannot be empty' : onSave(v);
          if (typeof problem === 'string') { err.innerHTML = BP.icon('alert-circle') + problem; err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
          api.close();
        },
      },
    });
  }

  /** Swap an item's order with its neighbour among siblings (same filter). dir: -1 up, +1 down. */
  function move(collection, id, dir, sameGroup) {
    BP.store.update((s) => {
      const list = s[collection];
      const item = list.find((x) => x.id === id);
      const sibs = list.filter((x) => sameGroup(x, item)).sort((a, b) => a.order - b.order);
      sibs.forEach((x, i) => { x.order = i + 1; }); // normalise
      const i = sibs.indexOf(item), j = i + dir;
      if (j < 0 || j >= sibs.length) return;
      const t = sibs[i].order; sibs[i].order = sibs[j].order; sibs[j].order = t;
    });
  }
  const nextOrder = (list) => list.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1;

  const TYPE_TABS = [
    { value: 'tests', label: 'Tests' }, { value: 'papers', label: 'Papers' }, { value: 'applications', label: 'Applications' },
    { value: 'exams', label: 'Exams' }, { value: 'caQuestions', label: 'Current affairs' },
  ];
  const creatorName = (id) => { const c = BP.store.byId('creators', id); return c ? c.name : 'Admin'; };

  BP.ad = { pageHead, prompt, move, nextOrder, TYPE_TABS, creatorName };
})();
