/* Sample data. Loaded into localStorage on first run (js/store.js).
   Bump `version` whenever the shape or content changes: stored data is then replaced by a fresh seed.
   All dates are built relative to "now" so the demo never goes stale. */
(function () {
  const BP = (window.BP = window.BP || {});

  const DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam',
    'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
  ];
  const QUALIFICATIONS = ['10th', '12th', 'Degree'];

  function isoDaysAgo(now, days) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function tsDaysAgo(now, days, hour) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hour == null ? 10 : hour, 0, 0);
    return d.getTime();
  }

  function build(now) {
    now = now || new Date();
    const ago = (n) => isoDaysAgo(now, n);
    const at = (n, h) => tsDaysAgo(now, n, h);

    /* ---------- Structure (Admin-managed) ---------- */
    const sections = [
      { id: 'sec_special', title: 'Boodham Special', order: 1, status: 'visible', theme: 'violet' },
      { id: 'sec_pyq', title: 'Boodham PSC PYQ', order: 2, status: 'visible', theme: 'blue' },
      { id: 'sec_mock', title: 'Boodham PSC Mock', order: 3, status: 'visible', theme: 'teal' },
      { id: 'sec_vault', title: 'Boodham Vault', order: 4, status: 'visible', theme: 'amber' },
    ];

    const stageYear = { usesStage: true, usesYear: true };
    const stageOnly = { usesStage: true, usesYear: false };
    const card = (id, sectionId, order, title, icon, template, settings, status) =>
      ({ id, sectionId, order, title, icon, template, settings: settings || {}, status: status || 'live' });

    const cards = [
      card('card_upsc_psc', 'sec_special', 1, 'UPSC / PSC', 'landmark', 'paper_test', stageOnly),
      card('card_psc_notification', 'sec_special', 2, 'PSC Notification', 'bell', 'notification'),
      card('card_pyq_download', 'sec_special', 3, 'PYQ Papers Download', 'download', 'paper_download'),

      card('card_pyq_10th', 'sec_pyq', 1, '10th', 'book', 'paper_test', stageYear),
      card('card_pyq_12th', 'sec_pyq', 2, '12th', 'book-open', 'paper_test', Object.assign({ usesTopics: true }, stageYear)),
      card('card_pyq_degree', 'sec_pyq', 3, 'Degree', 'graduation-cap', 'paper_test', stageYear),
      card('card_topic', 'sec_pyq', 4, 'Topic', 'layers', 'topic_test'),
      card('card_special_topic', 'sec_pyq', 5, 'Special Topic', 'target', 'paper_test', stageYear),
      card('card_sectional', 'sec_pyq', 6, 'Sectional', 'layout', 'paper_test', stageYear),

      card('card_mock_10th', 'sec_mock', 1, '10th', 'book', 'paper_test', stageOnly),
      card('card_mock_12th', 'sec_mock', 2, '12th', 'book-open', 'paper_test', stageOnly),
      card('card_mock_degree', 'sec_mock', 3, 'Degree', 'graduation-cap', 'paper_test', stageOnly),

      card('card_current_affairs', 'sec_vault', 1, 'Current Affairs', 'newspaper', 'current_affairs', { usesSubject: true }),
      card('card_scert', 'sec_vault', 2, 'SCERT', 'book-marked', 'paper_download', {}, 'coming_soon'),
      card('card_pdf', 'sec_vault', 3, 'PDF', 'file-text', 'paper_download', {}, 'coming_soon'),
    ];

    const subjects = [
      { id: 'subj_kerala_history', cardId: 'card_topic', title: 'Kerala History', icon: 'landmark', order: 1 },
      { id: 'subj_constitution', cardId: 'card_topic', title: 'Indian Constitution', icon: 'scale', order: 2 },
      { id: 'subj_science', cardId: 'card_topic', title: 'General Science', icon: 'flask', order: 3 },
    ];
    const subsections = [
      { id: 'subsec_reformers', subjectId: 'subj_kerala_history', title: 'Social reformers', order: 1 },
      { id: 'subsec_freedom', subjectId: 'subj_kerala_history', title: 'Freedom struggle in Kerala', order: 2 },
    ];

    const years = [2021, 2022, 2023, 2024];
    const downloadCategories = [
      { id: 'dc_10th', title: '10th', order: 1 },
      { id: 'dc_12th', title: '12th', order: 2 },
      { id: 'dc_degree', title: 'Degree', order: 3 },
      { id: 'dc_other', title: 'Other', order: 4 },
    ];

    /* ---------- People ---------- */
    const user = (id, name, phone, district, qualification, isPremium, daysAgo) =>
      ({ id, name, phone, district, qualification, isPremium: !!isPremium, premiumSince: isPremium ? at(daysAgo - 1) : null, joinedAt: at(daysAgo), sessionToken: null });
    const users = [
      user('u_demo', 'Anjali Menon', '9876543210', 'Thrissur', 'Degree', false, 40),
      user('u_rahul', 'Rahul Krishnan', '9847012345', 'Kozhikode', '12th', true, 62),
      user('u_sneha', 'Sneha Joseph', '9744098765', 'Kottayam', 'Degree', false, 33),
      user('u_ashiq', 'Muhammed Ashiq', '9562011223', 'Malappuram', 'Degree', true, 51),
      user('u_lakshmi', 'Lakshmi Nair', '9895066778', 'Thiruvananthapuram', '10th', false, 18),
      user('u_arun', 'Arun Kumar', '9633044556', 'Palakkad', null, false, 9),
      user('u_divya', 'Divya Thomas', '9446077889', 'Ernakulam', '12th', true, 27),
      user('u_nihal', 'Nihal Rasheed', '9037055667', 'Kannur', null, false, 3),
    ];
    const creators = [
      { id: 'cr_fathima', name: 'Fathima Rahman', email: 'fathima@boodhampsc.example', focus: 'Kerala history, current affairs', joinedAt: at(120) },
      { id: 'cr_vishnu', name: 'Vishnu Prasad', email: 'vishnu@boodhampsc.example', focus: 'Science, maths, notifications', joinedAt: at(95) },
    ];
    const admins = [{ id: 'ad_main', name: 'Boodham Admin', email: 'admin@boodhampsc.example' }];

    /* ---------- Banners ---------- */
    const banners = [
      { id: 'bn_degree', title: 'Degree level sample papers are now live', background: 'blue', image: null,
        linkType: 'internal', internalTarget: { type: 'card', id: 'card_pyq_degree' }, externalUrl: '', order: 1, active: true },
      { id: 'bn_ca', title: 'Practise current affairs every day, in English and Malayalam', background: 'violet', image: null,
        linkType: 'internal', internalTarget: { type: 'card', id: 'card_current_affairs' }, externalUrl: '', order: 2, active: true },
      { id: 'bn_official', title: 'Read the full notification on the Kerala PSC website', background: 'ink', image: null,
        linkType: 'external', internalTarget: null, externalUrl: 'https://www.keralapsc.gov.in', order: 3, active: false },
    ];

    const content = BP.seedContent.build({ now, at, ago, sections, cards, subjects, subsections });

    return {
      version: BP.seed.version,
      createdAt: now.getTime(),

      sections, cards, subjects, subsections, years, downloadCategories,
      topicGroups: BP.TOPIC_BANK.groups.map((g) => Object.assign({}, g)),
      topics: BP.TOPIC_BANK.topics.map((t) => Object.assign({}, t)),

      /* Content */
      tests: content.tests,
      papers: content.papers,
      applications: content.applications,
      exams: content.exams,
      caQuestions: content.caQuestions,
      banners,

      users, creators, admins,

      /* Activity */
      attempts: content.attempts,
      inbox: content.inbox,

      plan: {
        name: 'BoodhamPSC Premium',
        pricePerMonth: 199,
        benefits: [
          'Every premium test in every section',
          'Every premium question paper download',
          'New premium tests the day they are published',
        ],
      },
      settings: {
        reconnectSeconds: 60,
        heartbeatSeconds: 5,
        negativeFraction: 1 / 3,
      },
      session: {
        role: 'user',
        userId: null, userToken: null,
        creatorId: null, adminId: null,
        lang: 'en',
        pendingPhone: null,
        lastRoute: {},
      },
    };
  }

  BP.seed = { version: 7, build, DISTRICTS, QUALIFICATIONS, isoDaysAgo };
})();
