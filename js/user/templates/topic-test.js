/* Flow template: Topic Test. Card -> Subject -> Subsection (only if the subject has any) -> test list. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, iconTile } = BP.ui;
  const byOrder = (a, b) => a.order - b.order;
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  BP.templates = BP.templates || {};
  BP.templates.topic_test = {
    render(card, section, ctx) {
      const st = BP.store.state;
      const base = '#/user/card/' + card.id;
      const subjects = st.subjects.filter((s) => s.cardId === card.id).sort(byOrder);
      const subject = subjects.find((s) => s.id === ctx.query.subject);
      const row = (href, icon, title, meta) => html`<a class="list-row" href="${href}">${iconTile(icon)}<span class="lr-main"><span class="lr-title">${title}</span><span class="lr-meta">${meta}</span></span>${raw(BP.icon('chevron-right', 'chev'))}</a>`;

      // Level 1: subjects
      if (!subject) {
        return html`${BP.u.pageHead({ back: '#/user/home', backLabel: 'Home', crumbs: [section.title], title: card.title, sub: 'Choose a subject' })}
          ${subjects.length ? html`<div class="list">${subjects.map((s) => {
            const subs = st.subsections.filter((x) => x.subjectId === s.id);
            const n = BP.store.q.testsFor(card.id, { subjectId: s.id }).length;
            return row(base + '?subject=' + s.id, s.icon || 'book', s.title, (subs.length ? plural(subs.length, 'subsection') + ' · ' : '') + plural(n, 'test'));
          })}</div>` : BP.ui.emptyState({ icon: 'layers', title: 'No subjects yet', text: 'Subjects appear here once the admin adds them.' })}`;
      }

      const subs = st.subsections.filter((x) => x.subjectId === subject.id).sort(byOrder);
      const sub = subs.find((x) => x.id === ctx.query.sub);

      // Level 2: subsections (only when the subject has them)
      if (subs.length && !sub) {
        return html`${BP.u.pageHead({ back: base, backLabel: card.title, crumbs: [section.title, card.title], title: subject.title, sub: 'Choose a subsection' })}
          <div class="list">${subs.map((x) => row(base + '?subject=' + subject.id + '&sub=' + x.id, 'list', x.title,
            plural(BP.store.q.testsFor(card.id, { subjectId: subject.id, subsectionId: x.id }).length, 'test')))}</div>`;
      }

      // Level 3: tests
      const tests = BP.store.q.testsFor(card.id, sub ? { subjectId: subject.id, subsectionId: sub.id } : { subjectId: subject.id });
      const back = sub ? base + '?subject=' + subject.id : base;
      return html`${BP.u.pageHead({ back, backLabel: sub ? subject.title : card.title, crumbs: sub ? [card.title, subject.title] : [section.title, card.title], title: sub ? sub.title : subject.title })}
        ${tests.length ? html`<div class="list">${tests.map((t) => BP.u.testRow(t, ctx.user))}</div>`
          : BP.ui.emptyState({ icon: 'file-text', title: 'No tests here yet', text: 'New tests appear here as soon as they are approved.' })}`;
    },
  };
})();
