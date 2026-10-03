import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type Session } from './api';

type Decision = 'continue' | 'do_not_continue' | 'clarify';
type Review = { decision: Decision; reason: string; reviewedAt: string; revision: number };
type Criterion = { questionId: string; criterion: string; question: string;
  evidence: { status: 'known' | 'unknown' | 'missing'; answerText: string | null };
  optionScore: number | null; weight: number | null; weightedPoints: number | null;
  exclusionStatus: 'met' | 'not_met' | 'unknown' | 'not_applicable' };
type Report = { outcome: 'meets' | 'not_meets' | 'needs_review'; reason: string; score: number | null;
  threshold: number; incomplete: boolean; generatedAt: string; criteria: Criterion[] };
type Envelope = { invitationId: string; screeningId: string; report: Report; review: Review | null };

const outcomes = { meets: 'Cumple los criterios', not_meets: 'No cumple los criterios', needs_review: 'Requiere revisión' };
const reasons: Record<string, string> = { knockout: 'No cumple un requisito excluyente', score_below_threshold: 'Puntaje inferior al umbral',
  incomplete: 'Hay respuestas que faltan o no se pueden confirmar', criteria_met: 'Cumple los criterios configurados' };
const decisions: Record<Decision, string> = { continue: 'Continuar', do_not_continue: 'No continuar', clarify: 'Solicitar aclaración' };

export function RecruiterReport({ invitationId, candidate, session, onExpired, onClose }: {
  invitationId: string; candidate: string; session: Session; onExpired: () => void; onClose: () => void }) {
  const [data, setData] = useState<Envelope | null>(null);
  const [decision, setDecision] = useState<Decision | ''>('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError(''); setNotice('');
    api<Envelope>(`/invitations/${invitationId}/report`, session).then((result) => {
      if (active) { setData(result); setDecision(result.review?.decision ?? ''); setReason(result.review?.reason ?? ''); }
    }).catch((problem: unknown) => {
      if (!active) return;
      if (problem instanceof ApiError && problem.status === 401) onExpired();
      else setError(problem instanceof Error ? problem.message : 'No pudimos cargar el informe.');
    });
    return () => { active = false; };
  }, [invitationId, session, onExpired, reload]);

  async function save(event: FormEvent) {
    event.preventDefault(); if (!data || !decision) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api<{ review: Review }>(`/invitations/${invitationId}/review`, session, 'PUT',
        { expectedRevision: data.review?.revision ?? 0, decision, reason });
      setData({ ...data, review: result.review }); setNotice('Revisión humana guardada.');
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 401) onExpired();
      else setError(problem instanceof Error ? problem.message : 'No pudimos guardar la revisión.');
    } finally { setBusy(false); }
  }

  return <section className="stage-panel recruiter-report" aria-labelledby="report-title">
    <div className="panel-heading"><div><p className="eyebrow">Respuestas recibidas</p><h3 id="report-title">Informe de {candidate}</h3></div>
      <button className="outline-button" type="button" onClick={onClose}>← Volver a postulantes</button></div>
    {error && <div className="inline-error" role="alert"><p>{error}</p><button className="outline-button" type="button" onClick={() => setReload((value) => value + 1)}>Reintentar</button></div>}
    {!data ? !error && <p role="status">Cargando informe…</p> : <>
      <p className="report-note">Este resultado aplica las reglas configuradas para el puesto. La decisión sobre la postulación corresponde a una persona.</p>
      <div className="report-summary"><div><span className="field-caption">Resultado de criterios</span><strong>{outcomes[data.report.outcome]}</strong>
        <span>{reasons[data.report.reason] ?? data.report.reason}</span></div>
        <div><span className="field-caption">Puntaje</span><strong>{data.report.score === null ? 'Sin calcular' : `${data.report.score.toLocaleString('es-AR', { maximumFractionDigits: 1 })} / 100`}</strong>
          <span>Umbral: {data.report.threshold} / 100</span></div></div>
      <h4>Respuestas y criterios</h4>
      <ol className="report-criteria">{data.report.criteria.map((item) => <li key={item.questionId}>
        <strong>{item.criterion}</strong><p>{item.question}</p>
        <div className="report-answer"><span className="field-caption">Respuesta</span><span>{item.evidence.status === 'known' ? item.evidence.answerText :
          item.evidence.status === 'unknown' ? 'No puede confirmarlo' : 'Sin respuesta'}</span></div>
        {(item.optionScore !== null || item.exclusionStatus !== 'not_applicable') && <p className="report-rule">
          {item.optionScore !== null ? `Valor: ${item.optionScore} / 100 · Peso: ${item.weight}` : 'Sin puntaje'}
          {item.exclusionStatus !== 'not_applicable' ? ` · Excluyente: ${item.exclusionStatus === 'met' ? 'cumplido' : item.exclusionStatus === 'not_met' ? 'no cumplido' : 'sin confirmar'}` : ''}
        </p>}
      </li>)}</ol>
      <form className="human-review" onSubmit={(event) => void save(event)}>
        <h4>Revisión humana</h4><p>Registrá tu decisión después de leer las respuestas. Podés actualizarla; se conserva la última revisión.</p>
        {data.review && <p className="review-current">Última revisión: {decisions[data.review.decision]} · {new Date(data.review.reviewedAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
        <div className="field"><label htmlFor={`decision-${invitationId}`}>Decisión</label><select id={`decision-${invitationId}`}
          value={decision} required onChange={(event) => setDecision(event.target.value as Decision)}>
          <option value="">Elegí una decisión</option>{Object.entries(decisions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="field"><label htmlFor={`reason-${invitationId}`}>Motivo {decision === 'continue' && data.report.outcome !== 'meets' ? '(obligatorio)' : '(opcional)'}</label>
          <textarea id={`reason-${invitationId}`} rows={3} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)}
            required={decision === 'continue' && data.report.outcome !== 'meets'} placeholder="Dejá constancia de los factores que consideraste" /></div>
        <button type="submit" disabled={busy || !decision}>{busy ? 'Guardando…' : 'Guardar revisión'}</button>
        {notice && <p className="success" role="status">{notice}</p>}
      </form>
    </>}
  </section>;
}
