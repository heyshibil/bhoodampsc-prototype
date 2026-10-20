/* Data store: seed -> localStorage, change events, sessions, query helpers, status rules.
   Every screen reads through these helpers. Users only ever see published content. */
(function () {
  const BP = (window.BP = window.BP || {});
  const KEY = 'boodham.v1';
  let state = null;
  const listeners = {};

  /* ---------- Persistence ---------- */
  function fresh() { return BP.seed.build(new Date()); }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === BP.seed.version) { state = parsed; return; }
        // Update only the requested seeded mock on existing v5 demos; keep saved attempts,
        // creator drafts and admin structure/content intact.
        if (parsed && parsed.version === 5 && BP.seed.version === 6) {
          const seededMock = fresh().tests.find((test) => test.id === 't_pyq12_real_mock');
          if (seededMock && Array.isArray(parsed.tests)) {
            let replaced = false;
            parsed.tests = parsed.tests.map((test) => {
              if (test.id !== seededMock.id) return test;
              replaced = true;
              return seededMock;
            });
            if (!replaced) parsed.tests.push(seededMock);
            parsed.version = BP.seed.version;
            state = parsed;
            save();
            return;
          }
        }
      }
    } catch (e) { /* corrupt or blocked storage: fall through to a fresh seed */ }
    state = fresh();
    save();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('BoodhamPSC: could not save demo data', e); }
  }
  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return () => { listeners[evt] = listeners[evt].filter((f) => f !== fn); };
  }
  function emit(evt, detail) { (listeners[evt] || []).slice().forEach((fn) => fn(detail)); }

  /** Mutate state, save and notify. opts.silent skips the re-render (used for bookkeeping writes). */
  function update(fn, opts) {
    fn(state);
    save();
    if (!(opts && opts.silent)) emit('change', opts || {});
  }
  function reset() {
    try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '.hb'); } catch (e) { /* ignore */ }
    state = fresh();
    save();
    emit('reset');
  }

  // A second tab (e.g. Admin in one window, User in another) stays in sync.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    try { state = e.newValue ? JSON.parse(e.newValue) : fresh(); } catch (err) { state = fresh(); }
    emit('change', { external: true });
  });

  /* ---------- Generic helpers ---------- */
  const uid = (prefix) => prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
  function get(name) { return state[name]; }
  function byId(name, id) { return (state[name] || []).find((x) => x.id === id) || null; }

  /* ---------- Flow templates (code, not structure) ---------- */
  BP.TEMPLATES = {
    paper_test: {
      label: 'Paper Test',
      description: 'Optional Prelims / Mains, Year and Subject filters, then a test list.',
      settings: [
        { key: 'usesStage', label: 'Uses Prelims / Mains' },
        { key: 'usesYear', label: 'Uses Year' },
        { key: 'usesSubject', label: 'Uses Subject' },
      ],
      creates: 'test',
    },
    topic_test: { label: 'Topic Test', description: 'Subject, then subsection if any, then a test list.', settings: [], creates: 'test' },
    notification: { label: 'Notification', description: 'Application and Exam tabs, list, detail page.', settings: [], creates: 'notice' },
    paper_download: { label: 'Paper Download', description: 'Category, then year, then papers to download.', settings: [], creates: 'paper' },
    current_affairs: { label: 'Current Affairs', description: 'Daily, Weekly and Monthly practice, sorted by date.', settings: [{ key: 'usesSubject', label: 'Show monthly subject filters' }], creates: 'ca' },
  };

  /* ---------- Section colour themes (css/components.css .theme-*) ---------- */
  BP.SECTION_THEMES = [
    { value: 'violet', label: 'Violet' }, { value: 'blue', label: 'Blue' }, { value: 'teal', label: 'Teal' },
    { value: 'amber', label: 'Amber' }, { value: 'rose', label: 'Rose' },
  ];
  /** A section's theme; sections without one get a stable theme from their position. */
  BP.themeOf = function (section) {
    if (section && BP.SECTION_THEMES.some((t) => t.value === section.theme)) return section.theme;
    const i = Math.max(0, (section && section.order ? section.order : 1) - 1);
    return BP.SECTION_THEMES[i % BP.SECTION_THEMES.length].value;
  };

  /* ---------- Status rules (one place) ---------- */
  BP.STATUS = {
    content: {
      draft: { label: 'Draft', pill: 'draft' },
      submitted: { label: 'In review', pill: 'submitted' },
      published: { label: 'Published', pill: 'published' },
      rejected: { label: 'Rejected', pill: 'rejected' },
      unpublished: { label: 'Unpublished', pill: 'unpublished' },
    },
    card: {
      live: { label: 'Live', pill: 'live' },
      coming_soon: { label: 'Coming soon', pill: 'coming_soon' },
      hidden: { label: 'Hidden', pill: 'hidden' },
    },
  };
  /** Who may move content from one status to another. Creators can never publish. */
  const TRANSITIONS = {
    creator: { draft: ['submitted'], rejected: ['submitted'], unpublished: ['submitted'], submitted: ['submitted'] },
    admin: { submitted: ['published', 'rejected'], published: ['unpublished'] },
  };
  function canTransition(item, to, role) {
    const allowed = (TRANSITIONS[role] || {})[item.status] || [];
    return allowed.includes(to);
  }

  /* ---------- Sessions ---------- */
  const session = {
    get() { return state.session; },
    /** 'ok' | 'signed_out' (account used on another device) | 'none' */
    userState() {
      const s = state.session;
      if (!s.userId) return 'none';
      const u = byId('users', s.userId);
      if (!u) return 'none';
      return u.sessionToken === s.userToken ? 'ok' : 'signed_out';
    },
    user() { return session.userState() === 'ok' ? byId('users', state.session.userId) : null; },
    creator() { return byId('creators', state.session.creatorId); },
    admin() { return byId('admins', state.session.adminId); },
    loginUser(userId) {
      update((s) => {
        const token = uid('tok');
        const u = s.users.find((x) => x.id === userId);
        u.sessionToken = token;
        s.session.userId = userId;
        s.session.userToken = token;
      });
    },
    logoutUser() { update((s) => { s.session.userId = null; s.session.userToken = null; }); },
    /** Demo: the same account logs in somewhere else, so this browser's token no longer matches. */
    simulateOtherDevice() {
      update((s) => {
        const u = s.users.find((x) => x.id === s.session.userId);
        if (u) u.sessionToken = uid('tok');
      });
    },
    loginCreator(id) { update((s) => { s.session.creatorId = id; }); },
    logoutCreator() { update((s) => { s.session.creatorId = null; }); },
    loginAdmin(id) { update((s) => { s.session.adminId = id; }); },
    logoutAdmin() { update((s) => { s.session.adminId = null; }); },
    setLang(lang) { update((s) => { s.session.lang = lang; }); },
  };

  /* ---------- Query helpers ---------- */
  const q = {
    sections({ includeHidden } = {}) {
      return state.sections.filter((s) => includeHidden || s.status !== 'hidden').sort(byOrder);
    },
    cardsOf(sectionId, { includeHidden } = {}) {
      return state.cards.filter((c) => c.sectionId === sectionId && (includeHidden || c.status !== 'hidden')).sort(byOrder);
    },
    /** What the User Home renders: visible sections with their Live + Coming soon cards, in Admin order. */
    homeLayout() {
      return q.sections()
        .map((s) => ({ section: s, cards: q.cardsOf(s.id) }))
        .filter((g) => g.cards.length > 0);
    },
    activeBanners() { return state.banners.filter((b) => b.active).sort(byOrder); },
    published(name) { return (state[name] || []).filter((x) => x.status === 'published'); },
    /** Items waiting for Admin review, across every content type. */
    pendingApprovals() {
      const types = ['tests', 'papers', 'applications', 'exams', 'caQuestions'];
      return types.flatMap((t) => state[t].filter((x) => x.status === 'submitted' || (x.pending && x.pending.status === 'submitted'))
        .map((item) => ({ type: t, item })));
    },
    unreadCount(userId) { return state.inbox.filter((n) => n.userId === userId && !n.read).length; },
  };

  BP.store = { load, save, update, reset, on, emit, get, byId, uid, byOrder, canTransition, session, q, KEY,
    get state() { return state; } };
})();
