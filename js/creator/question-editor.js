/* Bilingual question editor (English + Malayalam, 4 options, one correct) with a live EN/ML preview.
   Used inside a sheet by the test builder and inline by the current affairs form. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, raw, icon } = BP.ui;
  const L = BP.content.LETTERS;

  const blank = () => ({ en: { text: '', options: ['', '', '', ''], explanation: '' }, ml: { text: '', options: ['', '', '', ''], explanation: '' }, correctIndex: null });

  function form(q, p) {
    return html`<div class="qe">
      <div class="qe-form stack gap-5">
        <div class="field"><label class="field-label" for="${p}-en">Question in English</label>
          <textarea id="${p}-en" class="textarea" data-q="en.text" placeholder="Type the question in English">${q.en.text}</textarea></div>
        <div class="field"><label class="field-label" for="${p}-ml">Question in Malayalam</label>
          <textarea id="${p}-ml" class="textarea" lang="ml" data-q="ml.text" placeholder="ചോദ്യം മലയാളത്തിൽ" aria-describedby="${p}-ml-help">${q.ml.text}</textarea>
          <span class="field-help" id="${p}-ml-help">Type with any Malayalam keyboard, for example your phone's Malayalam keyboard.</span></div>
        <fieldset class="stack gap-3">
          <legend class="field-label">Options, and the correct answer</legend>
          ${[0, 1, 2, 3].map((i) => html`<div class="qe-opt ${q.correctIndex === i ? 'is-correct' : ''}">
            <label class="qe-correct" title="Mark ${L[i]} as the correct answer">
              <input type="radio" name="${p}-correct" value="${i}" ${q.correctIndex === i ? 'checked' : ''} aria-label="Option ${L[i]} is correct">
              <span>${L[i]}</span>
            </label>
            <div class="qe-opt-fields">
              <span class="qe-in"><span class="qe-lang">EN</span><input class="input" data-q="en.options.${i}" value="${q.en.options[i]}" placeholder="Option ${L[i]} in English" aria-label="Option ${L[i]} in English"></span>
              <span class="qe-in"><span class="qe-lang" lang="ml">മല</span><input class="input" lang="ml" data-q="ml.options.${i}" value="${q.ml.options[i]}" placeholder="ഓപ്ഷൻ ${L[i]} മലയാളത്തിൽ" aria-label="Option ${L[i]} in Malayalam"></span>
            </div>
          </div>`)}
          <p class="t-caption">Choose the letter of the correct option. Every question needs both languages, a correct answer, and an explanation in both languages before it can be submitted.</p>
        </fieldset>
        <fieldset class="form-grid">
          <legend class="field-label">Answer explanation</legend>
          <div class="field"><label class="field-label" for="${p}-ex-en">English explanation</label><textarea id="${p}-ex-en" class="textarea" data-q="en.explanation" placeholder="Explain why the correct option is right">${q.en.explanation || ''}</textarea></div>
          <div class="field"><label class="field-label" for="${p}-ex-ml">Malayalam explanation</label><textarea id="${p}-ex-ml" class="textarea" lang="ml" data-q="ml.explanation" placeholder="ശരിയുത്തരം എന്തുകൊണ്ടെന്ന് വിശദീകരിക്കുക">${q.ml.explanation || ''}</textarea></div>
          <p class="field-help">Both explanations are required. Users see the explanation after choosing an answer in Review.</p>
        </fieldset>
        <div id="${p}-issues" aria-live="polite"></div>
      </div>
      <aside class="qe-preview" aria-label="Live preview">
        <div class="row-between"><span class="t-label t-muted">Live preview</span>
          ${BP.ui.segmented([{ value: 'en', label: 'EN' }, { value: 'ml', label: raw('<span lang="ml">മല</span>') }], 'en', { act: 'qe-lang', label: 'Preview language', size: 'sm' })}</div>
        <div id="${p}-prev"></div>
      </aside>
    </div>`;
  }

  function preview(q, lang) {
    const l = lang === 'ml' ? raw(' lang="ml"') : '';
    const t = q[lang].text.trim();
    return html`<div class="ts-card ts-card--preview">
      <p class="ts-qtext"${l}>${t || html`<span class="t-muted">${lang === 'ml' ? 'Malayalam question will appear here' : 'English question will appear here'}</span>`}</p>
      <div class="opts">${q[lang].options.map((o, i) => html`<div class="opt ${q.correctIndex === i ? 'is-correct' : ''}"><span class="opt-key">${L[i]}</span><span class="opt-text"${l}>${o || html`<span class="t-muted">Option ${L[i]}</span>`}</span>${q.correctIndex === i ? html`<span class="opt-note">${icon('check-circle')}Correct answer</span>` : ''}</div>`)}</div>
      <p class="t-body-sm t-muted"${l}>${q[lang].explanation || 'Answer explanation will appear here.'}</p>
    </div>`;
  }

  /** Wire inputs inside `root` to question `q`. onChange(q) after every edit. */
  function bind(root, q, p, onChange) {
    let lang = 'en';
    const draw = () => {
      root.querySelector('#' + p + '-prev').innerHTML = String(preview(q, lang));
      const issues = BP.content.questionIssues(q);
      root.querySelector('#' + p + '-issues').innerHTML = String(issues.length
        ? html`<div class="notice notice--warning">${icon('alert-triangle')}<span><b>Still needed:</b> ${issues.join(', ')}.</span></div>`
        : html`<div class="notice notice--success">${icon('check-circle')}<span>Both languages, the correct answer and explanations are filled in.</span></div>`);
    };
    root.querySelectorAll('[data-q]').forEach((el) => el.addEventListener('input', () => {
      const path = el.dataset.q.split('.');
      if (path.length === 2) q[path[0]][path[1]] = el.value; else q[path[0]].options[Number(path[2])] = el.value;
      draw(); if (onChange) onChange(q);
    }));
    root.querySelectorAll('input[name="' + p + '-correct"]').forEach((el) => el.addEventListener('change', () => {
      q.correctIndex = Number(el.value);
      root.querySelectorAll('.qe-opt').forEach((o, i) => o.classList.toggle('is-correct', i === q.correctIndex));
      draw(); if (onChange) onChange(q);
    }));
    root.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-act="qe-lang"]');
      if (!seg) return;
      e.preventDefault(); e.stopPropagation();
      lang = seg.dataset.value;
      seg.parentElement.querySelectorAll('.seg').forEach((s) => s.setAttribute('aria-selected', String(s === seg)));
      draw();
    }, true);
    draw();
  }

  /** Open the editor in a sheet. onSave(question) is called with the edited copy. */
  function open(question, number, onSave) {
    const q = question ? BP.content.clone(question) : blank();
    BP.ui.sheet({
      title: (question ? 'Edit question ' : 'New question ') + number,
      size: 'xl',
      body: form(q, 'qe'),
      foot: html`<button type="button" class="btn btn--secondary" data-act="close">Cancel</button><button type="button" class="btn btn--primary" data-act="save-q">${icon('check')}Save question</button>`,
      onMount(el) { bind(el, q, 'qe'); },
      actions: {
        'save-q'(el, e, api) {
          api.close();
          onSave(q);
        },
      },
    });
  }

  BP.qeditor = { blank, form, preview, bind, open };
})();
