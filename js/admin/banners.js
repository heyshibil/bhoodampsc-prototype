/* Admin banners: list with order and active switch, live Home preview (none / single / carousel), add/edit form. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile } = BP.ui;
  const byOrder = (a, b) => a.order - b.order;
  let cleanup = () => {};
  let B = null; // working copy for the form

  function previewArea(list) {
    return html`<div class="phone-frame"><div class="phone-screen">
      <div class="phone-top">${raw(BP.logo())}</div>
      ${list.length ? BP.banners.render(list, { preview: true }) : html`<div class="phone-empty">${icon('eye-off')}No active banner: the banner area is hidden on Home.</div>`}
      <div class="phone-ghost-lines"><span></span><span></span><span></span></div>
    </div></div>`;
  }

  BP.router.add('/admin/banners', {
    role: 'admin', chrome: 'panel', nav: 'banners', title: 'Banners',
    render() {
      const list = BP.store.state.banners.slice().sort(byOrder);
      const active = BP.store.q.activeBanners();
      return html`${BP.ad.pageHead('Banners', 'Shown at the top of the User Home. One active banner shows alone; two or more become a carousel.',
          html`<a class="btn btn--primary" href="#/admin/banners/new">${icon('plus')}Add banner</a>`)}
        <div class="form-layout">
          <div class="stack gap-3">
            ${list.length ? list.map((b, i) => html`<div class="card banner-row ${b.active ? '' : 'is-off'}">
              <div class="banner-thumb">${BP.banners.render([b], { preview: true })}</div>
              <div class="grow stack gap-1"><b class="t-strong clamp-2">${b.title}</b><span class="t-caption">${icon(b.linkType === 'external' ? 'external-link' : b.linkType === 'internal' ? 'link' : 'minus')} ${BP.banners.describeTarget(b)}</span></div>
              <div class="banner-row-actions">
                <label class="switch"><input type="checkbox" data-toggle="${b.id}" ${b.active ? 'checked' : ''}><span class="switch-track"></span><span class="t-body-sm">${b.active ? 'Active' : 'Off'}</span></label>
                <div class="row gap-1">
                  <button type="button" class="icon-btn icon-btn--plain" data-act="up" data-id="${b.id}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
                  <button type="button" class="icon-btn icon-btn--plain" data-act="down" data-id="${b.id}" aria-label="Move down" ${i === list.length - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
                  <a class="btn btn--secondary btn--sm" href="#/admin/banners/${b.id}">${icon('pencil')}Edit</a>
                </div>
              </div>
            </div>`) : BP.ui.emptyState({ icon: 'image', title: 'No banners yet', text: 'Add one to promote an offer or announcement.' })}
          </div>
          <aside class="form-side"><div class="sticky-side stack gap-3">
            <span class="t-label t-muted">Live preview of Home · ${active.length === 0 ? 'hidden' : active.length === 1 ? 'single banner' : 'carousel of ' + active.length}</span>
            ${previewArea(active)}
          </div></aside>
        </div>`;
    },
    mount(root) {
      cleanup = BP.banners.mount(root.querySelector('.form-side') || root);
      root.querySelectorAll('[data-toggle]').forEach((el) => el.addEventListener('change', () => {
        BP.store.update((s) => { s.banners.find((b) => b.id === el.dataset.toggle).active = el.checked; });
        BP.ui.toast(el.checked ? 'Banner is active' : 'Banner turned off', { type: 'success' });
      }));
    },
    unmount() { cleanup(); },
    actions: {
      up(el) { BP.ad.move('banners', el.dataset.id, -1, () => true); },
      down(el) { BP.ad.move('banners', el.dataset.id, 1, () => true); },
    },
  });

  /* ---------- Form ---------- */
  function loadB(ctx) {
    if (B && B.key === ctx.hash) return B;
    const b = ctx.params.id === 'new' ? { title: '', background: 'blue', image: null, linkType: 'none', internalTarget: { type: 'card', id: '' }, externalUrl: '', active: true } : BP.content.clone(BP.store.byId('banners', ctx.params.id) || {});
    if (!b.internalTarget) b.internalTarget = { type: 'card', id: '' };
    B = { key: ctx.hash, id: ctx.params.id === 'new' ? null : ctx.params.id, b };
    return B;
  }
  const redraw = () => BP.router.render({ rerender: true });

  function targetOptions(type) {
    const st = BP.store.state;
    if (type === 'section') return BP.store.q.sections().map((s) => ({ v: s.id, l: s.title }));
    if (type === 'card') return BP.store.q.sections().flatMap((s) => BP.store.q.cardsOf(s.id).filter((c) => c.status === 'live').map((c) => ({ v: c.id, l: s.title + ' › ' + c.title })));
    return st.tests.filter((t) => t.status === 'published').map((t) => ({ v: t.id, l: t.title }));
  }

  BP.router.add('/admin/banners/:id', {
    role: 'admin', chrome: 'panel', nav: 'banners', title: 'Banner', rerender: false,
    render(ctx) {
      const { b, id } = loadB(ctx);
      if (id && !BP.store.byId('banners', id)) return BP.ui.emptyState({ title: 'Banner not found' });
      const t = b.internalTarget;
      return html`${BP.ad.pageHead(id ? 'Edit banner' : 'Add banner', null, null, ['#/admin/banners', 'Banners'])}
        <div class="form-layout">
          <section class="card stack gap-5">
            <div class="field"><label class="field-label" for="bn-title">Title</label><input id="bn-title" class="input" value="${b.title}" placeholder="For example: New Degree level mock tests are live" data-b="title" aria-describedby="bn-title-err"><span class="field-error" id="bn-title-err" hidden>${icon('alert-circle')}Add a title</span></div>
            <fieldset class="field"><legend class="field-label">Background</legend>
              <div class="bg-picker" role="radiogroup" aria-label="Background">
                ${BP.BANNER_BACKGROUNDS.map((g) => html`<button type="button" class="bg-pick banner--${g.value}" role="radio" aria-checked="${String(!b.image && b.background === g.value)}" data-act="bg" data-v="${g.value}"><span>${g.label}</span></button>`)}
                <label class="bg-pick bg-pick--upload ${b.image ? 'is-on' : ''}" ${b.image ? raw('style="background-image:url(' + b.image + ')"') : ''}>${icon('upload')}<span>${b.image ? 'Replace image' : 'Upload image'}</span><input type="file" accept="image/*" class="visually-hidden" id="bn-img"></label>
              </div>
              <span class="field-help">Images are resized on this device (demo upload). Wide images (3:1) look best.</span>
            </fieldset>
            <fieldset class="field"><legend class="field-label">When tapped</legend>
              ${BP.ui.segmented([{ value: 'none', label: 'Do nothing' }, { value: 'internal', label: 'Open a page in the app' }, { value: 'external', label: 'Open a website' }], b.linkType, { act: 'link', label: 'Link type' })}
            </fieldset>
            ${b.linkType === 'internal' ? html`<div class="form-grid">
              <div class="field"><label class="field-label" for="bn-tt">Link to a</label><select id="bn-tt" class="select" data-act-change="ttype">${[['section', 'Section'], ['card', 'Card'], ['test', 'Test']].map(([v, l]) => html`<option value="${v}" ${t.type === v ? 'selected' : ''}>${l}</option>`)}</select></div>
              <div class="field"><label class="field-label" for="bn-ti">${{ section: 'Section', card: 'Card', test: 'Test' }[t.type]}</label><select id="bn-ti" class="select" data-act-change="tid"><option value="">Choose…</option>${targetOptions(t.type).map((o) => html`<option value="${o.v}" ${t.id === o.v ? 'selected' : ''}>${o.l}</option>`)}</select><span class="field-error" id="bn-ti-err" hidden>${icon('alert-circle')}Choose where it should open</span></div>
            </div><p class="t-caption">Pick from the list. No web addresses to type.</p>` : ''}
            ${b.linkType === 'external' ? html`<div class="field"><label class="field-label" for="bn-url">Website address</label><input id="bn-url" class="input" type="url" value="${b.externalUrl}" placeholder="https://" data-b="externalUrl" aria-describedby="bn-url-err"><span class="field-error" id="bn-url-err" hidden>${icon('alert-circle')}Enter an address starting with http:// or https://</span></div>` : ''}
            <label class="switch"><input type="checkbox" id="bn-active" ${b.active ? 'checked' : ''}><span class="switch-track"></span><span class="t-body-sm t-strong">Active (shown on Home)</span></label>
            <div class="row-wrap gap-3"><button type="button" class="btn btn--primary" data-act="save">${icon('check')}${id ? 'Save banner' : 'Add banner'}</button><a class="btn btn--ghost" href="#/admin/banners">Cancel</a>
              ${id ? html`<button type="button" class="btn btn--danger" data-act="delete">${icon('trash')}Delete</button>` : ''}</div>
          </section>
          <aside class="form-side"><div class="sticky-side stack gap-3"><span class="t-label t-muted">Preview</span><div id="bn-prev">${BP.banners.render([Object.assign({}, b, { linkType: b.linkType })], { preview: true })}</div></div></aside>
        </div>`;
    },
    mount(root) {
      const b = B.b;
      const prev = () => { root.querySelector('#bn-prev').innerHTML = String(BP.banners.render([b], { preview: true })); };
      root.querySelectorAll('[data-b]').forEach((el) => el.addEventListener('input', () => { b[el.dataset.b] = el.value; prev(); }));
      const tt = root.querySelector('[data-act-change="ttype"]'); if (tt) tt.addEventListener('change', () => { b.internalTarget = { type: tt.value, id: '' }; redraw(); });
      const ti = root.querySelector('[data-act-change="tid"]'); if (ti) ti.addEventListener('change', () => { b.internalTarget.id = ti.value; prev(); });
      root.querySelector('#bn-active').addEventListener('change', (e) => { b.active = e.target.checked; });
      root.querySelector('#bn-img').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          const w = Math.min(1200, img.width), h = Math.round(img.height * (w / img.width));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          b.image = c.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(img.src);
          redraw();
        };
        img.onerror = () => BP.ui.toast('That file is not an image', { type: 'error' });
        img.src = URL.createObjectURL(file);
      });
    },
    actions: {
      bg(el) { B.b.background = el.dataset.v; B.b.image = null; redraw(); },
      link(el) { B.b.linkType = el.dataset.value; redraw(); },
      save() {
        const b = B.b;
        const fail = (id) => { const e = document.getElementById(id + '-err'); if (e) e.hidden = false; const i = document.getElementById(id); if (i) { i.setAttribute('aria-invalid', 'true'); i.focus(); } };
        if (!b.title.trim()) return fail('bn-title');
        if (b.linkType === 'internal' && !b.internalTarget.id) return fail('bn-ti');
        if (b.linkType === 'external' && !BP.content.isUrl(b.externalUrl)) return fail('bn-url');
        const data = { title: b.title.trim(), background: b.background, image: b.image, linkType: b.linkType,
          internalTarget: b.linkType === 'internal' ? b.internalTarget : null, externalUrl: b.linkType === 'external' ? b.externalUrl : '', active: b.active };
        try {
          BP.store.update((s) => {
            if (B.id) Object.assign(s.banners.find((x) => x.id === B.id), data);
            else s.banners.push(Object.assign({ id: BP.store.uid('bn'), order: BP.ad.nextOrder(s.banners) }, data));
          });
        } catch (err) { BP.ui.toast('Could not save: the image may be too large', { type: 'error' }); return; }
        const isNew = !B.id; B = null;
        BP.ui.toast(isNew ? 'Banner added' : 'Banner saved', { type: 'success' });
        BP.router.go('/admin/banners');
      },
      async delete() {
        const ok = await BP.ui.confirm({ title: 'Delete this banner?', body: 'It is removed from Home straight away. This cannot be undone.', confirmLabel: 'Delete', danger: true });
        if (!ok) return;
        const id = B.id; B = null;
        BP.store.update((s) => { s.banners = s.banners.filter((x) => x.id !== id); });
        BP.ui.toast('Banner deleted', { type: 'success' });
        BP.router.go('/admin/banners');
      },
    },
  });
})();
