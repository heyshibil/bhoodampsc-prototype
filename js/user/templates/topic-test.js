/* Flow template: Topic Test. Card -> Subject cards -> Subtopics (only if the subject has any) -> test list. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, iconTile } = BP.ui;
  const byOrder = (a, b) => a.order - b.order;
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  BP.templates = BP.templates || {};
  BP.templates.topic_test = {
    render(card, section, ctx) {
      const st = BP.store.state;
      const q = BP.store.q;
      const base = '#/user/card/' + card.id;
      const subjects = st.subjects.filter((s) => s.cardId === card.id).sort(byOrder);
      const subject = subjects.find((s) => s.id === ctx.query.subject);
      const row = (href, icon, title, meta) => html`<a class="list-row" href="${href}">${iconTile(icon)}<span class="lr-main"><span class="lr-title">${title}</span><span class="lr-meta">${meta}</span></span>${raw(BP.icon('chevron-right', 'chev'))}</a>`;
      /** Subtopics of a subject that have tests to show. */
      const subtopicsOf = (subjectId) => st.subsections.filter((x) => x.subjectId === subjectId && q.testsFor(card.id, { subjectId, subsectionId: x.id }).length).sort(byOrder);

      // Level 1: subject cards
      if (!subject) {
        return html`${BP.u.pageHead({ back: '#/user/home', backLabel: 'Home', crumbs: [section.title], title: card.title, sub: 'Choose a subject' })}
          ${subjects.length ? html`<div class="tile-grid">${subjects.map((s, i) => {
            const subs = subtopicsOf(s.id);
            const n = q.testsFor(card.id, { subjectId: s.id }).length;
            const meta = n ? (subs.length ? plural(subs.length, 'subtopic') + ' · ' : '') + plural(n, 'test') : 'Tests coming';
            return BP.homeTile({ title: s.title, icon: s.icon || 'book', status: 'live' }, section, { variant: i + 1, meta, href: base + '?subject=' + s.id });
          })}</div>` : BP.ui.emptyState({ icon: 'layers', title: 'No subjects yet', text: 'Subjects appear here once the admin adds them.' })}`;
      }

      const subs = subtopicsOf(subject.id);
      const sub = subs.find((x) => x.id === ctx.query.sub);
      // Tests added before the subject had subtopics stay reachable under "Other tests".
      const others = subs.length ? q.testsFor(card.id, { subjectId: subject.id, subsectionId: null }) : [];
      const showOthers = others.length > 0 && ctx.query.sub === 'none';
      const subjectHref = base + '?subject=' + subject.id;

      // Level 2: subtopics (only when the subject has them)
      if (subs.length && !sub && !showOthers) {
        return html`${BP.u.pageHead({ back: base, backLabel: card.title, crumbs: [section.title, card.title], title: subject.title, sub: 'Choose a subtopic' })}
          <div class="list">${subs.map((x) => row(subjectHref + '&sub=' + x.id, 'list', x.title, plural(q.testsFor(card.id, { subjectId: subject.id, subsectionId: x.id }).length, 'test')))}
            ${others.length ? row(subjectHref + '&sub=none', 'folder', 'Other tests', plural(others.length, 'test')) : ''}</div>`;
      }

      // Level 3: tests
      const nested = sub || showOthers;
      const tests = sub ? q.testsFor(card.id, { subjectId: subject.id, subsectionId: sub.id }) : showOthers ? others : q.testsFor(card.id, { subjectId: subject.id });
      return html`${BP.u.pageHead({ back: nested ? subjectHref : base, backLabel: nested ? subject.title : card.title, crumbs: nested ? [card.title, subject.title] : [section.title, card.title], title: sub ? sub.title : showOthers ? 'Other tests' : subject.title })}
        ${tests.length ? html`<div class="list">${tests.map((t) => BP.u.testRow(t, ctx.user))}</div>`
          : BP.ui.emptyState({ icon: 'file-text', title: 'No tests here yet', text: 'New tests appear here as soon as they are approved.' })}`;
    },
  };
})();
