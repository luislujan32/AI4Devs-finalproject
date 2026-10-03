import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type Session } from './api';
import { RecruiterReport } from './RecruiterReport';

type Invitation = { id: string; publicId: string; candidateEmail: string; candidateName: string | null;
  status: 'invited' | 'in_progress' | 'submitted'; expiresAt: string; submittedAt: string | null;
  result: { outcome: 'meets' | 'not_meets' | 'needs_review'; score: number | null; threshold: number } | null;
  review: { decision: 'continue' | 'do_not_continue' | 'clarify'; reviewedAt: string } | null };
const statusText = { invited: 'Por responder', in_progress: 'En curso', submitted: 'Respuestas recibidas' };
const resultText = { meets: 'Cumple criterios', not_meets: 'No cumple criterios', needs_review: 'Criterios pendientes' };
const decisionText = { continue: 'Continuar', do_not_continue: 'No continuar', clarify: 'Aclaración pendiente (anterior)' };

export function Invitations({ screeningId, closed, session, onExpired }: { screeningId: string; closed: boolean; session: Session; onExpired: () => void }) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [reportId, setReportId] = useState('');
  useEffect(() => {
    let active = true;
    setItems([]); setError(''); setNotice(''); setFormOpen(false); setReportId('');
    api<{ invitations: Invitation[] }>(`/screenings/${screeningId}/invitations`, session)
      .then((data) => { if (active) setItems(data.invitations); })
      .catch((reason: unknown) => { if (!active) return; if (reason instanceof ApiError && reason.status === 401) onExpired();
        else setError('No pudimos cargar las invitaciones. Recargá la página.'); });
    return () => { active = false; };
  }, [screeningId, session, onExpired]);
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const created = await api<Invitation>(`/screenings/${screeningId}/invitations`, session, 'POST',
        { candidateEmail: email, ...(name.trim() ? { candidateName: name.trim() } : {}) });
      setItems((current) => [created, ...current]); setEmail(''); setName(''); setFormOpen(false);
      setNotice(`Invitación enviada a ${created.candidateEmail}. El correo incluye el enlace para comenzar.`);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onExpired();
      else setError(reason instanceof Error ? reason.message : 'No pudimos enviar la invitación.');
    } finally { setBusy(false); }
  }
  function link(publicId: string) { return `${window.location.origin}${window.location.pathname}#invite=${publicId}`; }
  async function copy(item: Invitation) {
    try { await navigator.clipboard.writeText(link(item.publicId)); setCopied(item.publicId); setManualLink(''); }
    catch { setCopied(''); setManualLink(item.publicId); }
  }
  const selected = items.find((item) => item.id === reportId);
  if (selected) return <RecruiterReport invitationId={selected.id} candidate={selected.candidateName || selected.candidateEmail}
    session={session} onExpired={onExpired} onClose={() => setReportId('')}
    onReviewSaved={(review) => setItems((current) => current.map((item) => item.id === selected.id
      ? { ...item, review: { decision: review.decision, reviewedAt: review.reviewedAt } } : item))} />;
  return <section className="stage-panel invitation-panel" aria-labelledby="invitation-title">
    <div className="stage-heading"><div><p className="eyebrow">{closed ? 'Screening cerrado' : 'Después de publicar'}</p><h2 id="invitation-title">Postulantes</h2></div>
      <p>{closed ? 'No se pueden enviar nuevas invitaciones. Las personas ya invitadas pueden responder hasta el vencimiento de su enlace y sus resultados siguen disponibles.' : 'Invitá a cada persona por correo. El enlace del mensaje abre su invitación; los enlaces compartidos requieren verificar el correo.'}</p></div>
    <div className="invitation-actions">{!closed && <button type="button" onClick={() => { setFormOpen((open) => !open); setError(''); }}
      aria-expanded={formOpen} aria-controls="invitation-form">{formOpen ? 'Cancelar invitación' : 'Invitar postulante'}</button>
      }
      <span className="field-hint">{items.length} {items.length === 1 ? 'postulante invitado' : 'postulantes invitados'}</span></div>
    {!closed && formOpen && <form id="invitation-form" className="invitation-form" onSubmit={create}>
      <div className="invitation-form-heading"><h3>Nueva invitación</h3><p>El enlace se envía por correo y también queda disponible para copiar.</p></div>
      <div className="invitation-form-fields">
        <div className="field"><label htmlFor="candidate-email">Correo electrónico</label><input id="candidate-email" type="email" required
          pattern=".+@(?:.+\.)?example\.test" placeholder="persona@example.test" autoComplete="off" maxLength={254} value={email}
          onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="field"><label htmlFor="candidate-name">Nombre <span className="optional">(opcional)</span></label><input id="candidate-name"
          maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Por ejemplo, Alex" /></div>
      </div>
      <p className="field-hint">En esta versión de prueba se usan direcciones @example.test. Consultá el mensaje en Mailpit local.</p>
      <button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar invitación'}</button>
    </form>}
    {error && <p className="inline-error" role="alert">{error}</p>}{notice && <p className="success" role="status">{notice}</p>}
    {items.length ? <ul className="invitation-list">{items.map((item) => <li key={item.id}>
      <div className="invitation-heading"><div><strong>{item.candidateName || item.candidateEmail}</strong>
        {item.candidateName && <span>{item.candidateEmail}</span>}</div><span className={`badge status-${item.status}`}>{statusText[item.status]}</span></div>
      {item.status === 'submitted' && <div className="candidate-assessment" aria-label={`Evaluación de ${item.candidateName || item.candidateEmail}`}>
        <div><span className="assessment-label">Criterios</span><span className={`assessment-value result-${item.result?.outcome ?? 'needs_review'}`}>
          {item.result ? resultText[item.result.outcome] : 'Resultado pendiente'}</span></div>
        <div><span className="assessment-label">Decisión humana</span><span className={`assessment-value review-${item.review?.decision ?? 'pending'}`}>
          {item.review ? decisionText[item.review.decision] : 'Sin decisión'}</span></div>
      </div>}
      <div className="invitation-meta"><span>{item.status === 'submitted'
        ? item.submittedAt ? `Respondió el ${new Date(item.submittedAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Respuestas enviadas'
        : `Enlace disponible hasta el ${new Date(item.expiresAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}`}</span>
        {item.status === 'submitted' ? <button className="outline-button" type="button"
          onClick={() => setReportId(item.id)}>{item.review ? 'Ver informe y decisión' : 'Ver informe'}</button>
          : new Date(item.expiresAt) > new Date() && <button className="icon-action" type="button" aria-label={`Copiar enlace de ${item.candidateName || item.candidateEmail}`}
          title="Copiar enlace" onClick={() => void copy(item)}><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>}</div>
      {copied === item.publicId && <p className="copy-confirmation" role="status">Enlace copiado</p>}
      {manualLink === item.publicId && <div className="field manual-link"><label htmlFor={`link-${item.id}`}>Seleccioná y copiá el enlace</label>
        <input id={`link-${item.id}`} readOnly value={link(item.publicId)} onFocus={(event) => event.target.select()} /></div>}
    </li>)}</ul> : <p className="invitation-empty">Todavía no invitaste a nadie. Enviá la primera invitación para compartir el screening.</p>}
  </section>;
}
