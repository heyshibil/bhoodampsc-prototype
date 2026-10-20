/* Shared Creator pieces: loading a working copy, status notices, the save/submit bar, admin-only locked fields. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;

  const EDIT_ROUTES = {
    tests: (it) => '#/creator/test/' + it.id,
    applications: (it) => '#/creator/notice/application/' + it.id,
    exams: (it) => '#/creator/notice/exam/' + it.id,
    papers: (it) => '#/creator/paper/' + it.id,
    caQuestions: (it) => '#/creator/ca/' + it.id,
  };
  const editHref = (type, item) => EDIT_ROUTES[type](item);

  /** Working copy for an editor route. Kept between re-renders of the same route. */
  let W = null;
  function load(type, ctx, blank) {
    const key = type + '|' + ctx.hash.split('?')[0];
    if (W && W.key === key) return W;
    const id = ctx.params.id;
    if (id === 'new') {
      const card = BP.store.byId('cards', ctx.query.card);
      if (!card) return null;
      W = { key, type, id: null, item: null, card, dirty: false, fields: Object.assign({ cardId: card.id }, blank(card)) };
    } else {
      const item = BP.content.find(type, id);
      if (!item || item.createdBy !== ctx.creator.id) return null;
      W = { key, type, id, item, card: BP.store.byId('cards', item.cardId), dirty: false, fields: BP.content.working(type, item) };
    }
    return W;
  }
  function reset() { W = null; }

  function statusNotice(item) {
    if (!item) return html`<div class="notice">${icon('info')}<span><b>New.</b> Save it as a draft any time. It reaches users only after the admin approves it.</span></div>`;
    const st = BP.content.stateOf(item);
    if (st.key === 'rejected') return html`<div class="notice notice--error">${icon('x-circle')}<span><b>Rejected by the admin.</b> Note: “${st.note || 'No note'}” ${st.live ? 'The approved version stays live until your changes are approved. ' : ''}Fix it, then resubmit.</span></div>`;
    if (st.live && st.pending === 'submitted') return html`<div class="notice">${icon('clock')}<span><b>Live, with changes in review.</b> Users see the approved version until the admin approves your changes.</span></div>`;
    if (st.live && st.pending === 'draft') return html`<div class="notice notice--warning">${icon('pencil')}<span><b>Live, with unsubmitted changes.</b> Submit them when ready. Users see the approved version until then.</span></div>`;
    if (st.live) return html`<div class="notice notice--success">${icon('check-circle')}<span><b>Live.</b> You can still edit. Your changes go live only after the admin approves them.</span></div>`;
    if (st.key === 'submitted') return html`<div class="notice">${icon('clock')}<span><b>In review.</b> You can still make changes. The admin sees your latest version.</span></div>`;
    if (st.key === 'unpublished') return html`<div class="notice notice--warning">${icon('eye-off')}<span><b>Unpublished by the admin.</b> Users cannot see it. Edit and submit it again to put it back up for review.</span></div>`;
    return html`<div class="notice">${icon('pencil')}<span><b>Draft.</b> Only you can see this. Submit it when it is ready.</span></div>`;
  }
  function statusPill(item) {
    if (!item) return BP.ui.pill('draft', 'New');
    const st = BP.content.stateOf(item);
    if (st.live && st.pending) return BP.ui.pill(st.pending === 'submitted' ? 'submitted' : st.pending === 'rejected' ? 'rejected' : 'published', st.pending === 'submitted' ? 'Live · changes in review' : st.pending === 'rejected' ? 'Live · changes rejected' : 'Live · unsaved changes');
    return BP.ui.contentPill(item.status);
  }

  function head(w, title) {
    return html`<div class="page-head">
      <div class="grow">
        <a class="link-btn" href="#/creator/dashboard">${icon('arrow-left')}My content</a>
        <nav class="crumbs" aria-label="Card">${BP.content.cardPath(w.fields.cardId).map((c, i) => html`${i ? html`<span class="crumb-sep">›</span>` : ''}<span>${c}</span>`)}</nav>
        <h1 class="t-h1">${title}</h1>
      </div>
      ${statusPill(w.item)}
    </div>`;
  }

  function actionBar(w) {
    const st = w.item ? BP.content.stateOf(w.item) : { key: 'draft' };
    const submitLabel = st.key === 'rejected' || st.key === 'unpublished' ? 'Resubmit for approval' : st.live ? 'Submit changes' : 'Submit for approval';
    return html`<div class="action-bar">
      <div class="action-bar-inner">
        <span class="t-caption grow" id="ab-state">${w.dirty ? 'Unsaved changes' : w.item ? 'All changes saved' : 'Not saved yet'}</span>
        <button type="button" class="btn btn--secondary" data-act="save">${icon('save')}<span>${st.key === 'submitted' && !st.live ? 'Save changes' : 'Save draft'}</span></button>
        <button type="button" class="btn btn--primary" data-act="submit">${icon('send')}<span>${submitLabel}</span></button>
      </div>
    </div>`;
  }
  function markDirty(w) { w.dirty = true; const s = document.getElementById('ab-state'); if (s) s.textContent = 'Unsaved changes'; }

  /** Admin-only settings, shown but disabled for Creators. */
  function lockedFields(w, opts) {
    const it = w.item || {};
    return html`<div class="locked-box">
      <div class="locked-head">${icon('lock')}<span><b>Set by Admin</b> when approving</span></div>
      <div class="row-wrap gap-6">
        <div class="locked"><span class="field-label">Access</span><div class="segmented segmented--sm" aria-disabled="true"><span class="seg" aria-selected="${String(!it.isPremium)}">Free</span><span class="seg" aria-selected="${String(!!it.isPremium)}">Premium</span></div></div>
        ${opts && opts.negative ? html`<div class="locked"><label class="switch"><input type="checkbox" disabled ${it.negativeMarking !== false ? 'checked' : ''}><span class="switch-track"></span><span class="t-body-sm t-strong">Negative marking</span></label></div>` : ''}
      </div>
    </div>`;
  }

  /** Save or submit the working copy. */
  function persist(w, submit) {
    if (submit) {
      const errors = BP.content.validate(w.type, w.fields);
      const box = document.getElementById('form-errors');
      if (errors.length) {
        if (box) { box.innerHTML = String(html`<div class="notice notice--error" role="alert">${icon('alert-circle')}<span><b>Fix these before submitting:</b><ul>${errors.map((e) => html`<li>${e}</li>`)}</ul></span></div>`); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        BP.ui.toast('Fill in the missing details before submitting', { type: 'error' });
        return false;
      }
      if (box) box.innerHTML = '';
    }
    const id = BP.content.save(w.type, w.id, w.fields, BP.store.state.session.creatorId, submit);
    const item = BP.content.find(w.type, id);
    reset();
    if (submit) {
      BP.ui.toast('Submitted for approval. The admin will review it.', { type: 'success' });
      BP.router.go('/creator/dashboard', { status: 'submitted' });
    } else {
      BP.ui.toast('Saved', { type: 'success' });
      BP.router.go(editHref(w.type, item).slice(1), null, { replace: true });
    }
    return true;
  }

  /** Bind [data-f] inputs to w.fields. Numbers stay numbers. */
  function bindFields(root, w) {
    root.querySelectorAll('[data-f]').forEach((el) => {
      const ev = el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input';
      el.addEventListener(ev, () => {
        const f = el.dataset.f;
        w.fields[f] = el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.dataset.num ? (el.value ? Number(el.value) : null) : el.value;
        markDirty(w);
        if (el.dataset.redraw) BP.router.render({ rerender: true });
      });
    });
  }

  function addYear(onAdded) {
    BP.ui.sheet({
      title: 'Add a year',
      body: html`<div class="field"><label class="field-label" for="new-year">Year</label><input id="new-year" class="input" type="number" min="1990" max="2100" placeholder="For example 2024" autofocus aria-describedby="ny-err"><span class="field-error" id="ny-err" hidden></span></div>
        <p class="t-caption mt-2">Years are shared. Once added, the year is available on every card.</p>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Cancel</button><button type="button" class="btn btn--primary" data-act="add">Add year</button>`,
      actions: {
        add(el, e, api) {
          const input = api.el.querySelector('#new-year');
          const y = Number(input.value);
          const err = api.el.querySelector('#ny-err');
          const fail = (m) => { err.innerHTML = BP.icon('alert-circle') + m; err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); };
          if (!(y >= 1990 && y <= 2100)) return fail('Enter a year between 1990 and 2100');
          if (BP.store.state.years.includes(y)) return fail(y + ' is already in the list');
          BP.store.update((s) => { s.years.push(y); s.years.sort((a, b) => a - b); }, { silent: true });
          api.close();
          BP.ui.toast('Year ' + y + ' added', { type: 'success' });
          onAdded(y);
        },
      },
    });
  }

  const card = (title, body, extra) => html`<section class="card stack gap-5">${title ? html`<div class="row-between"><h2 class="t-h3">${title}</h2>${extra || ''}</div>` : ''}${body}</section>`;
  const notFound = () => BP.ui.emptyState({ icon: 'ghost', title: 'Item not found', text: 'It may have been removed, or it belongs to another creator.', action: html`<a class="btn btn--secondary" href="#/creator/dashboard">Back to my content</a>` });

  BP.cr = { editHref, load, reset, statusNotice, statusPill, head, actionBar, markDirty, lockedFields, persist, bindFields, addYear, card, notFound, iconTile };
})();
