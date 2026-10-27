/* Test engine: one engine for every test.
   - Timer is based on a stored expiresAt, so it survives refresh. At zero the attempt auto-submits.
   - The test screen writes a heartbeat every few seconds. If the gap since the last heartbeat is
     over the reconnect window (60 s), the attempt auto-submits with the saved answers.
   - Every answer is saved the moment it is chosen. Every attempt is stored separately. */
(function () {
  const BP = (window.BP = window.BP || {});
  const HB_KEY = BP.store.KEY + '.hb';
  const settings = () => BP.store.state.settings;
  const windowMs = () => settings().reconnectSeconds * 1000;

  /* Heartbeats live under their own key so they do not trigger re-renders on every beat. */
  function readBeats() { try { return JSON.parse(localStorage.getItem(HB_KEY) || '{}'); } catch (e) { return {}; } }
  function beat(attemptId) {
    if (offline === attemptId) return;
    const b = readBeats(); b[attemptId] = Date.now();
    try { localStorage.setItem(HB_KEY, JSON.stringify(b)); } catch (e) { /* storage full or blocked */ }
  }
  function lastBeat(a) { return Math.max(a.lastHeartbeat || 0, readBeats()[a.id] || 0); }

  function get(id) { return BP.store.byId('attempts', id); }
  function inProgress(userId, testId) {
    return BP.store.state.attempts.find((a) => a.userId === userId && a.status === 'in_progress' && (!testId || a.testId === testId)) || null;
  }

  /** Start a fresh attempt. The test is copied into the attempt so its result and review never change later. */
  function start(testId, userId) {
    const t = BP.store.byId('tests', testId);
    const now = Date.now();
    const a = {
      id: BP.store.uid('att'), userId, testId,
      snapshot: {
        title: t.title, cardId: t.cardId, path: BP.content.testPath(t), durationMin: t.durationMin,
        marksPerQuestion: t.marksPerQuestion, negativeMarking: t.negativeMarking, negativeValue: t.negativeValue,
        questions: BP.content.clone(t.questions),
        // Topic-wise analysis: the card's switch and topic names at start time, so results never change later.
        usesTopics: !!((BP.store.byId('cards', t.cardId) || {}).settings || {}).usesTopics,
        topics: Object.fromEntries(t.questions.filter((q) => q.topicId).map((q) => { const tp = BP.store.q.topic(q.topicId); return [q.topicId, tp ? tp.title : 'Untitled topic']; })),
      },
      answers: {}, visited: [t.questions[0].id], current: 0,
      questionTimeMs: {}, activeQuestionStartedAt: now, reviewAnswers: {}, markedQuestions: [],
      startedAt: now, expiresAt: now + t.durationMin * 60000, lastHeartbeat: now,
      status: 'in_progress', autoReason: null, submittedAt: null, result: null,
    };
    BP.store.update((s) => { s.attempts.push(a); }, { silent: true });
    beat(a.id);
    return a.id;
  }

  /** Save one answer (index) or clear it (null). Silent: the test screen updates itself. */
  function answer(attemptId, qid, index) {
    BP.store.update((s) => {
      const a = s.attempts.find((x) => x.id === attemptId);
      if (!a || a.status !== 'in_progress') return;
      if (index == null) delete a.answers[qid]; else a.answers[qid] = index;
      a.lastHeartbeat = Date.now();
    }, { silent: true });
  }
  function visit(attemptId, index) {
    BP.store.update((s) => {
      const a = s.attempts.find((x) => x.id === attemptId);
      if (!a || a.status !== 'in_progress') return;
      const now = Date.now();
      const currentQid = a.snapshot.questions[a.current || 0].id;
      if (currentQid !== a.snapshot.questions[index].id) {
        a.questionTimeMs = a.questionTimeMs || {};
        a.questionTimeMs[currentQid] = (a.questionTimeMs[currentQid] || 0) + Math.max(0, now - (a.activeQuestionStartedAt || now));
        a.activeQuestionStartedAt = now;
      }
      a.current = index;
      const qid = a.snapshot.questions[index].id;
      if (!a.visited.includes(qid)) a.visited.push(qid);
    }, { silent: true });
  }

  /** Finish an attempt. status: 'submitted' | 'auto_submitted'; reason: null | 'time' | 'away'. */
  function finalize(attemptId, status, reason, opts) {
    let done = null;
    BP.store.update((s) => {
      const a = s.attempts.find((x) => x.id === attemptId);
      if (!a || a.status !== 'in_progress') return;
      const now = Date.now();
      const end = reason === 'time' ? a.expiresAt : reason === 'away' ? Math.min(lastBeat(a), a.expiresAt) : Math.min(now, a.expiresAt);
      const currentQid = a.snapshot.questions[a.current || 0].id;
      a.questionTimeMs = a.questionTimeMs || {};
      a.questionTimeMs[currentQid] = (a.questionTimeMs[currentQid] || 0) + Math.max(0, end - (a.activeQuestionStartedAt || end));
      a.questionTimeSec = {};
      a.snapshot.questions.forEach((q) => { a.questionTimeSec[q.id] = Math.round((a.questionTimeMs[q.id] || 0) / 1000); });
      a.status = status;
      a.autoReason = reason || null;
      a.submittedAt = now;
      a.result = Object.assign(BP.scoring.score(a.snapshot, a.answers), { timeTakenSec: Math.round((end - a.startedAt) / 1000) });
      done = a;
    }, opts);
    const b = readBeats(); delete b[attemptId];
    try { localStorage.setItem(HB_KEY, JSON.stringify(b)); } catch (e) { /* ignore */ }
    if (offline === attemptId) offline = null;
    return done;
  }

  /** Auto-submit anything past its time or the reconnect window. Called before every render and on an interval. */
  function sweep(opts) {
    const now = Date.now();
    const out = [];
    BP.store.state.attempts.filter((a) => a.status === 'in_progress').forEach((a) => {
      if (now >= a.expiresAt) out.push(finalize(a.id, 'auto_submitted', 'time', opts));
      else if (now - lastBeat(a) > windowMs()) out.push(finalize(a.id, 'auto_submitted', 'away', opts));
    });
    return out.filter(Boolean);
  }

  /* ---------- Simulated connection loss (demo panel) ---------- */
  let offline = null;
  function goOffline(attemptId) { offline = attemptId; }
  function reconnect() { const id = offline; offline = null; if (id) beat(id); }
  const isOffline = (id) => offline === id;
  /** Seconds left in the reconnect window while offline. */
  function graceLeft(a) { return Math.max(0, Math.ceil((windowMs() - (Date.now() - lastBeat(a))) / 1000)); }
  function reviewAnswer(attemptId, qid, index) {
    BP.store.update((s) => {
      const a = s.attempts.find((x) => x.id === attemptId);
      if (!a || !a.result) return;
      a.reviewAnswers = a.reviewAnswers || {};
      a.reviewAnswers[qid] = index;
    }, { silent: true });
  }
  function toggleMark(attemptId, qid) {
    let marked = false;
    BP.store.update((s) => {
      const a = s.attempts.find((x) => x.id === attemptId);
      if (!a || a.status !== 'in_progress') return;
      a.markedQuestions = a.markedQuestions || [];
      if (a.markedQuestions.includes(qid)) a.markedQuestions = a.markedQuestions.filter((id) => id !== qid);
      else a.markedQuestions.push(qid);
      marked = a.markedQuestions.includes(qid);
    }, { silent: true });
    return marked;
  }

  // Background sweep: catches tests left open elsewhere in the app.
  setInterval(() => {
    if (!BP.store.state) return;
    const route = BP.router.current;
    const viewing = route && route.ctx && route.ctx.params && route.ctx.params.attemptId;
    const done = sweep({ silent: true });
    if (!done.length) return;
    const mine = done.filter((a) => a.id !== viewing && a.userId === BP.store.state.session.userId);
    if (mine.length) BP.ui.toast('"' + mine[0].snapshot.title + '" was submitted automatically', { duration: 5000 });
    if (!done.some((a) => a.id === viewing)) BP.router.refresh();
  }, 5000);

  BP.engine = { start, get, inProgress, answer, visit, finalize, sweep, beat, lastBeat, goOffline, reconnect, isOffline, graceLeft, reviewAnswer, toggleMark };
})();
