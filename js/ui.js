/* Shared render helpers: safe HTML, sheets/modals, toasts, confirm, small components, markdown. */
(function () {
  const BP = (window.BP = window.BP || {});

  /* ---------- Safe HTML templating ----------
     html`<p>${value}</p>` escapes every value. Nested html`` results and raw() pass through. Arrays are joined. */
  function Raw(s) { this.s = s; }
  Raw.prototype.toString = function () { return this.s; };
  const raw = (s) => new Raw(s == null ? '' : String(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  function toHtml(v) {
    if (v == null || v === false || v === true) return '';
    if (v instanceof Raw) return v.s;
    if (Array.isArray(v)) return v.map(toHtml).join('');
    return esc(v);
  }
  function html(strings, ...vals) {
    let out = '';
    strings.forEach((s, i) => { out += s; if (i < vals.length) out += toHtml(vals[i]); });
    return new Raw(out);
  }
  const icon = (name, cls) => raw(BP.icon(name, cls));

  /* ---------- Small components ---------- */
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }
  function tone(seed) { let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) % 997; return h % 4; }
  const avatar = (name, cls) => html`<span class="avatar ${cls || ''}" data-tone="${tone(name)}" aria-hidden="true">${initials(name)}</span>`;
  /** variant: accent|success|error|warning|neutral|ink; size: sm|lg */
  const iconTile = (name, variant, size) =>
    html`<span class="icon-tile ${variant ? 'icon-tile--' + variant : ''} ${size ? 'icon-tile--' + size : ''}" aria-hidden="true">${icon(name)}</span>`;
  const pill = (kind, label) => html`<span class="pill pill--${kind}">${label}</span>`;
  function contentPill(status) { const s = BP.STATUS.content[status] || { label: status, pill: 'neutral' }; return pill(s.pill, s.label); }
  function cardPill(status) { const s = BP.STATUS.card[status] || { label: status, pill: 'neutral' }; return pill(s.pill, s.label); }
  const tag = (kind, label, iconName) => html`<span class="tag tag--${kind}">${iconName ? icon(iconName) : ''}${label}</span>`;

  function emptyState({ icon: ic = 'ghost', title, text, action }) {
    return html`<div class="empty">
      ${iconTile(ic, 'neutral', 'lg')}
      <h3>${title}</h3>
      ${text ? html`<p>${text}</p>` : ''}
      ${action || ''}
    </div>`;
  }

  /** Segmented tabs. items: [{value, label, count?}] */
  function segmented(items, current, { act = 'tab', label = 'Tabs', block = false, size = '' } = {}) {
    return html`<div class="segmented ${block ? 'segmented--block' : ''} ${size ? 'segmented--' + size : ''}" role="tablist" aria-label="${label}">
      ${items.map((it) => html`<button type="button" class="seg" role="tab" aria-selected="${String(it.value === current)}" data-act="${act}" data-value="${it.value}">${it.label}${it.count != null ? html` <span class="count">${it.count}</span>` : ''}</button>`)}
    </div>`;
  }

  /* ---------- Dates ---------- */
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function toDate(v) { if (v instanceof Date) return v; if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); } return new Date(v); }
  function fmtDate(v) { const d = toDate(v); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); }
  function fmtMonth(v) { const d = toDate(v); return MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtRelative(ts) {
    const diff = Date.now() - ts; const min = Math.round(diff / 60000);
    if (min < 1) return 'Just now'; if (min < 60) return min + ' min ago';
    const h = Math.round(min / 60); if (h < 24) return h + ' h ago';
    const d = Math.round(h / 24); if (d === 1) return 'Yesterday'; if (d < 7) return d + ' days ago';
    return fmtDate(ts);
  }

  /* ---------- Overlays: sheet (mobile) / modal (tablet+) ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let sheetCount = 0;
  const openSheets = new Set();

  /**
   * Open a sheet. opts: { title, body, foot, size: 'wide'|'xl', cls, dismissible=true,
   *   actions: { name(el, ev, api) }, onMount(el, api), onClose() }
   * Returns api { el, close() }.
   */
  function sheet(opts) {
    const root = document.getElementById('overlay-root');
    const id = 'sheet-title-' + ++sheetCount;
    const prevFocus = document.activeElement;
    const dismissible = opts.dismissible !== false;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = String(html`<div class="sheet ${opts.size ? 'sheet--' + opts.size : ''} ${opts.cls || ''}" role="dialog" aria-modal="true" aria-labelledby="${id}" tabindex="-1">
      <div class="sheet-head">
        <h2 id="${id}">${opts.title || ''}</h2>
        ${dismissible ? html`<button type="button" class="icon-btn icon-btn--plain" data-act="close" aria-label="Close">${icon('x')}</button>` : ''}
      </div>
      <div class="sheet-body">${opts.body || ''}</div>
      ${opts.foot ? html`<div class="sheet-foot">${opts.foot}</div>` : ''}
    </div>`);
    root.appendChild(ov);
    const panel = ov.querySelector('.sheet');
    let closed = false;

    const api = {
      el: panel,
      close(instant) {
        if (closed) return; closed = true;
        openSheets.delete(api);
        document.removeEventListener('keydown', onKey, true);
        const done = () => {
          ov.remove();
          if (opts.onClose) opts.onClose();
          if (!instant && prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
        };
        if (instant) { done(); return; }
        ov.classList.add('is-closing');
        const dur = parseFloat(getComputedStyle(ov).animationDuration) || 0;
        dur ? setTimeout(done, dur * 1000) : done();
      },
      setBody(content) { panel.querySelector('.sheet-body').innerHTML = String(content); },
    };

    function onKey(e) {
      if (ov !== root.lastElementChild) return; // only the top-most sheet reacts
      if (e.key === 'Escape' && dismissible) { e.preventDefault(); api.close(); }
      if (e.key === 'Tab') {
        const f = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    openSheets.add(api);
    ov.addEventListener('click', (e) => {
      if (e.target === ov && dismissible) { api.close(); return; }
      const el = e.target.closest('[data-act]');
      if (!el || !panel.contains(el)) return;
      e.stopPropagation();
      const name = el.dataset.act;
      if (name === 'close') { api.close(); return; }
      const fn = opts.actions && opts.actions[name];
      if (fn) { e.preventDefault(); fn(el, e, api); }
      else if (BP.actions && BP.actions[name]) { e.preventDefault(); BP.actions[name](el, e, api); }
    });

    if (opts.onMount) opts.onMount(panel, api);
    const firstField = panel.querySelector('[autofocus]') || panel;
    requestAnimationFrame(() => firstField.focus());
    return api;
  }

  /** Close every open sheet immediately (used on navigation). */
  function closeAllSheets() { Array.from(openSheets).forEach((api) => api.close(true)); }

  /** Confirm dialog. Resolves true/false. */
  function confirm({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      let result = false;
      sheet({
        title,
        body: html`<p class="t-body">${body}</p>`,
        foot: html`<button type="button" class="btn btn--secondary" data-act="cancel">${cancelLabel}</button>
                   <button type="button" class="btn ${danger ? 'btn--danger-solid' : 'btn--primary'}" data-act="ok">${confirmLabel}</button>`,
        actions: {
          cancel: (el, e, api) => api.close(),
          ok: (el, e, api) => { result = true; api.close(); },
        },
        onClose: () => resolve(result),
      });
    });
  }

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(message, { type = 'info', duration = 3000 } = {}) {
    const region = document.getElementById('toasts');
    if (!region) return;
    const ic = type === 'success' ? 'check' : type === 'error' ? 'alert-circle' : 'info';
    region.innerHTML = String(html`<div class="toast toast--${type}" role="status"><span class="toast-icon">${icon(ic)}</span><span>${message}</span></div>`);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      const t = region.firstElementChild; if (!t) return;
      t.classList.add('is-leaving');
      setTimeout(() => { if (t.parentNode) t.remove(); }, 200);
    }, duration);
  }

  /* ---------- Minimal markdown (headings, lists, tables, bold, italic, code, hr) ---------- */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>');
  }
  function markdown(src) {
    const lines = String(src).replace(/\r/g, '').split('\n');
    let out = '', i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }
      let m;
      if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { const n = m[1].length; out += `<h${n}>${inline(m[2])}</h${n}>`; i++; continue; }
      if (/^---+\s*$/.test(line)) { out += '<hr>'; i++; continue; }
      if (/^\|/.test(line)) {
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]); const body = rows.slice(2).map(cells);
        out += '<div class="md-table"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
          body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        out += '<ul>';
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { out += `<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`; i++; }
        out += '</ul>'; continue;
      }
      const para = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#|\||\s*[-*]\s|---)/.test(lines[i])) { para.push(lines[i]); i++; }
      out += `<p>${inline(para.join(' '))}</p>`;
    }
    return raw(out);
  }

  BP.ui = { html, raw, esc, icon, avatar, initials, iconTile, pill, contentPill, cardPill, tag, emptyState, segmented,
    fmtDate, fmtMonth, fmtRelative, toDate, sheet, closeAllSheets, confirm, toast, markdown };
  BP.html = html;
  BP.actions = BP.actions || {};
})();
