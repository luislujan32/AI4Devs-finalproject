import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type Session } from './api';
import { RecruiterReport } from './RecruiterReport';

type Invitation = { id: string; publicId: string; candidateEmail: string; candidateName: string | null;
  configurationVersion: number;
  status: 'invited' | 'in_progress' | 'submitted'; expiresAt: string; submittedAt: string | null;
  result: { outcome: 'meets' | 'not_meets' | 'needs_review'; score: number | null; threshold: number } | null;
  review: { decision: 'continue' | 'do_not_continue' | 'clarify'; reviewedAt: string } | null };
const statusText = { invited: 'Por responder', in_progress: 'En curso', submitted: 'Respuestas recibidas' };
const resultText = { meets: 'Cumple', not_meets: 'No cumple', needs_review: 'Pendiente' };
const decisionText = { continue: 'Continuar', do_not_continue: 'No continuar', clarify: 'Aclaración pendiente' };
const date = (value: string) => new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
const readReport = () => new URLSearchParams(window.location.hash.slice(1)).get('report') || '';

export function Invitations({ screeningId, activeVersion, closed, session, onExpired }: { screeningId: string; activeVersion: number; closed: boolean; session: Session; onExpired: () => void }) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ invited: 0, pendingReview: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [queue, setQueue] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');
  const [decision, setDecision] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [reportId, setReportId] = useState(readReport);

  useEffect(() => { const change = () => setReportId(readReport()); window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); setTerm(search.trim()); }, 300);
    return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => {
    let active = true; setLoading(true); setLoadError('');
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (term) params.set('search', term);
    if (queue) params.set('queue', queue);
    if (status) params.set('status', status);
    if (result) params.set('result', result);
    if (decision) params.set('decision', decision);
    api<{ invitations: Invitation[]; total: number; summary: typeof summary }>(`/screenings/${screeningId}/invitations?${params}`, session)
      .then((data) => { if (active) { setItems(data.invitations); setTotal(data.total); setSummary(data.summary); } })
      .catch((reason: unknown) => { if (!active) return; if (reason instanceof ApiError && reason.status === 401) onExpired();
        else { setItems([]); setTotal(0); setLoadError('No pudimos cargar los postulantes. Volvé a intentar.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [screeningId, session, onExpired, page, term, queue, status, result, decision, refresh]);

  function openReport(id: string) { const params = new URLSearchParams(window.location.hash.slice(1)); params.set('report', id);
    window.history.pushState(null, '', `#${params}`); setReportId(id); setNotice(''); }
  function closeReport() { const params = new URLSearchParams(window.location.hash.slice(1)); params.delete('report');
    window.history.pushState(null, '', `#${params}`); setReportId(''); setRefresh((value) => value + 1); }
  function clearFilters() { setSearch(''); setTerm(''); setQueue(''); setStatus(''); setResult(''); setDecision(''); setPage(1); setNotice(''); }
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const created = await api<Invitation>(`/screenings/${screeningId}/invitations`, session, 'POST',
        { candidateEmail: email, ...(name.trim() ? { candidateName: name.trim() } : {}) });
      setEmail(''); setName(''); setFormOpen(false); clearFilters(); setRefresh((value) => value + 1);
      setNotice(`Invitación enviada a ${created.candidateEmail}.`);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onExpired();
      else setError(`No se envió la invitación. ${reason instanceof Error ? reason.message : 'Volvé a intentar.'}`);
    } finally { setBusy(false); }
  }
  function link(publicId: string) { return `${window.location.origin}${window.location.pathname}#invite=${publicId}`; }
  async function copy(item: Invitation) {
    try { await navigator.clipboard.writeText(link(item.publicId)); setCopied(item.publicId); setManualLink(''); }
    catch { setCopied(''); setManualLink(item.publicId); }
  }
  const selected = items.find((item) => item.id === reportId);
  if (reportId) return <RecruiterReport invitationId={reportId} candidate={selected?.candidateName || selected?.candidateEmail || 'postulante'}
    session={session} onExpired={onExpired} onClose={closeReport}
    onReviewSaved={(review) => setItems((current) => current.map((item) => item.id === reportId
      ? { ...item, review: { decision: review.decision, reviewedAt: review.reviewedAt } } : item))} />;
  return <section className="stage-panel invitation-panel" aria-labelledby="invitation-title">
    <div className="stage-heading"><div><p className="eyebrow">{closed ? 'Screening cerrado' : 'Seguimiento'}</p><h2 id="invitation-title">Postulantes</h2></div>
      <p>{closed ? 'No se pueden enviar nuevas invitaciones. Las existentes conservan su plazo y sus resultados siguen disponibles.'
        : 'Invitá por correo y revisá las respuestas recibidas. Las decisiones quedan registradas para uso interno.'}</p></div>
    <div className="invitation-actions">{!closed && <button type="button" onClick={() => { setFormOpen((open) => !open); setError(''); setNotice(''); }}
      aria-expanded={formOpen} aria-controls="invitation-form">{formOpen ? 'Cancelar invitación' : 'Invitar postulante'}</button>}
      <span className="field-hint">{summary.invited} {summary.invited === 1 ? 'postulante invitado' : 'postulantes invitados'} · {summary.pendingReview} por revisar{!closed ? ` · Nuevas invitaciones: v${activeVersion}` : ''}</span></div>
    {!closed && formOpen && <form id="invitation-form" className="invitation-form" onSubmit={create}>
      <div className="invitation-form-heading"><h3>Nueva invitación</h3><p>El correo incluye un enlace personal para comenzar.</p></div>
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
    {error && <p className="inline-error" role="alert">{error}</p>}
    {notice && <div className="invitation-notice" role="status"><span>{notice}</span><button className="text-action" type="button" onClick={() => setNotice('')} aria-label="Cerrar confirmación">Cerrar</button></div>}
    <div className="candidate-list-header"><div><h3>Lista de postulantes</h3><p>{total} {total === 1 ? 'resultado' : 'resultados'}{queue ? ' por revisar' : ''}</p></div></div>
    <div className="candidate-filters"><div className="field"><label htmlFor="candidate-search">Buscar por nombre o correo</label><input id="candidate-search" type="search" maxLength={120}
      value={search} onChange={(event) => { setSearch(event.target.value); setNotice(''); }} placeholder="Buscar postulante" /></div>
      <div className="field"><label htmlFor="candidate-queue">Vista</label><select id="candidate-queue" value={queue} onChange={(event) => { setQueue(event.target.value); setStatus(''); setResult(''); setDecision(''); setPage(1); setNotice(''); }}>
        <option value="">Todos</option><option value="review">Por revisar ({summary.pendingReview})</option></select></div>
      <div className="field"><label htmlFor="candidate-status">Respuesta</label><select id="candidate-status" value={status} onChange={(event) => { setStatus(event.target.value); if (event.target.value && event.target.value !== 'submitted') setDecision(''); setQueue(''); setPage(1); }}>
        <option value="">Todas</option><option value="invited">Por responder</option><option value="in_progress">En curso</option><option value="submitted">Recibidas</option></select></div>
      <div className="field"><label htmlFor="candidate-result">Criterios</label><select id="candidate-result" value={result} onChange={(event) => { setResult(event.target.value); setQueue(''); setPage(1); }}>
        <option value="">Todos</option><option value="meets">Cumple</option><option value="not_meets">No cumple</option><option value="needs_review">Pendiente</option></select></div>
      <div className="field"><label htmlFor="candidate-decision">Decisión</label><select id="candidate-decision" value={decision} onChange={(event) => { setDecision(event.target.value); if (event.target.value === 'pending') setStatus('submitted'); setQueue(''); setPage(1); }}>
        <option value="">Todas</option><option value="pending">Sin decisión</option><option value="continue">Continuar</option><option value="do_not_continue">No continuar</option><option value="clarify">Aclaración pendiente</option></select></div>
      {(search || queue || status || result || decision) && <button className="text-action" type="button" onClick={clearFilters}>Limpiar filtros</button>}</div>
    {loadError && <div className="inline-error" role="alert">{loadError} <button className="text-action" type="button" onClick={() => setRefresh((value) => value + 1)}>Reintentar</button></div>}
    {loading ? <p role="status">Cargando postulantes…</p> : items.length ? <>
      <div className="candidate-columns" aria-hidden="true"><span>Postulante</span><span>Respuesta</span><span>Criterios</span><span>Decisión humana</span><span>Fecha</span><span></span></div>
      <ul className="candidate-list">{items.map((item) => <li key={item.id}>
        <div className="candidate-name"><strong>{item.candidateName || item.candidateEmail}</strong>{item.candidateName && <span>{item.candidateEmail}</span>}{activeVersion > 1 && <small>Preguntas v{item.configurationVersion}</small>}</div>
        <div className="candidate-cell" data-label="Respuesta"><span className="cell-label">Respuesta</span><span className={`badge status-${item.status}`}>{statusText[item.status]}</span></div>
        <div className="candidate-cell" data-label="Criterios"><span className="cell-label">Criterios</span>{item.result ? <span className={`assessment-value result-${item.result.outcome}`}>{resultText[item.result.outcome]}</span> : <span className="muted">—</span>}</div>
        <div className="candidate-cell" data-label="Decisión humana"><span className="cell-label">Decisión humana</span>{item.review ? <span className={`assessment-value review-${item.review.decision}`}>{decisionText[item.review.decision]}</span>
          : item.status === 'submitted' ? <span className="assessment-value review-pending">Sin decisión</span> : <span className="muted">—</span>}</div>
        <div className="candidate-cell candidate-date" data-label={item.status === 'submitted' ? 'Respondió' : 'Vence'}><span className="cell-label">{item.status === 'submitted' ? 'Respondió' : 'Vence'}</span>{item.status === 'submitted' && item.submittedAt ? date(item.submittedAt) : date(item.expiresAt)}</div>
        <div className="candidate-row-action">{item.status === 'submitted' ? <button className="text-action" type="button" onClick={() => openReport(item.id)}>Ver informe<span className="sr-only"> de {item.candidateName || item.candidateEmail}</span></button>
          : new Date(item.expiresAt) > new Date() && <button className="icon-action" type="button" aria-label={`Copiar enlace de ${item.candidateName || item.candidateEmail}`}
            title="Copiar enlace" onClick={() => void copy(item)}><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>}</div>
        {copied === item.publicId && <p className="copy-confirmation" role="status">Enlace copiado</p>}
        {manualLink === item.publicId && <div className="field manual-link"><label htmlFor={`link-${item.id}`}>Seleccioná y copiá el enlace</label>
          <input id={`link-${item.id}`} readOnly value={link(item.publicId)} onFocus={(event) => event.target.select()} /></div>}
      </li>)}</ul></> : !loadError && <div className="listing-empty">{search || queue || status || result || decision ? <><h3>No hay postulantes con estos filtros</h3><p>Probá otra búsqueda o limpiá los filtros.</p></>
        : <><h3>Todavía no hay postulantes</h3><p>Enviá la primera invitación para comenzar.</p></>}</div>}
    {total > 20 && <nav className="pagination" aria-label="Páginas de postulantes"><button className="outline-button" disabled={page === 1} onClick={() => { setPage((value) => value - 1); setNotice(''); }}>Anterior</button>
      <span>Página {page} de {Math.ceil(total / 20)}</span><button className="outline-button" disabled={page * 20 >= total} onClick={() => { setPage((value) => value + 1); setNotice(''); }}>Siguiente</button></nav>}
  </section>;
}
