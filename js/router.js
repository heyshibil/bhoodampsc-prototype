/* Hash router with role guard.
   A view: { role: 'user'|'creator'|'admin'|null, auth: bool (default true when role set), guestOnly,
             chrome: 'user'|'panel'|'none', nav, title, render(ctx) -> html, mount(root, ctx),
             actions: { name(el, ev, ctx) }, rerender: bool (default true) } */
(function () {
  const BP = (window.BP = window.BP || {});
  const routes = [];
  let current = null; // { view, ctx }

  const DEFAULT_ROUTE = { user: '/user/home', creator: '/creator/dashboard', admin: '/admin/dashboard' };
  const LOGIN_ROUTE = { user: '/user/login', creator: '/creator/login', admin: '/admin/login' };

  function add(pattern, view) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/\/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
    const existing = routes.findIndex((r) => r.pattern === pattern);
    const entry = { pattern, re, keys, view };
    if (existing >= 0) routes[existing] = entry; else routes.push(entry);
  }

  function parse(hash) {
    const h = (hash || '').replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
    return { path, query, hash: h };
  }
  function match(path) {
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        return { route: r, params };
      }
    }
    return null;
  }

  /** Build a hash from a path and a query object (empty values dropped). */
  function href(path, query) {
    const qs = new URLSearchParams();
    Object.keys(query || {}).forEach((k) => { if (query[k] != null && query[k] !== '') qs.set(k, query[k]); });
    const s = qs.toString();
    return '#' + path + (s ? '?' + s : '');
  }
  function go(path, query, { replace = false } = {}) {
    const target = path.startsWith('#') ? path : href(path, query);
    if (replace) { history.replaceState(null, '', target); render(); }
    else if (location.hash === target) render();
    else location.hash = target;
  }

  /** Role guard: returns a redirect path or null. */
  function guard(view) {
    const role = view.role;
    if (!role) return null;
    const S = BP.store.session;
    let authed;
    if (role === 'user') {
      const st = S.userState();
      if (st === 'signed_out' && view.auth !== false) return '/user/signed-out';
      authed = st === 'ok';
    } else if (role === 'creator') authed = !!S.creator();
    else authed = !!S.admin();
    if (view.auth !== false && !authed) return LOGIN_ROUTE[role];
    if (view.guestOnly && authed) return DEFAULT_ROUTE[role];
    // A new user must finish onboarding (name) before anything else.
    if (role === 'user' && authed && view.auth !== false && !view.onboarding && !S.user().name) return '/user/onboarding';
    return null;
  }

  function render(opts) {
    opts = opts || {};
    const { path, query, hash } = parse(location.hash);
    if (path === '/' || path === '') {
      const role = BP.store.state.session.role || 'user';
      const last = BP.store.state.session.lastRoute[role];
      go(last ? '#' + last : DEFAULT_ROUTE[role], null, { replace: true });
      return;
    }
    if (BP.engine) BP.engine.sweep({ silent: true }); // auto-submit tests past their time or the reconnect window
    const found = match(path);
    const view = found ? found.route.view : BP.views.notFound;
    const redirect = guard(view);
    if (redirect) { go(redirect, null, { replace: true }); return; }

    // Remember the role and its last screen so the demo panel can switch back to it.
    // Write only when something changed: every write reaches other open tabs, which re-render,
    // so unconditional writes would make two tabs echo each other forever.
    if (view.role && !opts.external) {
      const sess = BP.store.state.session;
      const remember = view.auth !== false && !view.noRemember;
      if (sess.role !== view.role || (remember && sess.lastRoute[view.role] !== hash)) {
        BP.store.update((s) => {
          s.session.role = view.role;
          if (remember) s.session.lastRoute[view.role] = hash;
        }, { silent: true });
      }
    }

    const S = BP.store.session;
    const ctx = {
      params: found ? found.params : {}, query, path, hash, view,
      user: S.user(), creator: S.creator(), admin: S.admin(),
      go, href,
    };
    const isNavigation = !opts.rerender;
    const scrollY = window.scrollY;
    const app = document.getElementById('app');
    if (current && current.view.unmount) current.view.unmount(current.ctx);
    const content = view.render(ctx);
    const shell = BP.shells[view.chrome || 'none'];
    app.innerHTML = String(shell ? shell(content, ctx) : content);

    document.body.classList.toggle('has-bottomnav', view.chrome === 'user');
    document.body.dataset.role = view.role || 'none';
    const title = typeof view.title === 'function' ? view.title(ctx) : view.title;
    document.title = (title ? title + ' · ' : '') + 'BoodhamPSC';

    current = { view, ctx };
    const main = document.getElementById('main') || app;
    if (view.mount) view.mount(main, ctx);
    if (isNavigation) {
      BP.ui.closeAllSheets();
      window.scrollTo(0, 0);
      // Focus the screen's first field if it asks for it (login, OTP), otherwise its heading.
      const auto = app.querySelector('[autofocus]');
      const h1 = main.querySelector('h1');
      if (auto) auto.focus({ preventScroll: true });
      else if (h1 && opts.focus !== false) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    } else {
      window.scrollTo(0, scrollY);
    }
    BP.store.emit('rendered', ctx);
  }

  /** Re-render the current screen after a data change, keeping scroll. Views can opt out (forms). */
  function refresh(opts) {
    if (!current) return;
    if (current.view.rerender === false && !(opts && opts.force)) return;
    render({ rerender: true, external: !!(opts && opts.external) });
  }

  // One delegated click handler for the whole app: [data-act] -> view action -> shell action -> global action.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.closest('#overlay-root')) return;
    const name = el.dataset.act;
    const ctx = current && current.ctx;
    const fn = (current && current.view.actions && current.view.actions[name]) ||
               (BP.shellActions && BP.shellActions[name]) || (BP.actions && BP.actions[name]);
    if (fn) { e.preventDefault(); fn(el, e, ctx); }
  });

  function start() {
    window.addEventListener('hashchange', () => render());
    // A change made in another tab re-renders here without writing back (see the bookkeeping note above).
    BP.store.on('change', (o) => refresh(o && o.external ? { external: true } : undefined));
    BP.store.on('reset', () => { go(LOGIN_ROUTE.user, null, { replace: true }); });
    render();
  }

  BP.router = { add, go, href, render, refresh, start, DEFAULT_ROUTE, LOGIN_ROUTE, get current() { return current; } };
  BP.views = BP.views || {};
  BP.shells = BP.shells || {};
  BP.shellActions = BP.shellActions || {};
})();
