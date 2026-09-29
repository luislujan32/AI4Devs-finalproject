export type EvaluationOption = { id: string; label: string; score?: number };
export type EvaluationQuestion = { id: string; criterion: string; text: string; type: 'boolean' | 'single_choice' | 'text';
  scored: boolean; weight?: number; options: EvaluationOption[]; exclusion?: { acceptedOptionIds: string[] } };
export type EvaluationAnswer = { questionId: string; kind: 'option' | 'text' | 'unknown'; optionId?: string; text?: string };

export function evaluate(questions: EvaluationQuestion[], answers: EvaluationAnswer[], threshold: number, generatedAt = new Date()) {
  const byQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  let weightSum = 0; let weightedSum = 0; let missingForScore = false; let missingForExclusion = false; let knockout = false;
  const criteria = questions.map((question) => {
    const answer = byQuestion.get(question.id);
    const option = answer?.kind === 'option' ? question.options.find((item) => item.id === answer.optionId) : undefined;
    const known = !!option || answer?.kind === 'text';
    const evidence = { status: known ? 'known' as const : answer?.kind === 'unknown' ? 'unknown' as const : 'missing' as const,
      source: 'candidate_declaration' as const, answerText: option?.label ?? (answer?.kind === 'text' ? answer.text ?? null : null) };
    const optionScore = question.scored && option ? option.score ?? null : null;
    const weight = question.scored ? question.weight ?? null : null;
    const weightedPoints = optionScore !== null && weight !== null ? optionScore * weight : null;
    if (question.scored) {
      weightSum += question.weight ?? 0;
      if (weightedPoints === null) missingForScore = true;
      else weightedSum += weightedPoints;
    }
    const exclusionStatus = !question.exclusion ? 'not_applicable' as const : !option ? 'unknown' as const
      : question.exclusion.acceptedOptionIds.includes(option.id) ? 'met' as const : 'not_met' as const;
    if (exclusionStatus === 'unknown') missingForExclusion = true;
    if (exclusionStatus === 'not_met') knockout = true;
    return { questionId: question.id, criterion: question.criterion, question: question.text, evidence,
      optionScore, weight, weightedPoints, exclusionStatus };
  });
  const incomplete = missingForScore || missingForExclusion;
  const score = missingForScore || weightSum === 0 ? null : weightedSum / weightSum;
  const outcome = knockout ? 'not_meets' as const : incomplete ? 'needs_review' as const
    : weightedSum >= threshold * weightSum ? 'meets' as const : 'not_meets' as const;
  const reason = knockout ? 'knockout' as const : incomplete ? 'incomplete' as const
    : outcome === 'meets' ? 'criteria_met' as const : 'score_below_threshold' as const;
  return { algorithmVersion: 'v1' as const, outcome, reason, score, threshold, incomplete, criteria, generatedAt };
}
