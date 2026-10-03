import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type Session } from './api';

type Decision = 'continue' | 'do_not_continue' | 'clarify';
type NewDecision = Exclude<Decision, 'clarify'>;
type Review = { decision: Decision; reason: string; reviewedAt: string; revision: number };
type Criterion = { questionId: string; criterion: string; question: string;
  evidence: { status: 'known' | 'unknown' | 'missing'; answerText: string | null };
  optionScore: number | null; weight: number | null; weightedPoints: number | null;
  exclusionStatus: 'met' | 'not_met' | 'unknown' | 'not_applicable' };
type Report = { outcome: 'meets' | 'not_meets' | 'needs_review'; reason: string; score: number | null;
  threshold: number; incomplete: boolean; generatedAt: string; criteria: Criterion[] };
type Envelope = { invitationId: string; screeningId: string; report: Report; review: Review | null };

const outcomes = { meets: 'Cumple los criterios', not_meets: 'No cumple los criterios', needs_review: 'Requiere revisión' };
const reasons: Record<string, string> = { knockout: 'Hay un requisito excluyente incumplido', score_below_threshold: 'El puntaje global quedó por debajo del umbral',
  incomplete: 'Falta información para evaluar todos los criterios', criteria_met: 'Se cumplen las reglas configuradas' };
const decisions: Record<Decision, string> = { continue: 'Continuar', do_not_continue: 'No continuar',
  clarify: 'Aclaración pendiente (registro anterior)' };
const date = (value: string) => new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

function attentionFor(item: Criterion) {
  if (item.exclusionStatus === 'not_met') return 'Requisito excluyente incumplido';
  if (item.exclusionStatus === 'unknown') return 'Requisito excluyente sin confirmar';
  if (item.weight !== null && item.optionScore === null) return 'Falta un valor para calcular el puntaje';
  return null;
}

