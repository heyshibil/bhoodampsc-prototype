/* Content workflow and queries.
   Draft -> Submitted -> Published / Rejected; Admin can Unpublish. Creators can edit any time:
   edits to a published item are kept in item.pending until the admin approves them (users keep the live version). */
(function () {
  const BP = (window.BP = window.BP || {});
  const S = () => BP.store.state;
  const clone = (v) => JSON.parse(JSON.stringify(v));

  const TYPES = {
    tests: { label: 'Test', icon: 'file-text', fields: ['cardId', 'title', 'stage', 'year', 'subjectId', 'subsectionId', 'durationMin', 'marksPerQuestion', 'rules', 'questions'], defaults: () => ({ isPremium: false, negativeMarking: true, negativeValue: 1 / 3 }) },
    papers: { label: 'Question paper', icon: 'download', fields: ['cardId', 'title', 'categoryId', 'year', 'fileName', 'fileSize'], defaults: () => ({ isPremium: false }) },
    applications: { label: 'PSC application', icon: 'bell', fields: ['cardId', 'title', 'qualification', 'lastDate', 'vacancy', 'extraQualifications', 'stage', 'otherDetails', 'officialLink'], defaults: () => ({}) },
    exams: { label: 'PSC exam', icon: 'calendar', fields: ['cardId', 'title', 'startDate', 'endDate', 'otherDetails', 'officialLink'], defaults: () => ({}) },
    caQuestions: { label: 'Current affairs question', icon: 'newspaper', fields: ['cardId', 'subject', 'en', 'ml', 'correctIndex', 'publishDate'], defaults: () => ({}) },
  };
  const TYPE_KEYS = Object.keys(TYPES);

  /* ---------- Reading ---------- */
  function find(type, id) { return (S()[type] || []).find((x) => x.id === id) || null; }
  /** Fields a creator edits: the pending version if there is one, otherwise the item. */
  function working(type, item) {
    const src = item.pending || item;
    const out = {};
    TYPES[type].fields.forEach((f) => { out[f] = clone(src[f] !== undefined ? src[f] : item[f] !== undefined ? item[f] : null); });
    return out;
  }
  /** Where an item sits for its creator. */
  function stateOf(item) {
    if (item.pending) {
      const ps = item.pending.status;
      return { key: ps === 'submitted' ? 'submitted' : ps === 'rejected' ? 'rejected' : 'published', live: true, pending: ps, note: item.pending.reviewNote };
    }
    return { key: item.status, live: item.status === 'published', pending: null, note: item.reviewNote };
  }
  function titleOf(type, item) {
    const src = item.pending || item;
    return type === 'caQuestions' ? (src.en && src.en.text) || 'Untitled question' : src.title || 'Untitled';
  }

  /* ---------- Writing ---------- */
  /** Save (and optionally submit) a creator's work. Returns the item id. */
  function save(type, id, fields, creatorId, submit) {
    let outId = id;
    BP.store.update((s) => {
      const now = Date.now();
      const data = clone(fields);
      if (!id) {
        const item = Object.assign({ id: BP.store.uid(type.slice(0, 2)), status: submit ? 'submitted' : 'draft', createdBy: creatorId,
          reviewNote: null, reviewedBy: null, createdAt: now, updatedAt: now, submittedAt: submit ? now : null }, TYPES[type].defaults(), data);
        s[type].push(item);
        outId = item.id;
        return;
      }
      const item = s[type].find((x) => x.id === id);
      if (item.status === 'published') {
        const prev = item.pending || {};
        item.pending = Object.assign(data, {
          status: submit ? 'submitted' : prev.status === 'rejected' ? 'rejected' : 'draft',
          reviewNote: prev.reviewNote || null, updatedAt: now, submittedAt: submit ? now : prev.submittedAt || null,
          resubmitted: submit ? prev.status === 'rejected' : !!prev.resubmitted,
        });
      } else {
        Object.assign(item, data);
        item.updatedAt = now;
        if (submit) {
          item.resubmitted = item.status === 'rejected' || item.status === 'unpublished';
          item.status = 'submitted';
          item.submittedAt = now;
        }
      }
    });
    return outId;
  }

  /** Admin approves: pending changes merge into the live item; notifications alert every user. */
  function approve(type, id, opts, adminId) {
    BP.store.update((s) => {
      const now = Date.now();
      const item = s[type].find((x) => x.id === id);
      const firstPublish = item.status !== 'published';
      if (item.pending) {
        const p = item.pending;
        TYPES[type].fields.forEach((f) => { if (p[f] !== undefined) item[f] = p[f]; });
        delete item.pending;
      }
      item.status = 'published';
      item.reviewNote = null;
      item.reviewedBy = adminId;
      item.resubmitted = false;
      item.publishedAt = now;
      item.updatedAt = now;
      if (opts && 'isPremium' in opts) item.isPremium = !!opts.isPremium;
      if (type === 'tests') {
        if (opts && 'negativeMarking' in opts) item.negativeMarking = !!opts.negativeMarking;
        item.negativeValue = item.negativeMarking ? item.marksPerQuestion * s.settings.negativeFraction : 0;
      }
      if ((type === 'applications' || type === 'exams') && firstPublish) {
        const kind = type === 'applications' ? 'application' : 'exam';
        s.users.forEach((u) => {
          s.inbox.push({
            id: BP.store.uid('in'), userId: u.id, kind, refId: item.id,
            title: (kind === 'application' ? 'New PSC application: ' : 'Exam date: ') + item.title,
            body: kind === 'application' ? 'Last date ' + BP.ui.fmtDate(item.lastDate) + '. Tap to see the details.' : 'Exam on ' + BP.ui.fmtDate(item.startDate) + '. Tap to see the details.',
            createdAt: now, read: false, pushed: false,
          });
        });
      }
    });
  }
  function reject(type, id, note, adminId) {
    BP.store.update((s) => {
      const item = s[type].find((x) => x.id === id);
      const target = item.pending || item;
      target.status = 'rejected';
      target.reviewNote = note;
      item.reviewedBy = adminId;
      item.updatedAt = Date.now();
    });
  }
  function unpublish(type, id) {
    BP.store.update((s) => {
      const item = s[type].find((x) => x.id === id);
      if (item.pending) { // keep the creator's latest version so they can resubmit it
        TYPES[type].fields.forEach((f) => { if (item.pending[f] !== undefined) item[f] = item.pending[f]; });
        delete item.pending;
      }
      item.status = 'unpublished';
      item.updatedAt = Date.now();
    });
  }

  /* ---------- Validation (blocks submit, not save) ---------- */
  const LETTERS = ['A', 'B', 'C', 'D'];
  function questionIssues(q) {
    const out = [];
    if (!q.en.text.trim()) out.push('English question');
    if (!q.ml.text.trim()) out.push('Malayalam question');
    if (!String(q.en.explanation || '').trim()) out.push('English explanation');
    if (!String(q.ml.explanation || '').trim()) out.push('Malayalam explanation');
    q.en.options.forEach((o, i) => { if (!String(o).trim()) out.push('English option ' + LETTERS[i]); });
    q.ml.options.forEach((o, i) => { if (!String(o).trim()) out.push('Malayalam option ' + LETTERS[i]); });
    if (q.correctIndex == null || q.correctIndex < 0) out.push('Correct answer');
    return out;
  }
  const isUrl = (v) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v);
  function validate(type, f) {
    const e = [];
    const card = BP.store.byId('cards', f.cardId);
    if (type === 'tests') {
      if (!String(f.title || '').trim()) e.push('Add a test title.');
      if (card.template === 'paper_test' && card.settings.usesStage && !f.stage) e.push('Choose Prelims or Mains.');
      if (card.template === 'paper_test' && card.settings.usesYear && !f.year) e.push('Choose a year.');
      if (card.template === 'paper_test' && card.settings.usesSubject && !f.subjectId) e.push('Choose a subject.');
      if (card.template === 'topic_test') {
        if (!f.subjectId) e.push('Choose a subject.');
        else if (S().subsections.some((x) => x.subjectId === f.subjectId) && !f.subsectionId) e.push('Choose a subsection.');
      }
      if (!(f.durationMin >= 1 && f.durationMin <= 180)) e.push('Duration must be between 1 and 180 minutes.');
      if (!(f.marksPerQuestion > 0)) e.push('Marks per question must be more than 0.');
      if (!f.questions.length) e.push('Add at least one question.');
      f.questions.forEach((q, i) => { if (questionIssues(q).length) e.push('Question ' + (i + 1) + ' is incomplete: ' + questionIssues(q).join(', ') + '.'); });
    }
    if (type === 'papers') {
      if (!String(f.title || '').trim()) e.push('Add a paper title.');
      if (!f.categoryId) e.push('Choose a category.');
      if (!f.year) e.push('Choose a year.');
      if (!f.fileName) e.push('Choose the paper file (PDF).');
    }
    if (type === 'applications') {
      ['title', 'qualification', 'lastDate', 'stage'].forEach((k) => { if (!String(f[k] || '').trim()) e.push({ title: 'Add a title.', qualification: 'Add the qualification.', lastDate: 'Add the last date.', stage: 'Choose Prelims or Mains.' }[k]); });
    }
    if (type === 'exams') {
      if (!String(f.title || '').trim()) e.push('Add a title.');
      if (!f.startDate) e.push('Add the start date.');
      if (!f.endDate) e.push('Add the end date.');
      if (f.startDate && f.endDate && f.endDate < f.startDate) e.push('The end date cannot be before the start date.');
    }
    if ((type === 'applications' || type === 'exams') && f.officialLink && !isUrl(f.officialLink)) e.push('The official link must start with http:// or https://');
    if (type === 'caQuestions') {
      const issues = questionIssues(f);
      if (issues.length) e.push('Complete: ' + issues.join(', ') + '.');
      if (card && card.settings.usesSubject && !String(f.subject || '').trim()) e.push('Add a subject.');
      if (!f.publishDate) e.push('Choose a publish date.');
    }
    return e;
  }

  /* ---------- Paths ---------- */
  function cardPath(cardId) {
    const card = BP.store.byId('cards', cardId);
    if (!card) return ['Removed card'];
    const sec = BP.store.byId('sections', card.sectionId);
    return [sec ? sec.title : '', card.title];
  }
  function testPath(t) {
    const p = cardPath(t.cardId);
    if (t.stage) p.push(t.stage === 'prelims' ? 'Prelims' : 'Mains');
    if (t.year) p.push(String(t.year));
    const subj = t.subjectId && BP.store.byId('subjects', t.subjectId);
    if (subj) p.push(subj.title);
    const sub = t.subsectionId && BP.store.byId('subsections', t.subsectionId);
    if (sub) p.push(sub.title);
    return p;
  }

  /* ---------- Current affairs buckets (worked out from the date, never stored) ---------- */
  function caAge(publishDate, now) {
    now = now || new Date();
    const d = BP.ui.toDate(publishDate);
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((t - d) / 86400000);
  }
  function caBucket(publishDate) {
    const a = caAge(publishDate);
    if (a < 0) return 'scheduled';
    if (a < 7) return 'daily';
    if (a < 28) return 'weekly';
    return 'monthly';
  }

  /* ---------- Queries ---------- */
  const desc = (k) => (a, b) => (b[k] || 0) - (a[k] || 0);
  Object.assign(BP.store.q, {
    testsFor(cardId, f) {
      f = f || {};
      return S().tests.filter((t) => t.status === 'published' && t.cardId === cardId &&
        (f.stage === undefined || t.stage === f.stage) && (f.year === undefined || t.year === f.year) &&
        (f.subjectId === undefined || t.subjectId === f.subjectId) && (f.subsectionId === undefined || t.subsectionId === f.subsectionId))
        .sort((a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title));
    },
    yearsWithTests(cardId, stage) {
      const ys = new Set(BP.store.q.testsFor(cardId, stage ? { stage } : {}).map((t) => t.year).filter(Boolean));
      return Array.from(ys).sort((a, b) => b - a);
    },
    papersFor(cardId, categoryId, year) {
      return S().papers.filter((p) => p.status === 'published' && p.cardId === cardId && (!categoryId || p.categoryId === categoryId) && (!year || p.year === year))
        .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
    },
    yearsWithPapers(cardId, categoryId) {
      return Array.from(new Set(BP.store.q.papersFor(cardId, categoryId).map((p) => p.year))).sort((a, b) => b - a);
    },
    noticesFor(cardId, kind) {
      const list = S()[kind === 'exam' ? 'exams' : 'applications'].filter((n) => n.status === 'published' && n.cardId === cardId);
      return list.sort((a, b) => String(kind === 'exam' ? a.startDate : a.lastDate).localeCompare(String(kind === 'exam' ? b.startDate : b.lastDate)));
    },
    caFor(cardId) {
      return S().caQuestions.filter((q) => q.status === 'published' && q.cardId === cardId)
        .map((q) => ({ q, bucket: caBucket(q.publishDate) })).filter((x) => x.bucket !== 'scheduled')
        .sort((a, b) => String(b.q.publishDate).localeCompare(String(a.q.publishDate)));
    },
    attemptsFor(userId, testId) {
      return S().attempts.filter((a) => a.userId === userId && (!testId || a.testId === testId)).sort(desc('startedAt'));
    },
    inboxFor(userId) { return S().inbox.filter((n) => n.userId === userId).sort(desc('createdAt')); },
    contentByCreator(creatorId) {
      return TYPE_KEYS.flatMap((type) => S()[type].filter((x) => x.createdBy === creatorId).map((item) => ({ type, item })))
        .sort((a, b) => (b.item.pending ? b.item.pending.updatedAt : b.item.updatedAt) - (a.item.pending ? a.item.pending.updatedAt : a.item.updatedAt));
    },
  });

  BP.content = { TYPES, TYPE_KEYS, LETTERS, find, working, stateOf, titleOf, save, approve, reject, unpublish,
    questionIssues, validate, cardPath, testPath, caAge, caBucket, isUrl, clone };
})();
