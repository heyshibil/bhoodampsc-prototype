/* Shared topic bank (sample). Admin manages it; creators tag each question with one topic when the
   card has "Topic-wise analysis" on. Topics are grouped by subject. The same topic is reused across
   tests and cards, so results can later add up per topic (weak-area analysis).
   POOL_TOPICS maps the sample question pools (js/data/questions.js, by index) to topics. */
(function () {
  const BP = (window.BP = window.BP || {});

  const groups = [
    { id: 'tg_gs', title: 'General Studies', order: 1 },
    { id: 'tg_quant', title: 'Quantitative Aptitude', order: 2 },
    { id: 'tg_reason', title: 'Mental Ability', order: 3 },
    { id: 'tg_mal', title: 'Malayalam', order: 4 },
    { id: 'tg_eng', title: 'English', order: 5 },
  ];

  const T = (id, groupId, order, title) => ({ id, groupId, order, title, status: 'active' });
  const topics = [
    T('tp_kerala_symbols', 'tg_gs', 1, 'Kerala state symbols'),
    T('tp_kerala_culture', 'tg_gs', 2, 'Kerala culture and literature'),
    T('tp_kerala_gov', 'tg_gs', 3, 'Kerala history and governance'),
    T('tp_kerala_dev', 'tg_gs', 4, 'Kerala development projects'),
    T('tp_institutions', 'tg_gs', 5, 'National and international bodies'),
    T('tp_kerala_geo', 'tg_gs', 6, 'Kerala geography'),
    T('tp_renaissance', 'tg_gs', 7, 'Kerala renaissance'),
    T('tp_freedom', 'tg_gs', 8, 'Freedom movement'),
    T('tp_constitution', 'tg_gs', 9, 'Indian Constitution'),
    T('tp_science', 'tg_gs', 10, 'General science'),
    T('tp_gk', 'tg_gs', 11, 'General knowledge'),

    T('tp_percentage', 'tg_quant', 1, 'Percentage and discount'),
    T('tp_speed', 'tg_quant', 2, 'Average, speed and distance'),
    T('tp_lcm_hcf', 'tg_quant', 3, 'LCM and HCF'),
    T('tp_numbers', 'tg_quant', 4, 'Numbers and fractions'),
    T('tp_ratio_work', 'tg_quant', 5, 'Ratio, proportion and work'),
    T('tp_interest', 'tg_quant', 6, 'Simple interest'),
    T('tp_mensuration', 'tg_quant', 7, 'Geometry and mensuration'),

    T('tp_series', 'tg_reason', 1, 'Number and letter series'),
    T('tp_analogy', 'tg_reason', 2, 'Analogy and classification'),
    T('tp_coding', 'tg_reason', 3, 'Coding and decoding'),
    T('tp_ranking', 'tg_reason', 4, 'Ranking and order'),
    T('tp_direction', 'tg_reason', 5, 'Direction and calendar'),
    T('tp_logic', 'tg_reason', 6, 'Logical statements'),
    T('tp_relations', 'tg_reason', 7, 'Blood relations'),

    T('tp_ml_vocab', 'tg_mal', 1, 'Malayalam vocabulary'),
    T('tp_ml_grammar', 'tg_mal', 2, 'Malayalam grammar'),
    T('tp_ml_forms', 'tg_mal', 3, 'Malayalam word forms'),
    T('tp_ml_spelling', 'tg_mal', 4, 'Malayalam spelling and punctuation'),

    T('tp_en_vocab', 'tg_eng', 1, 'English vocabulary'),
    T('tp_en_grammar', 'tg_eng', 2, 'English grammar'),
    T('tp_en_forms', 'tg_eng', 3, 'Parts of speech'),
    T('tp_en_spelling', 'tg_eng', 4, 'English spelling and punctuation'),
    T('tp_en_transform', 'tg_eng', 5, 'Voice, speech and question tags'),
  ];

  /* Sample pools → topic per question index. A string means one topic for the whole pool. */
  const by = (map) => { const out = []; Object.keys(map).forEach((t) => map[t].forEach((i) => { out[i] = t; })); return out; };
  const POOL_TOPICS = {
    ca: by({ tp_kerala_symbols: [0, 1, 2, 3, 4], tp_kerala_culture: [5, 9, 10, 11, 12, 13], tp_kerala_gov: [6, 14, 15], tp_kerala_dev: [7, 8], tp_institutions: [16, 17, 18, 19] }),
    mat: by({ tp_percentage: [0, 12, 15], tp_speed: [1, 6, 13], tp_lcm_hcf: [2, 7], tp_numbers: [3, 8, 11, 16], tp_ratio_work: [4, 17, 18], tp_interest: [5], tp_series: [9], tp_mensuration: [10, 14, 19] }),
    reason: by({ tp_series: [0, 1, 2, 9, 12, 17], tp_analogy: [3, 4, 10, 14, 19], tp_coding: [5, 15], tp_ranking: [6, 11, 18], tp_direction: [7, 8], tp_logic: [13], tp_relations: [16] }),
    mal: by({ tp_ml_vocab: [1, 2, 6, 9, 12, 13, 16, 18], tp_ml_grammar: [3, 7, 11, 15, 19], tp_ml_forms: [0, 5, 8, 17], tp_ml_spelling: [4, 10, 14] }),
    eng: by({ tp_en_vocab: [1, 2, 8, 19], tp_en_grammar: [3, 4, 5, 6, 9, 14, 15], tp_en_forms: [0, 12, 16], tp_en_spelling: [7, 13, 17], tp_en_transform: [10, 11, 18] }),
    geo: 'tp_kerala_geo', ref: 'tp_renaissance', fre: 'tp_freedom', con: 'tp_constitution', sci: 'tp_science', gk: 'tp_gk',
  };

  /** Topic id for a sample question (pool + index in that pool), or null. */
  function topicFor(pool, index) {
    const m = POOL_TOPICS[pool];
    if (!m) return null;
    return typeof m === 'string' ? m : (m[index] || null);
  }

  BP.TOPIC_BANK = { groups, topics, topicFor };
})();
