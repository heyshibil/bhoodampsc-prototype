/* Profile: details (editable), subscription, attempt history, log out. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile, avatar, pill } = BP.ui;
  const fmt = BP.scoring.fmt;
  const phone = (p) => '+91 ' + String(p).slice(0, 5) + ' ' + String(p).slice(5);

  function historyRow(a) {
    if (a.status === 'in_progress') {
      return html`<a class="list-row" href="#/user/attempt/${a.id}">${iconTile('timer', 'warning')}
        <span class="lr-main"><span class="lr-title">${a.snapshot.title}</span><span class="lr-meta">${a.snapshot.path.slice(1).join(' › ')}</span><span class="lr-note lr-note--warn">${icon('clock')}In progress · tap to resume</span></span>
        ${icon('chevron-right', 'chev')}</a>`;
    }
    const r = a.result;
    return html`<a class="list-row" href="#/user/attempt/${a.id}/result">${iconTile('file-text')}
      <span class="lr-main"><span class="lr-title">${a.snapshot.title}</span><span class="lr-meta">${a.snapshot.path.slice(1).join(' › ')}</span><span class="row-wrap gap-2 lr-tags"><span class="lr-note">${BP.ui.fmtDate(a.startedAt)} · ${r.correct} correct, ${r.wrong} wrong, ${r.skipped} skipped</span>${a.status === 'auto_submitted' ? pill('auto', 'Auto-submitted') : ''}</span></span>
      <span class="lr-end"><span class="score-chip t-num">${fmt(r.score)}<small>/${fmt(r.max)}</small></span>${icon('chevron-right', 'chev')}</span></a>`;
  }

  BP.router.add('/user/profile', {
    role: 'user', chrome: 'user', nav: 'profile', title: 'Profile',
    render(ctx) {
      const u = ctx.user;
      const attempts = BP.store.q.attemptsFor(u.id);
      const plan = BP.store.state.plan;
      return html`<h1 class="visually-hidden">Profile</h1>
        <div class="profile-layout">
          <div class="stack gap-4">
            <div class="card profile-card">
              ${avatar(u.name, 'avatar--lg')}
              <div class="grow stack gap-1">
                <h2 class="t-h2">${u.name}</h2>
                <p class="t-body-sm t-muted">${phone(u.phone)}</p>
                <div class="row-wrap gap-2 mt-2">${u.isPremium ? BP.u.premiumBadge('Premium') : BP.ui.tag('neutral', 'Free plan')}</div>
              </div>
              <a class="btn btn--secondary btn--sm" href="#/user/profile/edit">${icon('pencil')}Edit</a>
            </div>
            <dl class="facts card">
              <div class="fact"><dt>District</dt><dd>${u.district || html`<a href="#/user/profile/edit">Add district</a>`}</dd></div>
              <div class="fact"><dt>Qualification</dt><dd>${u.qualification || html`<a href="#/user/profile/edit">Add qualification</a>`}</dd></div>
              <div class="fact"><dt>Member since</dt><dd>${BP.ui.fmtDate(u.joinedAt)}</dd></div>
            </dl>
            ${u.isPremium ? html`<div class="premium-card">
                <div class="premium-card-head">${iconTile('crown', 'accent', 'sm')}<div><div class="premium-card-title">${plan.name}</div><p>Active since ${BP.ui.fmtDate(u.premiumSince || Date.now())}</p></div></div>
                <p>Every premium test and paper is unlocked.</p>
              </div>`
              : html`<div class="premium-card">
                <div class="premium-card-head">${iconTile('crown', 'accent', 'sm')}<div><div class="premium-card-title">Unlock everything</div><p>₹${plan.pricePerMonth} a month · cancel any time</p></div></div>
                <p>Premium tests, mock exams and question papers.</p>
                ${BP.u.premiumCta({ block: true, title: 'Upgrade to Premium' })}
              </div>`}
            <button type="button" class="btn btn--secondary btn--block" data-act="logout">${icon('log-out')}Log out</button>
          </div>
          <section class="stack gap-3" aria-labelledby="hist-h">
            <div class="section-head"><h2 id="hist-h">Attempt history</h2><span class="t-caption">${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'}</span></div>
            ${attempts.length ? html`<div class="list">${attempts.map(historyRow)}</div>`
              : BP.ui.emptyState({ icon: 'file-text', title: 'No attempts yet', text: 'Tests you take appear here. Each one opens its result and review.', action: html`<a class="btn btn--primary" href="#/user/home">Find a test</a>` })}
          </section>
        </div>`;
    },
    actions: {
      upgrade() { BP.premium.upgrade(); },
      logout() { BP.u.confirmLogout(); },
    },
  });

  BP.router.add('/user/profile/edit', {
    role: 'user', chrome: 'user', nav: 'profile', title: 'Edit details', rerender: false,
    render(ctx) {
      const u = ctx.user;
      return html`${BP.u.pageHead({ back: '#/user/profile', backLabel: 'Profile', title: 'Edit details' })}
        <form class="card stack gap-5 form-narrow" id="pf-form" novalidate>
          <div class="field"><label class="field-label" for="pf-name">Name</label>
            <input id="pf-name" class="input" value="${u.name}" autocomplete="name" aria-describedby="pf-name-err">
            <span class="field-error" id="pf-name-err" hidden>${icon('alert-circle')}Enter your name</span></div>
          <div class="field"><label class="field-label" for="pf-phone">Mobile number</label>
            <input id="pf-phone" class="input" value="${phone(u.phone)}" disabled aria-describedby="pf-phone-help"><span class="field-help" id="pf-phone-help">Your login number cannot be changed here.</span></div>
          <div class="field"><label class="field-label" for="pf-district">District <span class="field-opt">(optional)</span></label>
            <select id="pf-district" class="select"><option value="">Not set</option>${BP.seed.DISTRICTS.map((d) => html`<option ${d === u.district ? 'selected' : ''}>${d}</option>`)}</select></div>
          <div class="field"><label class="field-label" for="pf-qual">Qualification <span class="field-opt">(optional)</span></label>
            <select id="pf-qual" class="select"><option value="">Not set</option>${BP.seed.QUALIFICATIONS.map((q) => html`<option ${q === u.qualification ? 'selected' : ''}>${q}</option>`)}</select></div>
          <div class="row-wrap gap-3"><button type="submit" class="btn btn--primary">${icon('check')}Save changes</button><a class="btn btn--ghost" href="#/user/profile">Cancel</a></div>
        </form>`;
    },
    mount(root) {
      root.querySelector('#pf-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('pf-name');
        if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); document.getElementById('pf-name-err').hidden = false; name.focus(); return; }
        const id = BP.store.state.session.userId;
        BP.store.update((s) => {
          const u = s.users.find((x) => x.id === id);
          u.name = name.value.trim();
          u.district = document.getElementById('pf-district').value || null;
          u.qualification = document.getElementById('pf-qual').value || null;
        }, { silent: true });
        BP.ui.toast('Your details are saved', { type: 'success' });
        BP.router.go('/user/profile');
      });
    },
  });
})();
