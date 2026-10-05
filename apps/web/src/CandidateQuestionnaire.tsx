import { useEffect, useMemo, useState } from 'react';

export type CandidateSession = { csrfToken: string; expiresAt: string; publicId: string;
  invitation: { status: string; candidateName: string | null; expiresAt: string } };
type Question = { id: string; text: string; type: 'boolean' | 'single_choice' | 'text'; required: boolean;
  options: { id: string; label: string }[] };
type Answer = { questionId: string; kind: 'option' | 'text' | 'unknown'; optionId?: string; text?: string };
type Attempt = { title: string; description: string; status: 'invited' | 'in_progress' | 'submitted'; answerRevision: number;
  submittedAt: string | null; questions: Question[]; answers: Answer[] };

const same = (a: Answer[], b: Answer[]) => JSON.stringify(a) === JSON.stringify(b);
function errorMessage(status: number, fallback: string) {
  if (status === 401) return 'Tu acceso venció. Volvé a verificar el correo desde la invitación.';
  if (status === 409) return 'Las respuestas cambiaron en otra pestaña. Tu edición sigue acá; revisala antes de recargar.';
  if (status === 422) return 'Revisá las respuestas. Alguna no corresponde a la pregunta o falta una obligatoria.';
  return fallback;
}
export function CandidateQuestionnaire({ session, onLogout }: { session: CandidateSession; onLogout: () => Promise<void> }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [index, setIndex] = useState(0);
  const [review, setReview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadRequested, setReloadRequested] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const dirty = !!attempt && !same(answers, attempt.answers);
  const question = attempt?.questions[index];
  const current = question ? answers.find((item) => item.questionId === question.id) : undefined;
  const requiredMissing = useMemo(() => attempt?.questions.filter((item) => item.required && !answers.some((answer) => answer.questionId === item.id)) ?? [], [attempt, answers]);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setLoading(true); setError('');
    fetch('/api/candidate/attempt', { signal: controller.signal, cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error(errorMessage(response.status, 'No pudimos cargar el cuestionario. Volvé a intentar.'));
      return response.json() as Promise<Attempt>;
    }).then((data) => { if (active) { setAttempt(data); setAnswers(data.answers); setReview(false); setIndex(0);
      setConfirmed(false); setReloadRequested(false); } }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'No pudimos conectar.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [refresh]);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  useEffect(() => {
    if (!loading && attempt?.status !== 'submitted') document.getElementById(review ? 'review-title' : 'question-title')?.focus();
  }, [index, review, loading, attempt?.status]);
  function setAnswer(answer?: Answer) {
    if (!question || attempt?.status === 'submitted' || busy) return;
    setAnswers((prior) => {
      const next = prior.filter((item) => item.questionId !== question.id);
      if (answer) next.push(answer);
      return attempt!.questions.flatMap((item) => next.filter((entry) => entry.questionId === item.id));
    });
    setNotice(''); setConfirmed(false);
  }
  async function persistDraft(current: Attempt, currentAnswers: Answer[]) {
      const response = await fetch('/api/candidate/attempt/answers', { method: 'PUT', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
        body: JSON.stringify({ expectedRevision: current.answerRevision, answers: currentAnswers }) });
      if (!response.ok) throw new Error(errorMessage(response.status, 'No pudimos guardar. Tus cambios siguen visibles.'));
      const data = await response.json() as { status: Attempt['status']; answerRevision: number; answers: Answer[] };
      setAttempt((prior) => prior ? { ...prior, status: data.status, answerRevision: data.answerRevision, answers: data.answers } : prior);
      setAnswers(data.answers); setNotice('Respuestas guardadas.');
      return data.answerRevision;
  }
  async function save() {
    if (!attempt || !dirty) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await persistDraft(attempt, answers);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos conectar.'); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!attempt || requiredMissing.length || !confirmed) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const revision = dirty ? await persistDraft(attempt, answers) : attempt.answerRevision;
      const response = await fetch('/api/candidate/attempt/submit', { method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
        body: JSON.stringify({ expectedRevision: revision }) });
      if (!response.ok) throw new Error(errorMessage(response.status, 'No pudimos enviar. Tus respuestas siguen guardadas.'));
      const receipt = await response.json() as { status: 'submitted'; submittedAt: string };
      setAttempt((prior) => prior ? { ...prior, status: receipt.status, submittedAt: receipt.submittedAt } : prior);
      setNotice('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos conectar.'); }
    finally { setBusy(false); }
  }
  async function exit() {
    setBusy(true); setError('');
    try { await onLogout(); }
    catch { setError('No pudimos cerrar el acceso. Volvé a intentar.'); }
    finally { setBusy(false); }
  }
  return <main className="shell questionnaire-shell"><header><a className="brand" href="/" aria-label="Screeningroom, inicio"><span className="brand-mark">S</span>screeningroom</a>
    <button className="logout" disabled={busy} onClick={() => dirty ? setConfirmLogout(true) : void exit()}>Cerrar acceso</button></header>
    <section className="questionnaire" aria-labelledby="attempt-title">
      <p className="eyebrow">Tu postulación</p><h1 id="attempt-title">{attempt?.title || 'Tus respuestas'}</h1>
      {attempt?.description && <p className="description">{attempt.description}</p>}
      {loading ? <p role="status">Cargando tu cuestionario…</p> : !attempt ? <button className="outline-button" onClick={() => setRefresh((value) => value + 1)}>Reintentar carga</button>
        : attempt.status === 'submitted' ? <section className="stage-panel candidate-confirmation" aria-labelledby="sent-title">
          <p className="eyebrow">Completado</p><h2 id="sent-title">Respuestas enviadas</h2>
          <p>Recibimos tu cuestionario el {new Date(attempt.submittedAt!).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}. Ya no se puede editar.</p>
          <p className="field-hint">El recruiter revisará tus respuestas. Esta pantalla no muestra una evaluación ni una decisión automática.</p>
        </section> : <>
          <div className="candidate-progress"><span>{review ? 'Revisión final' : `Pregunta ${index + 1} de ${attempt.questions.length}`}</span>
            <span>{answers.length} de {attempt.questions.length} con respuesta</span></div>
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={attempt.questions.length + 1}
            aria-valuenow={review ? attempt.questions.length + 1 : index + 1} aria-label="Progreso del cuestionario">
            <span style={{ width: `${(review ? attempt.questions.length + 1 : index + 1) / (attempt.questions.length + 1) * 100}%` }} /></div>
          <p className="candidate-save-state" role="status">{busy ? 'Procesando…' : dirty ? 'Cambios sin guardar' : 'Respuestas guardadas en el servidor'}</p>
          {!review && question ? <section className="stage-panel candidate-question" aria-labelledby="question-title">
            <p className="eyebrow">{question.required ? 'Respuesta obligatoria' : 'Respuesta opcional'}</p>
            <h2 id="question-title" tabIndex={-1}>{question.text}</h2>
            <p className="field-hint">{question.type === 'text' ? 'Escribí tu respuesta con tus palabras.' : 'Elegí una opción. Si no podés confirmarla, podés indicarlo.'}</p>
            {question.type === 'text' ? <div className="field candidate-text"><label htmlFor="candidate-answer">Tu respuesta</label>
              <textarea id="candidate-answer" rows={7} maxLength={2000} disabled={busy} value={current?.kind === 'text' ? current.text ?? '' : ''}
                onChange={(event) => setAnswer(event.target.value ? { questionId: question.id, kind: 'text', text: event.target.value } : undefined)} />
              <p className="field-hint">Hasta 2000 caracteres. {question.required ? 'Necesaria para enviar.' : 'Podés dejarla en blanco.'}</p></div>
              : <fieldset className="candidate-options"><legend className="sr-only">Elegí tu respuesta</legend>
                {question.options.map((option) => <label key={option.id} className="candidate-option"><input type="radio" name={`answer-${question.id}`}
                  checked={current?.kind === 'option' && current.optionId === option.id} disabled={busy}
                  onChange={() => setAnswer({ questionId: question.id, kind: 'option', optionId: option.id })} />
                  <span>{option.label}</span></label>)}
                <label className="candidate-option unknown-option"><input type="radio" name={`answer-${question.id}`}
                  checked={current?.kind === 'unknown'} disabled={busy} onChange={() => setAnswer({ questionId: question.id, kind: 'unknown' })} />
                  <span>No puedo confirmarlo <small>Se registra como información pendiente.</small></span></label>
              </fieldset>}
            {current && <button className="text-action" type="button" disabled={busy} onClick={() => setAnswer()}>Quitar mi respuesta</button>}
            <div className="candidate-step-actions"><button className="outline-button" disabled={busy || index === 0} onClick={() => setIndex(index - 1)}>Anterior</button>
              {index < attempt.questions.length - 1 ? <button disabled={busy} onClick={() => setIndex(index + 1)}>Siguiente</button>
                : <button disabled={busy} onClick={() => setReview(true)}>Revisar respuestas</button>}</div>
          </section> : <section className="stage-panel candidate-review" aria-labelledby="review-title">
            <p className="eyebrow">Antes de enviar</p><h2 id="review-title" tabIndex={-1}>Revisá tus respuestas</h2>
            <p>Podés volver a cualquier pregunta. Después del envío ya no podrás cambiar las respuestas.</p>
            {requiredMissing.length > 0 && <p className="review-warning" role="alert">Faltan {requiredMissing.length} {requiredMissing.length === 1 ? 'respuesta obligatoria' : 'respuestas obligatorias'}.</p>}
            <ol className="candidate-review-list">{attempt.questions.map((item, n) => { const response = answers.find((entry) => entry.questionId === item.id);
              const value = !response ? 'Sin responder' : response.kind === 'unknown' ? 'No puedo confirmarlo' : response.kind === 'text' ? response.text
                : item.options.find((option) => option.id === response.optionId)?.label;
              return <li key={item.id}><div><strong>{n + 1}. {item.text}</strong><p>{value}</p>
                {item.required && !response && <span className="required-note">Obligatoria</span>}</div>
                <button className="text-action" disabled={busy} onClick={() => { setIndex(n); setReview(false); }}>Editar</button></li>; })}</ol>
            <label className="check"><input type="checkbox" disabled={busy} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Revisé mis respuestas y entiendo que el envío cierra la edición.</label>
            <div className="candidate-step-actions"><button className="outline-button" disabled={busy} onClick={() => { setReview(false); setIndex(attempt.questions.length - 1); }}>Volver</button>
              <button disabled={busy || requiredMissing.length > 0 || !confirmed} onClick={() => void submit()}>{dirty ? 'Guardar y enviar respuestas' : 'Enviar respuestas'}</button></div>
          </section>}
          <div className="candidate-persist"><button className="outline-button" disabled={busy || !dirty} onClick={() => void save()}>{busy ? 'Guardando…' : 'Guardar avance'}</button>
            <p className="field-hint">Guardá tu avance si querés continuar más tarde. Al enviar, guardaremos automáticamente cualquier cambio pendiente.</p></div>
          {reloadRequested && <div className="notice" role="alertdialog" aria-label="Descartar cambios locales">
            <p>Al recargar perderás los cambios que todavía no guardaste. ¿Querés continuar?</p><div className="actions">
              <button onClick={() => { setReloadRequested(false); setRefresh((value) => value + 1); }}>Descartar y recargar</button>
              <button className="outline-button" onClick={() => setReloadRequested(false)}>Seguir editando</button></div></div>}
        </>}
      {notice && <p className="success" role="status">{notice}</p>}
      {confirmLogout && <div className="notice" role="alertdialog" aria-label="Salir con respuestas sin guardar"><p>Tenés respuestas sin guardar. ¿Querés salir y descartarlas?</p>
        <div className="actions"><button onClick={() => void exit()}>Descartar y salir</button><button className="outline-button" onClick={() => setConfirmLogout(false)}>Seguir respondiendo</button></div></div>}
      {error && <div className="notice" role="alert"><p>{error}</p>{attempt && !loading && <button className="text-action" onClick={() => dirty ? setReloadRequested(true) : setRefresh((value) => value + 1)}>Recargar versión guardada</button>}</div>}
      <div className="candidate-data-notice"><strong>Uso de tus respuestas</strong>
        <p>El recruiter de este screening podrá revisarlas. Se conservan hasta 90 días desde la invitación.</p>
        <p>El sistema no verifica tu identidad ni decide por el recruiter.</p></div>
    </section><footer>Screeningroom · Proyecto final AI4Devs · Luis Lujan</footer></main>;
}
