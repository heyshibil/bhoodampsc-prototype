/* Scoring: one pure function used by the test engine and the seed (past attempts). */
(function () {
  const BP = (window.BP = window.BP || {});
  const round2 = (n) => Math.round(n * 100) / 100;

  /** snapshot: { marksPerQuestion, negativeMarking, negativeValue, questions[] }; answers: { questionId: optionIndex } */
  function score(snapshot, answers) {
    let correct = 0, wrong = 0, skipped = 0;
    snapshot.questions.forEach((q) => {
      const a = answers[q.id];
      if (a == null) skipped++;
      else if (a === q.correctIndex) correct++;
      else wrong++;
    });
    const m = snapshot.marksPerQuestion;
    const deducted = snapshot.negativeMarking ? round2(wrong * snapshot.negativeValue) : 0;
    return {
      correct, wrong, skipped,
      max: round2(snapshot.questions.length * m),
      gained: round2(correct * m),
      deducted,
      score: round2(correct * m - deducted),
    };
  }

  /** Display helper: 0.3333 -> "0.33", 1 -> "1" */
  function fmt(n) { return String(round2(n)); }

  BP.scoring = { score, fmt, round2 };
})();
