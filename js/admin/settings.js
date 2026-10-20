/* Admin: subscription plan (one monthly plan, sample price) and app settings. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;

  BP.router.add('/admin/plan', {
    role: 'admin', chrome: 'panel', nav: 'plan', title: 'Plan', rerender: false,
    render() {
      const p = BP.store.state.plan;
      return html`${BP.ad.pageHead('Subscription plan', 'One monthly plan that unlocks every premium test and paper.')}
        <div class="form-layout">
          <form class="card stack gap-5" id="plan-form" novalidate>
            <div class="field"><label class="field-label" for="pl-name">Plan name</label><input id="pl-name" class="input" value="${p.name}"></div>
            <div class="field"><label class="field-label" for="pl-price">Price per month (₹) <span class="tag tag--warning">Sample price</span></label>
              <input id="pl-price" class="input" type="number" min="1" step="1" value="${p.pricePerMonth}" aria-describedby="pl-price-help pl-err"><span class="field-help" id="pl-price-help">Not decided by the client yet. Users see this price on the upgrade screen.</span>
              <span class="field-error" id="pl-err" hidden>${icon('alert-circle')}Enter a price of at least ₹1</span></div>
            <div class="field"><label class="field-label" for="pl-ben">Benefits</label><textarea id="pl-ben" class="textarea" rows="4">${p.benefits.join('\n')}</textarea><span class="field-help">One per line.</span></div>
            <div><button type="submit" class="btn btn--primary">${icon('check')}Save plan</button></div>
          </form>
          <aside class="form-side"><div class="card stack gap-3 sticky-side"><span class="t-label t-muted">What users see</span>
            <div class="plan-card"><div class="t-h3">${p.name}</div><div class="plan-price"><span>₹${p.pricePerMonth}</span> / month</div></div>
            <ul role="list" class="benefits">${p.benefits.map((b) => html`<li>${iconTile('check', 'success', 'sm')}<span>${b}</span></li>`)}</ul></div></aside>
        </div>`;
    },
    mount(root) {
      root.querySelector('#plan-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const price = Number(root.querySelector('#pl-price').value);
        if (!(price >= 1)) { root.querySelector('#pl-err').hidden = false; root.querySelector('#pl-price').setAttribute('aria-invalid', 'true'); return; }
        BP.store.update((s) => {
          s.plan.name = root.querySelector('#pl-name').value.trim() || s.plan.name;
          s.plan.pricePerMonth = Math.round(price);
          s.plan.benefits = root.querySelector('#pl-ben').value.split('\n').map((x) => x.trim()).filter(Boolean);
        }, { silent: true });
        BP.ui.toast('Plan saved', { type: 'success' });
        BP.router.render({ rerender: true });
      });
    },
  });

  BP.router.add('/admin/settings', {
    role: 'admin', chrome: 'panel', nav: 'settings', title: 'Settings', rerender: false,
    render() {
      const s = BP.store.state.settings;
      return html`${BP.ad.pageHead('Settings')}
        <div class="dash-grid">
          <section class="card stack gap-4">
            <div><h2 class="t-h3">Current affairs periods</h2><p class="t-caption">Questions move automatically based on their publish date.</p></div>
            <dl class="facts facts--plain">
              <div class="fact"><dt>Daily</dt><dd>Today and the previous six days</dd></div>
              <div class="fact"><dt>Weekly</dt><dd>7 to 27 days old, grouped by week and month</dd></div>
              <div class="fact"><dt>Monthly</dt><dd>28 days or older, grouped by month</dd></div>
            </dl>
          </section>
          <section class="card stack gap-4">
            <h2 class="t-h3">Tests</h2>
            <dl class="facts facts--plain">
              <div class="fact"><dt>Reconnect window</dt><dd>${s.reconnectSeconds} seconds ${BP.ui.tag('success', 'Confirmed')}</dd></div>
              <div class="fact"><dt>Negative mark</dt><dd>One third of the question's marks ${BP.ui.tag('warning', 'Demo default')}</dd></div>
              <div class="fact"><dt>Options per question</dt><dd>4 ${BP.ui.tag('warning', 'Demo default')}</dd></div>
              <div class="fact"><dt>Retakes</dt><dd>No limit ${BP.ui.tag('warning', 'Demo default')}</dd></div>
            </dl>
            <p class="t-caption">If a user loses connection or closes the app, they have ${s.reconnectSeconds} seconds to come back before the test is submitted with their saved answers.</p>
          </section>
        </div>`;
    },
    mount() {},
  });
})();
