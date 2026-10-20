/* Home banner area, shared by the User Home and the Admin live preview.
   0 active banners: nothing. 1: a single banner. 2+: swipeable carousel with dots that auto-advances. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon } = BP.ui;

  BP.BANNER_BACKGROUNDS = [
    { value: 'blue', label: 'Sky blue' },
    { value: 'violet', label: 'Violet' },
    { value: 'ink', label: 'Night' },
    { value: 'green', label: 'Green' },
  ];

  /** Where an internal target points, or null if it no longer exists / is not visible to users. */
  function targetHref(t) {
    if (!t || !t.id) return null;
    if (t.type === 'section') { const s = BP.store.byId('sections', t.id); return s && s.status !== 'hidden' ? '#/user/home?section=' + t.id : null; }
    if (t.type === 'card') { const c = BP.store.byId('cards', t.id); return c && c.status === 'live' ? '#/user/card/' + t.id : null; }
    if (t.type === 'test') { const x = BP.store.byId('tests', t.id); return x && x.status === 'published' ? '#/user/test/' + t.id : null; }
    return null;
  }
  function describeTarget(b) {
    if (b.linkType === 'external') return b.externalUrl || 'No address';
    if (b.linkType !== 'internal' || !b.internalTarget) return 'No link';
    const t = b.internalTarget;
    const item = BP.store.byId(t.type === 'section' ? 'sections' : t.type === 'card' ? 'cards' : 'tests', t.id);
    return (t.type === 'section' ? 'Section: ' : t.type === 'card' ? 'Card: ' : 'Test: ') + (item ? item.title : 'removed');
  }

  const GHOST = '<svg class="banner-ghost" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 19.5a12 12 0 0 1 24 0V35a4 4 0 0 1-8 0 4 4 0 0 1-8 0 4 4 0 0 1-8 0Z"/><ellipse class="eye" cx="19.6" cy="21" rx="2.3" ry="3.1"/><ellipse class="eye" cx="28.4" cy="21" rx="2.3" ry="3.1"/></svg>';

  function slide(b, preview) {
    const cls = 'banner banner--' + (b.image ? 'image' : b.background || 'blue');
    const style = b.image ? raw(' style="background-image:linear-gradient(90deg, rgba(11,12,14,.62), rgba(11,12,14,.05) 75%), url(' + b.image + ')"') : '';
    const inner = html`<span class="banner-title">${b.title || 'Banner title'}</span>${!b.image ? raw(GHOST) : ''}`;
    const href = b.linkType === 'internal' ? targetHref(b.internalTarget) : b.linkType === 'external' && b.externalUrl ? b.externalUrl : null;
    const cta = href ? html`<span class="banner-cta">${b.linkType === 'external' ? 'Visit website' : 'Open'}${icon(b.linkType === 'external' ? 'external-link' : 'arrow-right')}</span>` : '';
    if (preview || !href) return html`<div class="${cls}"${style}>${inner}${cta}</div>`;
    if (b.linkType === 'external') return html`<a class="${cls}"${style} href="${href}" target="_blank" rel="noopener noreferrer">${inner}${cta}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
    return html`<a class="${cls}"${style} href="${href}">${inner}${cta}</a>`;
  }

  /** Render the banner area for a list of banners (already filtered to active, in order). */
  function render(banners, opts) {
    opts = opts || {};
    if (!banners.length) return '';
    const many = banners.length > 1;
    return html`<section class="banner-area ${many ? 'is-carousel' : ''}" aria-roledescription="${many ? 'carousel' : ''}" aria-label="Offers and announcements">
      <div class="banner-track">
        ${banners.map((b, i) => html`<div class="banner-slide" ${many ? raw('role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + banners.length + '"') : ''}>${slide(b, opts.preview)}</div>`)}
      </div>
      ${many ? html`<div class="banner-dots">${banners.map((b, i) => html`<button type="button" class="banner-dot" aria-label="Show banner ${i + 1} of ${banners.length}" aria-current="${String(i === 0)}" data-i="${i}"></button>`)}</div>` : ''}
    </section>`;
  }

  /** Wire up carousel behaviour inside `root`. Returns a cleanup function. */
  function mount(root) {
    const area = root.querySelector('.banner-area.is-carousel');
    if (!area) return () => {};
    const track = area.querySelector('.banner-track');
    const dots = Array.from(area.querySelectorAll('.banner-dot'));
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0, paused = false;
    const go = (i) => { index = (i + dots.length) % dots.length; track.scrollTo({ left: index * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); };
    const sync = () => {
      index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    };
    dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.i))));
    track.addEventListener('scroll', () => window.requestAnimationFrame(sync), { passive: true });
    ['mouseenter', 'focusin', 'pointerdown'].forEach((ev) => area.addEventListener(ev, () => { paused = true; }));
    ['mouseleave', 'focusout'].forEach((ev) => area.addEventListener(ev, () => { paused = false; }));
    const timer = reduce ? null : setInterval(() => { if (!paused && document.visibilityState === 'visible') go(index + 1); }, 5000);
    return () => clearInterval(timer);
  }

  BP.banners = { render, mount, targetHref, describeTarget };
})();
