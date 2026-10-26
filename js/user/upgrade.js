/* Subscription: upgrade sheet -> generic "Payment (demo)" sheet -> success. No third-party branding. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;

  const METHODS = [
    { value: 'upi', label: 'UPI', desc: 'Pay with any UPI app', icon: 'smartphone' },
    { value: 'card', label: 'Card', desc: 'Debit or credit card', icon: 'credit-card' },
    { value: 'netbanking', label: 'Net banking', desc: 'All major banks', icon: 'landmark' },
  ];

  /** Open the upgrade flow. opts: { reason, onDone } */
  function upgrade(opts) {
    opts = opts || {};
    const plan = BP.store.state.plan;
    BP.ui.sheet({
      title: 'Premium access',
      body: html`<div class="stack gap-5">
        ${opts.reason ? html`<div class="notice notice--accent">${icon('lock')}<span>${opts.reason}</span></div>` : ''}
        <div class="plan-card">
          <div class="row-between"><span class="tag tag--outline plan-tag">Monthly plan</span>${iconTile('unlock', 'accent', 'sm')}</div>
          <div class="t-h3">${plan.name}</div>
          <div class="plan-price"><span>₹${plan.pricePerMonth}</span> / month</div>
          <p class="t-caption">Cancel any time. Sample price for the prototype.</p>
        </div>
        <ul role="list" class="benefits">${plan.benefits.map((b) => html`<li>${iconTile('check', 'success', 'sm')}<span>${b}</span></li>`)}</ul>
      </div>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Not now</button>
        <button type="button" class="btn btn--hero" data-act="pay">Continue to payment${icon('arrow-right')}</button>`,
      actions: { pay(el, e, api) { api.close(true); payment(opts); } },
    });
  }

  function payment(opts) {
    const plan = BP.store.state.plan;
    BP.ui.sheet({
      title: 'Payment (demo)',
      body: html`<div class="stack gap-5">
        <div class="pay-summary">
          <div><div class="t-caption">You pay</div><div class="t-h2">₹${plan.pricePerMonth}.00</div></div>
          <div class="t-right"><div class="t-caption">${plan.name}</div><div class="t-body-sm t-strong">1 month</div></div>
        </div>
        <fieldset class="stack gap-3">
          <legend class="field-label">Payment method</legend>
          ${METHODS.map((m, i) => html`<label class="choice"><input type="radio" name="pay-method" value="${m.value}" ${i === 0 ? 'checked' : ''}>
            ${iconTile(m.icon, '', 'sm')}<span><span class="choice-title">${m.label}</span><br><span class="choice-desc">${m.desc}</span></span></label>`)}
        </fieldset>
        <div class="notice">${icon('shield-check')}<span>This is a demo. No real payment is taken and no card or bank details are asked for.</span></div>
      </div>`,
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Cancel</button>
        <button type="button" class="btn btn--hero" data-act="confirm">${icon('lock')}Pay ₹${plan.pricePerMonth}</button>`,
      actions: {
        confirm(el, e, api) {
          el.disabled = true;
          el.innerHTML = '<span class="spinner"></span>Processing…';
          setTimeout(() => {
            api.close(true);
            const id = BP.store.state.session.userId;
            BP.store.update((s) => { const u = s.users.find((x) => x.id === id); u.isPremium = true; u.premiumSince = Date.now(); });
            success(opts);
          }, 1200);
        },
      },
    });
  }

  function success(opts) {
    BP.ui.sheet({
      title: 'Payment successful',
      body: html`<div class="stack gap-4 items-center t-center pt-2">
        <span>${iconTile('unlock', 'accent', 'lg')}</span>
        <h3 class="t-h2">Premium access is active</h3>
        <p class="t-body t-muted">Premium tests and question papers are now available.</p>
      </div>`,
      foot: html`<button type="button" class="btn btn--primary" data-act="close">${opts.doneLabel || 'Done'}</button>`,
      onClose: () => { if (opts.onDone) opts.onDone(); },
    });
  }

  BP.premium = { upgrade };
})();
