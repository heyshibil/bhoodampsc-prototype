/* Admin approvals: queue of submitted items, full preview (both languages, correct answers), approve / reject.
   The same preview page is used from the content library for items in any status. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile, tag } = BP.ui;
  const L = BP.content.LETTERS;
  const fmt = BP.scoring.fmt;

  /* ---------- Queue ---------- */
  BP.router.add('/admin/approvals', {
    role: 'admin', chrome: 'panel', nav: 'approvals', title: 'Approvals',
    render(ctx) {
      const all = BP.store.q.pendingApprovals().sort((a, b) => ((b.item.pending || b.item).submittedAt || 0) - ((a.item.pending || a.item).submittedAt || 0));
      const tab = ctx.query.type || 'all';
      const list = tab === 'all' ? all : all.filter((x) => x.type === tab);
      const tabs = [{ value: 'all', label: 'All', count: all.length }].concat(BP.ad.TYPE_TABS.map((t) => ({ value: t.value, label: t.label, count: all.filter((x) => x.type === t.value).length })));
      return html`${BP.ad.pageHead('Approvals', 'Nothing a creator makes reaches users until you approve it here.')}
        <div class="filters">${BP.ui.segmented(tabs, tab, { act: 'tab', label: 'Content type' })}</div>
        ${list.length ? html`<div class="list">${list.map(({ type, item }) => {
          const src = item.pending || item;
          return html`<a class="list-row" href="#/admin/approvals/${type}/${item.id}">
            ${iconTile(BP.content.TYPES[type].icon)}
            <span class="lr-main"><span class="lr-title clamp-2">${BP.content.titleOf(type, item)}</span>
              <span class="lr-meta">${BP.content.TYPES[type].label} · ${BP.content.cardPath(item.cardId).join(' › ')} · by ${BP.ad.creatorName(item.createdBy)}</span>
              <span class="row-wrap gap-2 lr-tags">${item.pending ? tag('primary', 'Changes to a live item') : tag('neutral', 'New')}${(src.resubmitted || item.resubmitted) ? tag('warning', 'Resubmitted after rejection') : ''}<span class="t-caption">Submitted ${BP.ui.fmtRelative(src.submittedAt || src.updatedAt || item.updatedAt)}</span></span></span>
            <span class="btn btn--secondary btn--sm hide-xs">Review</span>
          </a>`;
        })}</div>` : BP.ui.emptyState({ icon: 'check-circle', title: 'All caught up', text: 'New submissions from creators appear here.' })}`;
    },
    actions: { tab(el) { BP.router.go('/admin/approvals', { type: el.dataset.value === 'all' ? '' : el.dataset.value }, { replace: true }); } },
  });

  /* ---------- Preview ---------- */
  const fact = (k, v) => (v || v === 0 ? html`<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>` : '');

  function questionBlock(q, n) {
    return html`<article class="pq">
      <header class="pq-head"><span class="qrow-num">${n}</span>${BP.content.questionIssues(q).length ? tag('error', 'Incomplete') : tag('success', 'Complete')}</header>
      <div class="pq-text"><div><span class="t-label t-muted">English</span><p class="t-body t-strong">${q.en.text || '—'}</p></div>
        <div><span class="t-label t-muted">Malayalam</span><p class="t-body t-strong" lang="ml">${q.ml.text || '—'}</p></div></div>
      <div class="table-wrap pq-table"><table class="table"><thead><tr><th scope="col">Option</th><th scope="col">English</th><th scope="col">Malayalam</th></tr></thead>
        <tbody>${[0, 1, 2, 3].map((i) => html`<tr class="${q.correctIndex === i ? 'is-correct' : ''}"><td><b>${L[i]}</b>${q.correctIndex === i ? html` <span class="correct-mark">${icon('check')}Correct</span>` : ''}</td><td>${q.en.options[i] || html`<span class="t-error">Missing</span>`}</td><td lang="ml">${q.ml.options[i] || html`<span class="t-error">Missing</span>`}</td></tr>`)}</tbody></table></div>
      <div class="pq-text"><div><span class="t-label t-muted">Explanation (English)</span><p class="t-body-sm">${q.en.explanation || '—'}</p></div><div><span class="t-label t-muted">Explanation (Malayalam)</span><p class="t-body-sm" lang="ml">${q.ml.explanation || '—'}</p></div></div>
    </article>`;
  }

  function previewBody(type, item) {
    const f = BP.content.working(type, item);
    if (type === 'tests') {
      const t = Object.assign({}, item, f);
      return html`<dl class="facts card">${fact('Where', BP.content.testPath(t).join(' › '))}${fact('Duration', BP.u.fmtMin(t.durationMin))}${fact('Questions', t.questions.length)}${fact('Marks per question', fmt(t.marksPerQuestion))}
          ${item.status === 'published' && !item.pending ? html`${fact('Access', item.isPremium ? 'Premium' : 'Free')}${fact('Negative marking', item.negativeMarking ? 'On (−' + fmt(item.negativeValue) + ' per wrong answer)' : 'Off')}` : ''}</dl>
        <div class="card stack gap-2"><h2 class="t-h3">Rules</h2><ul class="rules-list">${String(t.rules || '').split('\n').filter(Boolean).map((r) => html`<li>${r}</li>`)}</ul></div>
        <div class="stack gap-3"><h2 class="t-h3">Questions (${t.questions.length})</h2>${t.questions.map((q, i) => questionBlock(q, i + 1))}</div>`;
    }
    if (type === 'caQuestions') {
      const b = BP.content.caBucket(f.publishDate);
      return html`<dl class="facts card">${fact('Publish date', BP.ui.fmtDate(f.publishDate))}${fact('Subject', f.subject)}${fact('Users will see it in', b === 'scheduled' ? 'Not shown until the publish date' : 'Current Affairs › ' + { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[b])}${fact('Access', 'Free (demo default)')}</dl>${questionBlock(f, 1)}`;
    }
    if (type === 'papers') {
      const cat = BP.store.byId('downloadCategories', f.categoryId);
      return html`<dl class="facts card">${fact('Title', f.title)}${fact('Category', cat && cat.title)}${fact('Year', f.year)}${fact('File', f.fileName ? f.fileName + ' · ' + Math.round((f.fileSize || 0) / 1024) + ' KB' : 'No file')}${item.status === 'published' && !item.pending ? fact('Access', item.isPremium ? 'Premium' : 'Free') : ''}</dl>`;
    }
    const d = BP.ui.fmtDate;
    return type === 'applications'
      ? html`<dl class="facts card">${fact('Post', f.title)}${fact('Qualification', f.qualification)}${fact('Last date', f.lastDate && d(f.lastDate))}${fact('Vacancies', f.vacancy)}${fact('Extra qualifications', f.extraQualifications)}${fact('Exam stage', f.stage)}${fact('Official link', f.officialLink)}</dl>${f.otherDetails ? html`<div class="card stack gap-2"><h2 class="t-h3">Other details</h2><p class="t-body pre-line">${f.otherDetails}</p></div>` : ''}`
      : html`<dl class="facts card">${fact('Exam', f.title)}${fact('Starts', f.startDate && d(f.startDate))}${fact('Ends', f.endDate && d(f.endDate))}${fact('Official link', f.officialLink)}</dl>${f.otherDetails ? html`<div class="card stack gap-2"><h2 class="t-h3">Other details</h2><p class="t-body pre-line">${f.otherDetails}</p></div>` : ''}`;
  }

  BP.router.add('/admin/approvals/:type/:id', {
    role: 'admin', chrome: 'panel', nav: 'approvals', title: 'Review',
    render(ctx) {
      const type = ctx.params.type;
      const item = BP.content.TYPES[type] && BP.content.find(type, ctx.params.id);
      if (!item) return BP.ui.emptyState({ title: 'Item not found', action: html`<a class="btn btn--secondary" href="#/admin/approvals">Back to approvals</a>` });
      const st = BP.content.stateOf(item);
      const waiting = item.status === 'submitted' || (item.pending && item.pending.status === 'submitted');
      const back = ctx.query.from === 'library' ? ['#/admin/library?type=' + type, 'Content library'] : ['#/admin/approvals', 'Approvals'];
      return html`${BP.ad.pageHead(BP.content.titleOf(type, item), null, null, back)}
        <div class="row-wrap gap-2 mb-4">${tag('neutral', BP.content.TYPES[type].label)}${BP.cr.statusPill(item)}<span class="t-caption">by ${BP.ad.creatorName(item.createdBy)} · ${BP.content.cardPath(item.cardId).join(' › ')}</span></div>
        <div class="builder">
          ${item.pending && waiting ? html`<div class="notice">${icon('info')}<span><b>Changes to a live item.</b> Below is the creator's new version. Users keep seeing the current version until you approve.</span></div>` : ''}
          ${(item.pending || item).resubmitted ? html`<div class="notice notice--warning">${icon('refresh')}<span><b>Resubmitted after rejection.</b> Check that your earlier note was addressed.</span></div>` : ''}
          ${st.key === 'rejected' && st.note ? html`<div class="notice notice--error">${icon('x-circle')}<span><b>Your note:</b> ${st.note}</span></div>` : ''}
          ${previewBody(type, item)}
        </div>
        ${waiting ? html`<div class="action-bar"><div class="action-bar-inner"><span class="t-caption grow">Approve to publish, or send it back with a note.</span>
            <button type="button" class="btn btn--danger" data-act="reject">${icon('x')}Reject</button>
            <button type="button" class="btn btn--primary" data-act="approve">${icon('check')}Approve</button></div></div>`
          : item.status === 'published' ? html`<div class="action-bar"><div class="action-bar-inner"><span class="t-caption grow">Live for users.</span><button type="button" class="btn btn--danger" data-act="unpublish">${icon('eye-off')}Unpublish</button></div></div>` : ''}`;
    },
    actions: {
      approve(el, e, ctx) { approveDialog(ctx.params.type, BP.content.find(ctx.params.type, ctx.params.id)); },
      reject(el, e, ctx) { rejectDialog(ctx.params.type, BP.content.find(ctx.params.type, ctx.params.id)); },
      async unpublish(el, e, ctx) {
        const ok = await BP.ui.confirm({ title: 'Unpublish this item?', body: 'Users will no longer see it. The creator can edit it and submit it again.', confirmLabel: 'Unpublish', danger: true });
        if (!ok) return;
        BP.content.unpublish(ctx.params.type, ctx.params.id);
        BP.ui.toast('Unpublished', { type: 'success' });
      },
    },
  });

  function approveDialog(type, item) {
    const isTest = type === 'tests';
    const hasAccess = isTest || type === 'papers';
    const isNotice = type === 'applications' || type === 'exams';
    const marks = isTest ? BP.content.working(type, item).marksPerQuestion : 1;
    const neg = fmt(marks * BP.store.state.settings.negativeFraction);
    BP.ui.sheet({
      title: 'Approve and publish',
      body: html`<div class="stack gap-5">
        ${hasAccess ? html`<fieldset class="stack gap-3"><legend class="field-label">Who can use it?</legend>
          <div class="choice-grid">
            <label class="choice"><input type="radio" name="ap-access" value="free" ${!item.isPremium ? 'checked' : ''}>${iconTile('check-circle', 'success', 'sm')}<span><span class="choice-title">Free</span><br><span class="choice-desc">Every user</span></span></label>
            <label class="choice"><input type="radio" name="ap-access" value="premium" ${item.isPremium ? 'checked' : ''}>${iconTile('crown', 'accent', 'sm')}<span><span class="choice-title">Premium</span><br><span class="choice-desc">Subscribers only</span></span></label>
          </div></fieldset>` : ''}
        ${isTest ? html`<div class="stack gap-2"><label class="switch"><input type="checkbox" id="ap-neg" ${item.negativeMarking !== false ? 'checked' : ''}><span class="switch-track"></span><span class="t-body t-strong">Negative marking</span></label>
          <span class="field-help">When on, ${neg} of a mark (one third of ${fmt(marks)}) is deducted for each wrong answer.</span></div>` : ''}
        ${isNotice && item.status !== 'published' ? html`<div class="notice">${icon('bell')}<span>Publishing sends an alert to all ${BP.store.state.users.length} users, in the app and as a push notification.</span></div>` : ''}
        ${type === 'caQuestions' ? html`<div class="notice">${icon('newspaper')}<span>Current affairs are free for everyone (demo default).</span></div>` : ''}
        ${item.pending ? html`<div class="notice">${icon('refresh')}<span>The live version is replaced by the creator's new version.</span></div>` : ''}
      </div>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Cancel</button><button type="button" class="btn btn--primary" data-act="go">${icon('check')}Approve and publish</button>`,
      actions: {
        go(el, e, api) {
          const opts = {};
          const acc = api.el.querySelector('input[name="ap-access"]:checked');
          if (acc) opts.isPremium = acc.value === 'premium';
          const n = api.el.querySelector('#ap-neg');
          if (n) opts.negativeMarking = n.checked;
          api.close(true);
          BP.content.approve(type, item.id, opts, BP.store.state.session.adminId);
          BP.ui.toast('Approved and published' + (isNotice && item.status !== 'published' ? '. Users have been alerted.' : ''), { type: 'success' });
          BP.router.go('/admin/approvals');
        },
      },
    });
  }

  function rejectDialog(type, item) {
    BP.ui.sheet({
      title: 'Reject and send back',
      body: html`<div class="field"><label class="field-label" for="rj-note">Note for the creator</label>
        <textarea id="rj-note" class="textarea" placeholder="Say what needs to change, for example: Question 2, Malayalam option C is incomplete." autofocus aria-describedby="rj-err"></textarea>
        <span class="field-error" id="rj-err" hidden>${icon('alert-circle')}A note is required so the creator knows what to fix</span></div>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Cancel</button><button type="button" class="btn btn--danger-solid" data-act="go">${icon('send')}Reject with note</button>`,
      actions: {
        go(el, e, api) {
          const note = api.el.querySelector('#rj-note');
          if (!note.value.trim()) { note.setAttribute('aria-invalid', 'true'); api.el.querySelector('#rj-err').hidden = false; note.focus(); return; }
          api.close(true);
          BP.content.reject(type, item.id, note.value.trim(), BP.store.state.session.adminId);
          BP.ui.toast('Sent back to the creator with your note', { type: 'success' });
          BP.router.go('/admin/approvals');
        },
      },
    });
  }

  BP.ad.previewBody = previewBody;
})();
