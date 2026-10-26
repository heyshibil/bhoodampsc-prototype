/* Component gallery (prototype tool, opened from the demo panel). Shows every shared component and token. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon, iconTile, avatar, pill, contentPill, cardPill, tag, segmented, emptyState } = BP.ui;

  const COLORS = [
    ['Brand', ['--c-primary', '--c-primary-hover', '--c-primary-100', '--c-primary-200', '--c-accent', '--c-accent-50']],
    ['Neutral', ['--c-bg', '--c-surface', '--c-surface-muted', '--c-border', '--c-border-strong', '--c-text', '--c-text-2', '--c-text-3', '--c-ink']],
    ['Status', ['--c-success', '--c-success-50', '--c-error', '--c-error-50', '--c-warning', '--c-warning-50', '--c-live']],
  ];
  const TYPE = [
    ['t-display', 'Display 30 / 38'], ['t-h1', 'Heading 1 · 24 / 32'], ['t-h2', 'Heading 2 · 20 / 28'],
    ['t-h3', 'Heading 3 · 17 / 24'], ['t-body', 'Body · 16 / 24'], ['t-body-sm', 'Body small · 14 / 20'],
    ['t-caption', 'Caption · 13 / 18'], ['t-label', 'Label · 12 / 16'],
  ];

  const section = (title, content) => html`<section class="sg-section"><h2 class="t-h2">${title}</h2>${content}</section>`;

  function render() {
    return html`<div class="sg">
      <header class="sg-top">
        <div class="sg-top-inner">
          <button type="button" class="icon-btn" data-act="back" aria-label="Back to the app">${icon('arrow-left')}</button>
          <div class="grow"><h1 class="t-h2">Component gallery</h1><p class="t-caption">Prototype tool · docs/DESIGN_SYSTEM.md</p></div>
        </div>
      </header>
      <main id="main" class="sg-main">

        ${section('Brand', html`<div class="card sg-brand">
          <div class="stack gap-4">
            ${raw(BP.logo({ cls: 'logo--lg' }))}
            <p class="t-body-sm t-muted">"Boodham" (<span lang="ml">ഭൂതം</span>) means ghost. The mark is a friendly ghost on a blue-to-violet tile: approachable, a little playful, and easy to spot on a phone home screen.</p>
          </div>
          <div class="row-wrap gap-4">
            ${raw(BP.logoMark('sg-mark-xl'))}${raw(BP.logoMark('sg-mark-md'))}${raw(BP.logoMark())}
            <span class="sg-mark-dark">${raw(BP.logo())}</span>
          </div>
        </div>`)}

        ${section('Colour', html`<div class="stack gap-4">${COLORS.map(([group, vars]) => html`<div>
          <h3 class="t-label t-muted sg-sub">${group}</h3>
          <div class="sg-swatches">${vars.map((v) => html`<div class="sg-swatch"><span style="background:var(${v})"></span><code>${v.replace('--c-', '')}</code></div>`)}</div>
        </div>`)}
          <div class="row-wrap gap-3"><div class="sg-grad" style="background:var(--g-cta)">g-cta</div><div class="sg-grad sg-grad--light" style="background:var(--g-hero)">g-hero</div><div class="sg-grad" style="background:var(--g-brand)">g-brand</div></div>
        </div>`)}

        ${section('Typography', html`<div class="card stack gap-3">
          ${TYPE.map(([cls, label]) => html`<div class="${cls}">${label}</div>`)}
          <hr>
          <p class="t-body"><span class="t-strong">English:</span> Which is the capital of Kerala?</p>
          <p class="t-body"><span class="t-strong">Malayalam:</span> <span lang="ml">കേരളത്തിന്റെ തലസ്ഥാനം ഏത്?</span></p>
          <p class="t-caption">Malayalam uses Noto Sans Malayalam at 0.95em with a 1.75 line height.</p>
        </div>`)}

        ${section('Buttons', html`<div class="card stack gap-4">
          <div class="row-wrap">
            <button class="btn btn--hero btn--lg" type="button">Start test${icon('arrow-right')}</button>
            <button class="btn btn--primary" type="button">${icon('plus')}Primary</button>
            <button class="btn btn--secondary" type="button">Secondary</button>
            <button class="btn btn--dark" type="button">${icon('refresh')}Retake</button>
            <button class="btn btn--ghost" type="button">Ghost</button>
            <button class="btn btn--danger" type="button">Reject</button>
            <button class="btn btn--primary" type="button" disabled>Disabled</button>
          </div>
          <div class="row-wrap">
            <button class="btn btn--primary btn--sm" type="button">Small</button>
            <button class="btn btn--secondary btn--sm" type="button">${icon('download')}Download</button>
            <a class="link-btn" href="#/styleguide">View all${icon('arrow-right')}</a>
            <button class="icon-btn" type="button" aria-label="Alerts">${icon('bell')}<span class="badge">3</span></button>
            <button class="icon-btn" type="button" aria-label="Search">${icon('search')}</button>
            <button class="icon-btn icon-btn--dark" type="button" aria-label="Open">${icon('arrow-up-right')}</button>
          </div>
        </div>`)}

        ${section('Status pills and tags', html`<div class="card stack gap-4">
          <div class="row-wrap gap-2">${['draft', 'submitted', 'published', 'rejected', 'unpublished'].map(contentPill)}</div>
          <div class="row-wrap gap-2">${['live', 'coming_soon', 'hidden'].map(cardPill)} ${pill('completed', 'Completed')} ${pill('auto', 'Auto-submitted')} ${pill('premium', 'Premium')}</div>
          <div class="row-wrap gap-2">${tag('premium', 'Premium', 'unlock')} ${tag('free', 'Free')} ${tag('primary', 'Prelims')} ${tag('neutral', '2023')} ${tag('outline', 'Sample')} ${tag('warning', 'Last date soon')}</div>
        </div>`)}

        ${section('Chips and tabs', html`<div class="card stack gap-4">
          ${segmented([{ value: 'p', label: 'Prelims' }, { value: 'm', label: 'Mains' }], 'p', { act: 'sg-noop', label: 'Stage' })}
          ${segmented([{ value: 'd', label: 'Daily' }, { value: 'w', label: 'Weekly' }, { value: 'm', label: 'Monthly' }], 'w', { act: 'sg-noop', label: 'Period' })}
          <div class="chip-row" role="group" aria-label="Year">
            ${[2024, 2023, 2022, 2021].map((y, i) => html`<button type="button" class="chip" aria-pressed="${String(i === 1)}" data-act="sg-chip">${y}</button>`)}
          </div>
          ${segmented([{ value: 'en', label: 'EN' }, { value: 'ml', label: raw('<span lang="ml">മല</span>') }], 'en', { act: 'sg-noop', label: 'Language', size: 'sm' })}
        </div>`)}

        ${section('Form fields', html`<div class="card sg-form">
          <div class="field"><label class="field-label" for="sg-name">Full name</label><input id="sg-name" class="input" placeholder="Enter your name"><span class="field-help">As it appears on your PSC profile</span></div>
          <div class="field"><label class="field-label" for="sg-err">Phone number</label><input id="sg-err" class="input" value="98765" aria-invalid="true" aria-describedby="sg-err-msg"><span class="field-error" id="sg-err-msg">${icon('alert-circle')}Enter a 10-digit phone number</span></div>
          <div class="field"><label class="field-label" for="sg-dist">District <span class="field-opt">(optional)</span></label><select id="sg-dist" class="select"><option>Choose a district</option>${BP.seed.DISTRICTS.map((d) => html`<option>${d}</option>`)}</select></div>
          <div class="field"><label class="field-label" for="sg-q">Question in Malayalam</label><textarea id="sg-q" class="textarea" lang="ml">കേരളത്തിലെ ഏറ്റവും നീളം കൂടിയ നദി ഏത്?</textarea></div>
          <div class="search"><label class="visually-hidden" for="sg-search">Search</label>${icon('search')}<input id="sg-search" class="input" placeholder="Search users"></div>
          <div class="row-wrap gap-6">
            <label class="switch"><input type="checkbox" checked><span class="switch-track"></span><span class="t-body-sm t-strong">Negative marking</span></label>
            <div class="locked"><label class="switch"><input type="checkbox" disabled><span class="switch-track"></span><span class="t-body-sm t-strong">Premium</span></label></div>
            <span class="locked-note">${icon('lock')}Set by Admin</span>
          </div>
          <div class="choice-grid" role="radiogroup" aria-label="Access">
            <label class="choice"><input type="radio" name="sg-acc" checked><span>${iconTile('check-circle', 'success', 'sm')}</span><span><span class="choice-title">Free</span><br><span class="choice-desc">Everyone can take it</span></span></label>
            <label class="choice"><input type="radio" name="sg-acc"><span>${iconTile('unlock', 'accent', 'sm')}</span><span><span class="choice-title">Premium</span><br><span class="choice-desc">Subscribers only</span></span></label>
          </div>
        </div>`)}

        ${section('Cards and tiles', html`<div class="stack gap-4">
          <div class="tile-grid">${BP.SECTION_THEMES.map((t, i) => BP.homeTile(
            { title: ['UPSC / PSC', 'Degree', 'Mock test', 'Current Affairs', 'Special'][i], icon: ['landmark', 'graduation-cap', 'clipboard-check', 'newspaper', 'star'][i], status: 'live', template: 'paper_test' },
            { theme: t.value }, { preview: true, meta: t.label + ' theme' }))}
            ${BP.homeTile({ title: 'SCERT', icon: 'book-marked', status: 'coming_soon' }, { theme: 'amber' }, { preview: true })}
          </div>
          <div class="row-wrap gap-4">
            ${BP.u.premiumCta({ act: 'sg-noop-premium' })}
            ${BP.u.premiumCta({ act: 'sg-noop-premium', size: 'sm' })}
            ${BP.u.premiumBadge()}
          </div>
          <div class="list">
            <a class="list-row" href="#/styleguide">${iconTile('file-text')}<span class="lr-main"><span class="lr-title">Degree Level Prelims · Sample 1</span><span class="lr-meta">10 questions · 8 min · 1 mark each</span></span><span class="lr-end">${tag('free', 'Free')}${raw(BP.icon('chevron-right', 'chev'))}</span></a>
            <a class="list-row" href="#/styleguide">${iconTile('file-text', 'accent')}<span class="lr-main"><span class="lr-title">Degree Level Mains · Sample 2</span><span class="lr-meta">10 questions · 10 min · 1 mark each</span></span><span class="lr-end">${tag('premium', 'Premium', 'lock')}${raw(BP.icon('chevron-right', 'chev'))}</span></a>
          </div>
          <div class="stat-grid">
            <div class="stat"><div class="stat-head">${iconTile('list-checks', '', 'sm')}<span class="stat-label">Pending<br>approvals</span></div><span class="t-stat">4</span></div>
            <div class="stat"><div class="stat-head">${iconTile('file-text', '', 'sm')}<span class="stat-label">Published<br>tests</span></div><span class="t-stat">31</span></div>
            <div class="stat"><div class="stat-head">${iconTile('users', '', 'sm')}<span class="stat-label">Registered<br>users</span></div><span class="t-stat">8</span></div>
            <div class="stat"><div class="stat-head">${iconTile('unlock', 'accent', 'sm')}<span class="stat-label">Premium<br>users</span></div><span class="t-stat">3</span></div>
          </div>
          <div class="card card--hero stack gap-3">
            <span class="tag tag--outline self-start">Sample</span>
            <h3 class="t-h2">Kerala history · Social reformers</h3>
            <div class="progress" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" aria-label="Answered"><span style="width:60%"></span></div>
            <p class="t-caption">6 of 10 answered</p>
          </div>
        </div>`)}

        ${section('Table', html`<div class="table-wrap"><table class="table table--stack">
          <thead><tr><th>User</th><th>District</th><th>Plan</th><th>Attempts</th><th class="cell-actions">Action</th></tr></thead>
          <tbody>
            ${BP.store.get('users').slice(0, 4).map((u) => html`<tr>
              <td><div class="cell-person">${avatar(u.name, 'avatar--sm')}<div><b>${u.name}</b><span>+91 ${u.phone}</span></div></div></td>
              <td data-label="District">${u.district || 'Not set'}</td>
              <td data-label="Plan">${u.isPremium ? pill('premium', 'Premium') : pill('neutral', 'Free')}</td>
              <td data-label="Attempts" class="t-num">0</td>
              <td class="cell-actions"><button type="button" class="btn btn--secondary btn--sm">View</button></td>
            </tr>`)}
          </tbody></table></div>`)}

        ${section('Notices, progress and empty state', html`<div class="stack gap-3">
          <div class="notice">${icon('info')}<span><b>Negative marking is on.</b> One third of a mark is deducted for each wrong answer.</span></div>
          <div class="notice notice--warning">${icon('alert-triangle')}<span>Less than 5 minutes left.</span></div>
          <div class="notice notice--error">${icon('x-circle')}<span><b>Rejected:</b> Question 2 has an incomplete Malayalam option.</span></div>
          <div class="notice notice--success">${icon('check-circle')}<span>Your answers are saved as you go.</span></div>
          <div class="notice notice--accent">${icon('unlock')}<span>Premium unlocks every test and paper.</span></div>
          ${emptyState({ icon: 'ghost', title: 'No tests here yet', text: 'New tests appear here as soon as they are approved.' })}
        </div>`)}

        ${section('Overlays', html`<div class="row-wrap">
          <button type="button" class="btn btn--secondary" data-act="sg-sheet">${icon('layers')}Open sheet</button>
          <button type="button" class="btn btn--secondary" data-act="sg-confirm">${icon('help-circle')}Confirm dialog</button>
          <button type="button" class="btn btn--secondary" data-act="sg-toast">${icon('check')}Success toast</button>
          <button type="button" class="btn btn--secondary" data-act="sg-toast-err">${icon('alert-circle')}Error toast</button>
        </div>`)}
      </main>
    </div>`;
  }

  BP.router.add('/styleguide', {
    role: null, chrome: 'none', title: 'Component gallery', render,
    actions: {
      back() {
        const s = BP.store.state.session;
        const last = s.lastRoute[s.role || 'user'];
        BP.router.go(last ? '#' + last : BP.router.DEFAULT_ROUTE[s.role || 'user']);
      },
      'sg-noop'(el) {
        el.parentElement.querySelectorAll('.seg').forEach((s) => s.setAttribute('aria-selected', String(s === el)));
      },
      'sg-chip'(el) {
        el.parentElement.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === el)));
      },
      'sg-sheet'() {
        BP.ui.sheet({
          title: 'Upgrade to Premium',
          body: html`<div class="stack gap-4">
            <div class="card card--hero stack gap-2"><span class="t-caption">BoodhamPSC Premium</span><span class="t-display">₹199<span class="t-body t-muted"> / month</span></span></div>
            <ul role="list" class="stack gap-2">${BP.store.state.plan.benefits.map((b) => html`<li class="row gap-2">${iconTile('check', 'success', 'sm')}<span class="t-body-sm">${b}</span></li>`)}</ul>
          </div>`,
          foot: html`<button type="button" class="btn btn--secondary" data-act="close">Not now</button><button type="button" class="btn btn--hero" data-act="close">Continue${icon('arrow-right')}</button>`,
        });
      },
      async 'sg-confirm'() {
        const ok = await BP.ui.confirm({ title: 'Submit test?', body: '7 answered, 2 skipped, 1 not visited. You cannot change answers after submitting.', confirmLabel: 'Submit' });
        BP.ui.toast(ok ? 'Submitted' : 'Cancelled');
      },
      'sg-toast'() { BP.ui.toast('Saved as draft', { type: 'success' }); },
      'sg-toast-err'() { BP.ui.toast('Fill in both languages before submitting', { type: 'error' }); },
    },
  });
})();