export function RecruiterReport({ invitationId, candidate, session, onExpired, onClose, onReviewSaved }: {
  invitationId: string; candidate: string; session: Session; onExpired: () => void; onClose: () => void;
  onReviewSaved: (review: Review) => void }) {
  const [data, setData] = useState<Envelope | null>(null);
  const [decision, setDecision] = useState<NewDecision | ''>('');
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError(''); setNotice(''); setEditing(false);
    api<Envelope>(`/invitations/${invitationId}/report`, session).then((result) => {
      if (active) { setData(result); setDecision(result.review?.decision === 'clarify' ? '' : result.review?.decision ?? '');
        setReason(result.review?.reason ?? ''); }
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
      setData({ ...data, review: result.review }); setEditing(false);
      setNotice(`Decisión registrada: ${decisions[result.review.decision]}.`);
      onReviewSaved(result.review);
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 401) onExpired();
      else setError(problem instanceof Error ? problem.message : 'No pudimos registrar la decisión.');
    } finally { setBusy(false); }
  }

  const report = data?.report;
  const attention = report?.criteria.filter((item) => attentionFor(item)) ?? [];
  const scored = report?.criteria.filter((item) => item.optionScore !== null && item.optionScore < 100) ?? [];
  const lowest = report?.reason === 'score_below_threshold'
    ? [...scored].sort((a, b) => (a.optionScore ?? 0) - (b.optionScore ?? 0)).slice(0, 3) : [];

  return <section className="stage-panel recruiter-report" aria-labelledby="report-title">
    <div className="panel-heading"><div><p className="eyebrow">Respuestas recibidas</p><h3 id="report-title">Informe de {candidate}</h3></div>
      <button className="outline-button" type="button" onClick={onClose}>← Volver a postulantes</button></div>
    {error && <div className="inline-error" role="alert"><p>{error}</p>{!data && <button className="outline-button" type="button"
      onClick={() => setReload((value) => value + 1)}>Reintentar</button>}</div>}
    {!data ? !error && <p role="status">Cargando informe…</p> : <>
      <p className="report-note">El resultado aplica las reglas del screening. Tu decisión queda registrada por separado y puede ser distinta.</p>
      <div className="report-summary"><div className={`report-outcome outcome-${data.report.outcome}`}>
        <span className="field-caption">Resultado de criterios</span><strong>{outcomes[data.report.outcome]}</strong>
        <span>{reasons[data.report.reason] ?? data.report.reason}</span></div>
        <div><span className="field-caption">Puntaje global</span><strong>{data.report.score === null ? 'Cálculo pendiente' : `${data.report.score.toLocaleString('es-AR', { maximumFractionDigits: 1 })} / 100`}</strong>
          <span>Umbral configurado: {data.report.threshold} / 100</span></div></div>

      <section className="review-overview" aria-labelledby="human-review-title">
        <div className="review-overview-heading"><div><h4 id="human-review-title">Decisión humana</h4>
          <p>Es un registro interno: no cambia una etapa externa ni envía mensajes al postulante.</p></div>
          {data.review && !editing && <button className="outline-button" type="button" onClick={() => {
            setDecision(data.review?.decision === 'clarify' ? '' : data.review?.decision ?? '');
            setReason(data.review?.reason ?? ''); setError(''); setNotice(''); setEditing(true);
          }}>Cambiar decisión</button>}</div>
        {notice && <p className="review-feedback" role="status">{notice} Podés cambiarla desde acá.</p>}
        {data.review && <div className={`review-record decision-${data.review.decision}`}>
          <span className="field-caption">Decisión registrada</span><strong>{decisions[data.review.decision]}</strong>
          {data.review.reason && <p><span className="field-caption">Motivo: </span>{data.review.reason}</p>}
          <small>Actualizada el {date(data.review.reviewedAt)}</small>
          {data.review.decision === 'clarify' && <p>Esta opción anterior solo guardó un pendiente interno. No se envió ninguna solicitud.</p>}
          {data.review.decision === 'continue' && data.report.outcome !== 'meets' &&
            <p>La decisión de continuar prevalece para este registro; el resultado de criterios permanece visible.</p>}
        </div>}
        {!data.review && !editing && <div className="review-pending"><strong>Sin decisión registrada</strong>
          <p>Revisá las respuestas y los criterios antes de decidir.</p>
          <button type="button" onClick={() => setEditing(true)}>Registrar decisión</button></div>}
        {editing && <form className="human-review" onSubmit={(event) => void save(event)}>
          <div className="field"><label htmlFor={`decision-${invitationId}`}>Decisión interna</label>
            <select id={`decision-${invitationId}`} value={decision} required onChange={(event) => setDecision(event.target.value as NewDecision)}>
              <option value="">Elegí una decisión</option><option value="continue">Continuar</option>
              <option value="do_not_continue">No continuar</option></select></div>
          <div className="field"><label htmlFor={`reason-${invitationId}`}>Motivo {decision === 'continue' && data.report.outcome !== 'meets' ? '(obligatorio)' : '(opcional)'}</label>
            <textarea id={`reason-${invitationId}`} rows={3} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)}
              required={decision === 'continue' && data.report.outcome !== 'meets'} placeholder="Qué factores consideraste para esta decisión" /></div>
          {decision === 'continue' && data.report.outcome !== 'meets' && <p className="review-warning">Explicá por qué continuarías aunque el resultado no cumpla o esté pendiente.</p>}
          <div className="review-actions"><button type="submit" disabled={busy || !decision}>{busy ? 'Registrando…' : data.review ? 'Guardar cambio' : 'Registrar decisión'}</button>
            <button className="outline-button" type="button" disabled={busy} onClick={() => { setEditing(false); setDecision(data.review?.decision === 'clarify' ? '' : data.review?.decision ?? '');
              setReason(data.review?.reason ?? ''); setError(''); }}>Cancelar</button></div>
        </form>}
      </section>

      {(attention.length > 0 || lowest.length > 0) && <section className="report-attention" aria-labelledby="attention-title">
        <h4 id="attention-title">Qué explica el resultado</h4>
        {attention.length > 0 && <ul>{attention.map((item) => <li key={item.questionId}>
          <strong>{item.criterion}</strong><span>{attentionFor(item)}</span></li>)}</ul>}
        {lowest.length > 0 && <><p>Respuestas con valor menor a 100 que contribuyen al promedio. El umbral se aplica al total, no a cada pregunta.</p>
          <ul>{lowest.map((item) => <li key={item.questionId}><strong>{item.criterion}</strong>
            <span>Valor de respuesta: {item.optionScore} / 100 · Peso: {item.weight}</span></li>)}</ul></>}
      </section>}
      <h4>Respuestas y criterios</h4>
      <p className="report-explainer">El valor de una respuesta puntuada y su peso forman el promedio global. Una pregunta informativa no suma puntos.</p>
      <ol className="report-criteria">{data.report.criteria.map((item) => <li key={item.questionId}
        className={item.exclusionStatus === 'not_met' ? 'criterion-alert' : item.exclusionStatus === 'unknown' || item.weight !== null && item.optionScore === null ? 'criterion-pending' : ''}>
        <div className="criterion-heading"><strong>{item.criterion}</strong>{attentionFor(item) && <span className="criterion-status">{attentionFor(item)}</span>}</div>
        <p>{item.question}</p>
        <div className="report-answer"><span className="field-caption">Respuesta</span><span>{item.evidence.status === 'known' ? item.evidence.answerText :
          item.evidence.status === 'unknown' ? 'No puede confirmarlo' : 'Sin respuesta'}</span></div>
        {item.weight !== null ? <div className="criterion-score"><span>Valor asignado a esta respuesta: <strong>{item.optionScore === null ? 'Sin calcular' : `${item.optionScore} / 100`}</strong></span>
          <span>Peso: {item.weight} de 5</span>{item.optionScore !== null && <div className="criterion-meter" aria-hidden="true"><span style={{ width: `${item.optionScore}%` }} /></div>}</div>
          : <p className="criterion-informative">Pregunta informativa · sin puntaje</p>}
        {item.exclusionStatus === 'met' && <p className="criterion-exclusion">Requisito excluyente cumplido</p>}
      </li>)}</ol>
    </>}
  </section>;
}
