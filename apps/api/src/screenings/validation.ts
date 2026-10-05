import { UnprocessableEntityException } from '@nestjs/common';

export type DraftOption = { id: string; label: string; score?: number };
export type DraftQuestion = { id: string; bankQuestionId?: string; criterion?: string; text?: string;
  type: 'boolean' | 'single_choice' | 'text'; required: boolean; scored: boolean; weight?: number;
  options: DraftOption[]; guidance?: string; exclusion?: { acceptedOptionIds: string[] } };
export type DraftInput = { title?: string; area?: string; description?: string; threshold?: number; questions: DraftQuestion[] };
export function invalid(message = 'Datos de configuración inválidos.'): never { throw new UnprocessableEntityException(message); }
export function object(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) invalid();
  return value as Record<string, unknown>;
}
function string(value: unknown, max: number, empty = true): string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) invalid();
  return value.trim();
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) invalid('Identificador de pregunta/opción inválido.');
  return value;
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) invalid();
  return value;
}
export function expectedRevision(value: unknown): number { return integer(value, 0, Number.MAX_SAFE_INTEGER - 1); }
function flag(value: unknown): boolean { if (value === undefined) return false; if (typeof value !== 'boolean') invalid(); return value; }
function unique(ids: string[]) { if (new Set(ids).size !== ids.length) invalid('Los identificadores no pueden repetirse.'); }
function parseQuestion(value: unknown): DraftQuestion {
  const q = object(value, ['id', 'bankQuestionId', 'criterion', 'text', 'type', 'required', 'scored', 'weight', 'options', 'guidance', 'exclusion']);
  if (typeof q.type !== 'string' || !['boolean', 'single_choice', 'text'].includes(q.type)) invalid();
  const options = q.options ?? [];
  if (!Array.isArray(options) || options.length > 8) invalid();
  const parsed: DraftQuestion = { id: id(q.id), type: q.type as DraftQuestion['type'], required: flag(q.required), scored: flag(q.scored),
    options: options.map((entry) => { const option = object(entry, ['id', 'label', 'score']); return {
      id: id(option.id), label: string(option.label, 300), ...(option.score === undefined ? {} : { score: integer(option.score, 0, 100) }),
    }; }) };
  unique(parsed.options.map((option) => option.id));
  if (q.criterion !== undefined) parsed.criterion = string(q.criterion, 120);
  if (q.text !== undefined) parsed.text = string(q.text, 500);
  if (q.guidance !== undefined) parsed.guidance = string(q.guidance, 2000);
  if (q.weight !== undefined) parsed.weight = integer(q.weight, 1, 5);
  if (q.bankQuestionId !== undefined) {
    if (typeof q.bankQuestionId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(q.bankQuestionId)) invalid();
    parsed.bankQuestionId = q.bankQuestionId.toLowerCase();
  }
  if (q.exclusion !== undefined) {
    const exclusion = object(q.exclusion, ['acceptedOptionIds']);
    if (!Array.isArray(exclusion.acceptedOptionIds) || exclusion.acceptedOptionIds.length > 8) invalid();
    const acceptedOptionIds = exclusion.acceptedOptionIds.map(id); unique(acceptedOptionIds);
    parsed.exclusion = { acceptedOptionIds };
  }
  return parsed;
}
export function parseDraft(value: unknown, updating = false): DraftInput & { expectedRevision?: number } {
  const input = object(value, ['title', 'area', 'description', 'threshold', 'questions', ...(updating ? ['expectedRevision'] : [])]);
  const questions = input.questions ?? [];
  if (!Array.isArray(questions) || questions.length > 20) invalid('Se admiten hasta veinte preguntas.');
  const parsed: DraftInput & { expectedRevision?: number } = { questions: questions.map(parseQuestion) };
  unique(parsed.questions.map((q) => q.id));
  for (const [key, max] of [['title', 120], ['area', 120], ['description', 6000]] as const) {
    if (input[key] !== undefined) { const text = string(input[key], max); if (text) parsed[key] = text; }
  }
  if (input.threshold !== undefined) parsed.threshold = integer(input.threshold, 0, 100);
  if (updating) parsed.expectedRevision = expectedRevision(input.expectedRevision);
  return parsed;
}
export function publicationIssues(draft: DraftInput): string[] {
  const issues: string[] = [];
  if (!draft.title?.trim()) issues.push('Indicá el título del screening.');
  if (!draft.area?.trim()) issues.push('Indicá el área del puesto.');
  if (!Number.isInteger(draft.threshold) || draft.threshold! < 0 || draft.threshold! > 100) issues.push('Definí un umbral entero de 0 a 100.');
  if (!draft.questions.length || draft.questions.length > 20) issues.push('Incluí de una a veinte preguntas.');
  if (!draft.questions.some((q) => q.scored)) issues.push('Incluí al menos una pregunta puntuable.');
  draft.questions.forEach((q, index) => {
    const prefix = `Pregunta ${index + 1}: `;
    if (!q.text?.trim() || !q.criterion?.trim()) issues.push(prefix + 'completá pregunta y criterio.');
    if (q.type === 'text') {
      if (q.scored || q.exclusion || q.weight !== undefined || q.options.length) issues.push(prefix + 'el texto libre solo aporta evidencia, sin opciones, puntaje, peso ni excluyente.');
    } else {
      if (q.options.length < 2 || q.options.length > 8 || (q.type === 'boolean' && q.options.length !== 2)) issues.push(prefix + 'revisá la cantidad de opciones (sí/no: dos; opción única: dos a ocho).');
      if (q.options.some((o) => !o.label.trim() || o.label.trim().toLocaleLowerCase('es') === 'no puedo confirmarlo')) issues.push(prefix + '«No puedo confirmarlo» es una respuesta desconocida reservada, no una opción puntuable.');
      if (q.scored && (!Number.isInteger(q.weight) || q.weight! < 1 || q.weight! > 5 || q.options.some((o) => !Number.isInteger(o.score) || o.score! < 0 || o.score! > 100))) issues.push(prefix + 'completá peso entero de 1 a 5 y todos los valores enteros de 0 a 100.');
      if (!q.scored && (q.weight !== undefined || q.options.some((o) => o.score !== undefined))) issues.push(prefix + 'eliminá puntajes/peso de la pregunta no puntuable.');
      if (q.exclusion) {
        const accepted = q.exclusion.acceptedOptionIds;
        if (!accepted.length || accepted.length >= q.options.length || accepted.some((id) => !q.options.some((o) => o.id === id))) issues.push(prefix + 'un excluyente requiere opciones existentes, al menos una aceptada y otra no aceptada.');
      }
    }
  });
  const scored = draft.questions.filter((q) => q.scored && q.weight && q.options.length && q.options.every((o) => o.score !== undefined));
  if (scored.length && scored.length === draft.questions.filter((q) => q.scored).length && Number.isInteger(draft.threshold)) {
    const totalWeight = scored.reduce((total, q) => total + q.weight!, 0);
    const maximum = scored.reduce((total, q) => total + Math.max(...q.options.map((o) => o.score!)) * q.weight!, 0) / totalWeight;
    if (maximum < draft.threshold!) issues.push(`El umbral de ${draft.threshold} no se puede alcanzar: el máximo posible con estos valores es ${Number(maximum.toFixed(1))}. Ajustá el umbral o los valores de las respuestas.`);
  }
  return issues;
}
