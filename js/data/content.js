/* Sample content: tests, PSC notifications, papers, current affairs, creator work in every status,
   the demo user's inbox and two past attempts. Called by seed.js. Everything is marked as sample. */
(function () {
  const BP = (window.BP = window.BP || {});

  const RULES = [
    'Each question has four options. Choose one.',
    'You can move between questions and change your answers until you submit.',
    'Your answers are saved as you go.',
    'The test submits automatically when the timer ends.',
    'If you lose connection, come back within 60 seconds to continue where you left off.',
  ].join('\n');

  const POOL_SUBJECT = { geo: 'Kerala geography', ref: 'Kerala renaissance', fre: 'Freedom movement', con: 'Indian Constitution', sci: 'General science', mat: 'Maths', eng: 'English', gk: 'General knowledge', ca: 'Current affairs', reason: 'Reasoning', mal: 'Malayalam' };
  const cloneQ = (q, id, subject) => ({ id, subject: subject || null, en: { text: q.en.text, options: q.en.options.slice(), explanation: q.en.explanation || '' }, ml: { text: q.ml.text, options: q.ml.options.slice(), explanation: q.ml.explanation || '' }, correctIndex: q.correctIndex });

  /** Pick n distinct questions, cycling through the given pools. `seed` varies the selection per test. */
  function pick(pools, seed, n) {
    n = n || 10;
    const out = [], used = new Set(), taken = {};
    for (let i = 0; out.length < n; i++) {
      let pool = null;
      for (let off = 0; off < pools.length; off++) {
        const candidate = pools[(i + off) % pools.length];
        if ((taken[candidate] || 0) < BP.QBANK[candidate].length) { pool = candidate; break; }
      }
      if (!pool) break;
      const arr = BP.QBANK[pool];
      let idx = (seed * 7 + Math.floor(i / pools.length) * 3 + i) % arr.length;
      let tries = 0;
      while (used.has(pool + idx) && tries++ < arr.length) idx = (idx + 1) % arr.length;
      used.add(pool + idx);
      taken[pool] = (taken[pool] || 0) + 1;
      out.push({ question: arr[idx], pool });
    }
    return out;
  }

  function build(env) {
    const { at, ago, sections, cards, subjects, subsections } = env;
    const days = (n) => ago(-n); // future date

    /* ---------- Tests ---------- */
    const T = (id, cardId, o) => {
      const neg = o.neg !== false;
      const questions = pick(o.pools, o.seed, o.n).map((entry, i) => cloneQ(entry.question, id + '_q' + (i + 1), o.withSubjects ? POOL_SUBJECT[entry.pool] : null));
      if (o.withSubjects) {
        const order = o.pools.map((pool) => POOL_SUBJECT[pool]);
        questions.sort((a, b) => order.indexOf(a.subject) - order.indexOf(b.subject));
      }
      return {
        id, cardId,
        stage: o.stage || null, year: o.year || null, subjectId: o.subject || null, subsectionId: o.sub || null,
        title: o.title, durationMin: o.min || 8, marksPerQuestion: 1,
        negativeMarking: neg, negativeValue: neg ? 1 / 3 : 0, isPremium: !!o.premium,
        rules: RULES,
        questions,
        status: o.status || 'published', createdBy: o.by || 'cr_fathima', reviewNote: o.note || null,
        reviewedBy: o.status && o.status !== 'published' ? null : 'ad_main', sample: true,
        createdAt: at(o.ago == null ? 20 : o.ago), updatedAt: at(o.ago == null ? 20 : o.ago),
      };
    };
    const L10 = ['geo', 'gk', 'sci', 'mat', 'eng', 'ref'];
    const L12 = ['geo', 'con', 'sci', 'mat', 'eng', 'fre'];
    const LD = ['con', 'ref', 'fre', 'sci', 'mat', 'eng', 'gk', 'geo'];
    const GS = ['gk', 'con', 'sci', 'geo', 'fre', 'mat'];
    const P = 'prelims', M = 'mains';
    const V = 'cr_vishnu';

    const tests = [
      T('t_upsc_p1', 'card_upsc_psc', { stage: P, title: 'General Studies Prelims · Sample 1', pools: GS, seed: 1 }),
      T('t_upsc_p2', 'card_upsc_psc', { stage: P, title: 'General Studies Prelims · Sample 2', pools: GS, seed: 2, premium: true, by: V }),
      T('t_upsc_m1', 'card_upsc_psc', { stage: M, title: 'General Studies Mains · Sample 1', pools: GS, seed: 3, min: 10 }),

      T('t_pyq10_p23', 'card_pyq_10th', { stage: P, year: 2023, title: '10th Level Prelims 2023 · Sample paper', pools: L10, seed: 4 }),
      T('t_pyq10_p22', 'card_pyq_10th', { stage: P, year: 2022, title: '10th Level Prelims 2022 · Sample paper', pools: L10, seed: 5, by: V }),
      T('t_pyq10_m23', 'card_pyq_10th', { stage: M, year: 2023, title: '10th Level Mains 2023 · Sample paper', pools: L10, seed: 6, min: 10, premium: true }),

      T('t_pyq12_p23', 'card_pyq_12th', { stage: P, year: 2023, title: '12th Level Prelims 2023 · Sample paper', pools: L12, seed: 7 }),
      T('t_pyq12_real_mock', 'card_pyq_12th', { stage: P, year: 2023, title: 'Real PSC Mock', pools: ['ca', 'mat', 'reason', 'mal', 'eng'], seed: 23, n: 100, min: 90, withSubjects: true }),
      T('t_pyq12_p22', 'card_pyq_12th', { stage: P, year: 2022, title: '12th Level Prelims 2022 · Sample paper', pools: L12, seed: 8, premium: true, by: V }),
      T('t_pyq12_m22', 'card_pyq_12th', { stage: M, year: 2022, title: '12th Level Mains 2022 · Sample paper', pools: L12, seed: 9, min: 10 }),

      T('t_pyqd_p23_1', 'card_pyq_degree', { stage: P, year: 2023, title: 'Degree Level Prelims 2023 · Sample paper 1', pools: LD, seed: 10, ago: 30 }),
      T('t_pyqd_p23_2', 'card_pyq_degree', { stage: P, year: 2023, title: 'Degree Level Prelims 2023 · Sample paper 2', pools: LD, seed: 11, premium: true, by: V }),
      T('t_pyqd_p22', 'card_pyq_degree', { stage: P, year: 2022, title: 'Degree Level Prelims 2022 · Sample paper', pools: LD, seed: 12 }),
      T('t_pyqd_m23', 'card_pyq_degree', { stage: M, year: 2023, title: 'Degree Level Mains 2023 · Sample paper', pools: LD, seed: 13, min: 10, premium: true, by: V }),
      T('t_pyqd_m22', 'card_pyq_degree', { stage: M, year: 2022, title: 'Degree Level Mains 2022 · Sample paper', pools: LD, seed: 14, min: 10 }),

      T('t_sp_p23', 'card_special_topic', { stage: P, year: 2023, title: 'Kerala renaissance · Special topic 2023', pools: ['ref', 'fre'], seed: 15 }),
      T('t_sp_p22', 'card_special_topic', { stage: P, year: 2022, title: 'Indian Constitution · Special topic 2022', pools: ['con'], seed: 16, premium: true, by: V }),
      T('t_sp_m23', 'card_special_topic', { stage: M, year: 2023, title: 'General science · Special topic 2023', pools: ['sci'], seed: 17, min: 10, by: V }),

      T('t_sec_p23', 'card_sectional', { stage: P, year: 2023, title: 'Arithmetic · Sectional 2023', pools: ['mat'], seed: 18, min: 6, by: V }),
      T('t_sec_m23', 'card_sectional', { stage: M, year: 2023, title: 'English grammar · Sectional 2023', pools: ['eng'], seed: 19, min: 6, neg: false }),
      T('t_sec_p22', 'card_sectional', { stage: P, year: 2022, title: 'General knowledge · Sectional 2022', pools: ['gk', 'geo'], seed: 20, premium: true }),

      T('t_mock10_p1', 'card_mock_10th', { stage: P, title: 'Mock test 1 · 10th Level Prelims', pools: L10, seed: 21 }),
      T('t_mock10_p2', 'card_mock_10th', { stage: P, title: 'Mock test 2 · 10th Level Prelims', pools: L10, seed: 22, premium: true, by: V }),
      T('t_mock10_m1', 'card_mock_10th', { stage: M, title: 'Mock test 1 · 10th Level Mains', pools: L10, seed: 23, min: 10, neg: false }),

      T('t_mock12_p1', 'card_mock_12th', { stage: P, title: 'Mock test 1 · 12th Level Prelims', pools: L12, seed: 24, by: V }),
      T('t_mock12_p2', 'card_mock_12th', { stage: P, title: 'Mock test 2 · 12th Level Prelims', pools: L12, seed: 25, premium: true }),
      T('t_mock12_m1', 'card_mock_12th', { stage: M, title: 'Mock test 1 · 12th Level Mains', pools: L12, seed: 26, min: 10 }),

      T('t_mockd_p1', 'card_mock_degree', { stage: P, title: 'Mock test 1 · Degree Level Prelims', pools: LD, seed: 27 }),
      T('t_mockd_p2', 'card_mock_degree', { stage: P, title: 'Mock test 2 · Degree Level Prelims', pools: LD, seed: 28, premium: true, by: V }),
      T('t_mockd_m1', 'card_mock_degree', { stage: M, title: 'Mock test 1 · Degree Level Mains', pools: LD, seed: 29, min: 10 }),

      T('t_top_ref1', 'card_topic', { subject: 'subj_kerala_history', sub: 'subsec_reformers', title: 'Social reformers · Set 1', pools: ['ref'], seed: 30, min: 6 }),
      T('t_top_ref2', 'card_topic', { subject: 'subj_kerala_history', sub: 'subsec_reformers', title: 'Social reformers · Set 2', pools: ['ref'], seed: 31, min: 6, premium: true }),
      T('t_top_fre1', 'card_topic', { subject: 'subj_kerala_history', sub: 'subsec_freedom', title: 'Freedom struggle in Kerala · Set 1', pools: ['fre'], seed: 32, min: 6 }),
      T('t_top_fre2', 'card_topic', { subject: 'subj_kerala_history', sub: 'subsec_freedom', title: 'Freedom struggle in Kerala · Set 2', pools: ['fre'], seed: 33, min: 6 }),
      T('t_top_con1', 'card_topic', { subject: 'subj_constitution', title: 'Indian Constitution · Set 1', pools: ['con'], seed: 34, min: 6, by: V }),
      T('t_top_con2', 'card_topic', { subject: 'subj_constitution', title: 'Indian Constitution · Set 2', pools: ['con'], seed: 35, min: 6, premium: true, by: V }),
      T('t_top_sci1', 'card_topic', { subject: 'subj_science', title: 'General science · Set 1', pools: ['sci'], seed: 36, min: 6, by: V }),
      T('t_top_sci2', 'card_topic', { subject: 'subj_science', title: 'General science · Set 2', pools: ['sci'], seed: 37, min: 6, neg: false, by: V }),

      /* Creator work in progress (not visible to users) */
      T('t_cr_draft', 'card_topic', { subject: 'subj_kerala_history', sub: 'subsec_reformers', title: 'Renaissance leaders · Practice set', pools: ['ref'], seed: 38, n: 3, min: 5, status: 'draft', ago: 1 }),
      T('t_cr_rejected', 'card_special_topic', { stage: P, year: 2023, title: 'Freedom struggle · Special topic 2023', pools: ['fre'], seed: 39, n: 3, min: 5, status: 'rejected', ago: 3,
        note: 'Question 2: the Malayalam version of option C is incomplete. Please complete it and submit again.' }),
      T('t_cr_submitted', 'card_mock_degree', { stage: M, title: 'Mock test 3 · Degree Level Mains (science and maths)', pools: ['sci', 'mat'], seed: 40, min: 10, status: 'submitted', by: V, ago: 1 }),
    ];
    // Make the rejected item's problem real: truncate the Malayalam text of Q2 option C.
    const rej = tests.find((t) => t.id === 't_cr_rejected');
    rej.questions[1].ml.options[2] = rej.questions[1].ml.options[2].slice(0, 3);
    // Creator-made, not yet approved: admin-only settings are still at their defaults.
    tests.filter((t) => t.status !== 'published').forEach((t) => { t.isPremium = false; t.negativeMarking = true; t.negativeValue = 1 / 3; });

    /* ---------- PSC notifications (sample) ---------- */
    const N = (o) => Object.assign({ cardId: 'card_psc_notification', status: 'published', createdBy: V, reviewNote: null, reviewedBy: 'ad_main', sample: true, officialLink: '', createdAt: at(o.agoDays == null ? 5 : o.agoDays), updatedAt: at(o.agoDays == null ? 5 : o.agoDays), submittedAt: o.status === 'submitted' ? at(o.agoDays == null ? 5 : o.agoDays) : null }, o);
    const applications = [
      N({ id: 'app_ldc', title: 'Lower Division Clerk (various departments)', qualification: 'Pass in SSLC or equivalent', lastDate: days(21), vacancy: 'Anticipated vacancies',
        extraQualifications: 'Ability to read and write Malayalam', stage: 'Prelims', otherDetails: 'Selection is through a common preliminary exam followed by a main exam. Apply through your one-time registration profile.', officialLink: 'https://www.keralapsc.gov.in', agoDays: 6 }),
      N({ id: 'app_lgs', title: 'Last Grade Servant (various departments)', qualification: 'Pass in Standard VII', lastDate: days(14), vacancy: 'Anticipated vacancies',
        extraQualifications: 'None', stage: 'Prelims', otherDetails: 'Candidates must apply online. Keep your profile photo and signature up to date before applying.', agoDays: 8 }),
      N({ id: 'app_sa', title: 'Secretariat Assistant', qualification: 'Degree from a recognised university', lastDate: days(30), vacancy: 'Anticipated vacancies',
        extraQualifications: 'Basic computer knowledge', stage: 'Mains', otherDetails: 'Candidates who qualify in the degree level preliminary exam will be called for the main exam.', officialLink: 'https://www.keralapsc.gov.in', agoDays: 4 }),
      N({ id: 'app_pc', title: 'Police Constable (armed police battalion)', qualification: 'Pass in Plus Two or equivalent', lastDate: days(4), vacancy: 'Anticipated vacancies',
        extraQualifications: 'Physical standards and a physical efficiency test apply', stage: 'Prelims', otherDetails: 'Shortlisted candidates will be called for the physical efficiency test.', agoDays: 1 }),
      N({ id: 'app_ag2', title: 'Assistant Grade II (various departments)', qualification: 'Degree from a recognised university', lastDate: days(25), vacancy: 'Anticipated vacancies',
        extraQualifications: 'Basic computer knowledge', stage: 'Prelims', otherDetails: 'Common preliminary exam for degree level posts.', status: 'submitted', reviewedBy: null, agoDays: 0 }),
    ];
    const exams = [
      N({ id: 'ex_ldc', title: 'Lower Division Clerk: preliminary exam', startDate: days(26), endDate: days(26),
        otherDetails: 'Admission tickets can be downloaded from your profile about 15 days before the exam. Report at the centre 30 minutes early.', officialLink: 'https://www.keralapsc.gov.in', agoDays: 5 }),
      N({ id: 'ex_degree', title: 'Degree level common preliminary exam', startDate: days(40), endDate: days(54),
        otherDetails: 'Held in stages. Check your admission ticket for your stage and centre.', agoDays: 7, createdBy: 'cr_fathima' }),
      N({ id: 'ex_vfa', title: 'Village Field Assistant: OMR exam', startDate: days(9), endDate: days(9),
        otherDetails: 'OMR exam. Bring the admission ticket and an original photo ID.', agoDays: 2 }),
    ];

    /* ---------- Papers for download (sample) ---------- */
    const Pp = (id, title, categoryId, year, isPremium, extra) => Object.assign({
      id, cardId: 'card_pyq_download', title, categoryId, year, isPremium, fileName: id.replace(/_/g, '-') + '.pdf', fileSize: 420000 + year * 37 % 300000,
      status: 'published', createdBy: V, reviewNote: null, reviewedBy: 'ad_main', sample: true, createdAt: at(25), updatedAt: at(25),
    }, extra || {});
    const papers = [
      Pp('pp_ldc_2023', 'Lower Division Clerk · sample paper', 'dc_10th', 2023, false),
      Pp('pp_lgs_2022', 'Last Grade Servant · sample paper', 'dc_10th', 2022, true),
      Pp('pp_pc_2023', 'Police Constable · sample paper', 'dc_12th', 2023, false),
      Pp('pp_plus2_2021', 'Plus Two level preliminary · sample paper', 'dc_12th', 2021, true),
      Pp('pp_degree_2023', 'Degree level preliminary · sample paper', 'dc_degree', 2023, false),
      Pp('pp_sa_2022', 'Secretariat Assistant · sample paper', 'dc_degree', 2022, true),
      Pp('pp_ua_2021', 'University Assistant · sample paper', 'dc_degree', 2021, false),
      Pp('pp_vfa_2022', 'Village Field Assistant · sample paper', 'dc_other', 2022, false),
      Pp('pp_fw_draft', 'Field Worker · sample paper', 'dc_other', 2023, false, { status: 'draft', reviewedBy: null, createdAt: at(1), updatedAt: at(1) }),
    ];

    /* ---------- Current affairs (sample): dated relative to today so every tab has content ---------- */
    const CA_DAYS = [0, 0, 1, 2, 4, 6, 9, 15, 26, 35, 40, 52, 62, 70, 85];
    const caQuestions = BP.QBANK.ca.map((q, i) => {
      const id = 'ca_' + (i + 1);
      const submitted = i === BP.QBANK.ca.length - 1;
      return Object.assign(cloneQ(q, id), {
        cardId: 'card_current_affairs',
        subject: ['General Knowledge', 'Art', 'Science', 'Malayalam', 'English'][i % 5],
        publishDate: submitted ? ago(0) : ago(CA_DAYS[i]),
        status: submitted ? 'submitted' : 'published', createdBy: 'cr_fathima', reviewNote: null,
        reviewedBy: submitted ? null : 'ad_main', sample: true, createdAt: at(submitted ? 0 : CA_DAYS[i]), updatedAt: at(submitted ? 0 : CA_DAYS[i]),
      });
    });

    /* ---------- Demo user's inbox ---------- */
    const inbox = [
      { id: 'in_1', userId: 'u_demo', kind: 'application', refId: 'app_pc', title: 'New PSC application: Police Constable (armed police battalion)', body: 'Last date is coming up soon. Tap to see the details.', createdAt: at(1, 9), read: false, pushed: true },
      { id: 'in_2', userId: 'u_demo', kind: 'application', refId: 'app_sa', title: 'New PSC application: Secretariat Assistant', body: 'Degree level. Tap to see the details.', createdAt: at(4, 11), read: true, pushed: true },
      { id: 'in_3', userId: 'u_demo', kind: 'exam', refId: 'ex_ldc', title: 'Exam date: Lower Division Clerk preliminary exam', body: 'Tap to see the exam dates.', createdAt: at(5, 16), read: true, pushed: true },
      { id: 'in_4', userId: 'u_demo', kind: 'application', refId: 'app_ldc', title: 'New PSC application: Lower Division Clerk', body: 'Tap to see the details.', createdAt: at(6, 10), read: true, pushed: true },
    ];

    /* ---------- Two past attempts for the demo user ---------- */
    function pathFor(t) {
      const card = cards.find((c) => c.id === t.cardId);
      const sec = sections.find((s) => s.id === card.sectionId);
      const p = [sec.title, card.title];
      if (t.stage) p.push(t.stage === 'prelims' ? 'Prelims' : 'Mains');
      if (t.year) p.push(String(t.year));
      if (t.subjectId) p.push(subjects.find((s) => s.id === t.subjectId).title);
      if (t.subsectionId) p.push(subsections.find((s) => s.id === t.subsectionId).title);
      return p;
    }
    function pastAttempt(id, test, daysAgo, pattern, opts) {
      const snapshot = { title: test.title, cardId: test.cardId, path: pathFor(test), durationMin: test.durationMin, marksPerQuestion: test.marksPerQuestion,
        negativeMarking: test.negativeMarking, negativeValue: test.negativeValue, questions: test.questions.map((q) => JSON.parse(JSON.stringify(q))) };
      const answers = {};
      snapshot.questions.forEach((q, i) => {
        const p = pattern[i];
        if (p === 'c') answers[q.id] = q.correctIndex;
        if (p === 'w') answers[q.id] = (q.correctIndex + 1) % 4;
      });
      const startedAt = at(daysAgo, 19);
      const taken = opts.takenSec;
      return {
        id, userId: 'u_demo', testId: test.id, snapshot, answers, visited: snapshot.questions.map((q) => q.id), current: 0,
        questionTimeSec: Object.fromEntries(snapshot.questions.map((q, i) => [q.id, Math.floor(taken / snapshot.questions.length) + (i < taken % snapshot.questions.length ? 1 : 0)])), reviewAnswers: {},
        startedAt, expiresAt: startedAt + test.durationMin * 60000, lastHeartbeat: startedAt + taken * 1000,
        status: opts.status, autoReason: opts.autoReason || null, submittedAt: startedAt + taken * 1000,
        result: Object.assign(BP.scoring.score(snapshot, answers), { timeTakenSec: taken }),
      };
    }
    const attempts = [
      pastAttempt('att_seed_1', tests.find((t) => t.id === 't_pyqd_p23_1'), 2, ['c', 'c', 'w', 'c', 'c', 's', 'c', 'w', 'c', 's'], { status: 'submitted', takenSec: 372 }),
      pastAttempt('att_seed_2', tests.find((t) => t.id === 't_top_con1'), 5, ['c', 'c', 'c', 'w', 'c', 'c', 's', 'c', 's', 'c'], { status: 'auto_submitted', autoReason: 'time', takenSec: 360 }),
    ];

    return { tests, applications, exams, papers, caQuestions, inbox, attempts };
  }

  BP.seedContent = { build, RULES };
})();
