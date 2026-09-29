import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type Session } from './api';

type Invitation = { id: string; publicId: string; candidateEmail: string; candidateName: string | null;
  status: 'invited' | 'in_progress' | 'submitted'; expiresAt: string };
const statusText = { invited: 'Pendiente', in_progress: 'En curso', submitted: 'Enviado' };
export function Invitations({ screeningId, session, onExpired }: { screeningId: string; session: Session; onExpired: () => void }) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState('');
  useEffect(() => {
    let active = true;
    setItems([]); setError('');
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
      setItems((current) => [created, ...current]); setEmail(''); setName('');
      setNotice('Invitación creada. Compartí el enlace con el postulante ficticio.');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onExpired();
      else setError(reason instanceof Error ? reason.message : 'No pudimos crear la invitación.');
    } finally { setBusy(false); }
  }
  async function copy(publicId: string) {
    const link = `${window.location.origin}${window.location.pathname}#invite=${publicId}`;
    try { await navigator.clipboard.writeText(link); setCopied(publicId); }
    catch { setCopied(''); setError('No pudimos copiar el enlace. Seleccionalo en el campo para copiarlo.'); }
  }
  return <section className="stage-panel invitation-panel" aria-labelledby="invitation-title">
    <div className="stage-heading"><div><p className="eyebrow">Siguiente paso</p><h2 id="invitation-title">Invitaciones</h2></div>
      <p>Un enlace por postulante. El acceso requiere un código enviado a su correo ficticio.</p></div>
    <form className="invitation-form" onSubmit={create}>
      <div className="field"><label htmlFor="candidate-email">Correo ficticio</label><input id="candidate-email" type="email" required
        pattern=".+@(?:.+\.)?example\.test" placeholder="persona@example.test" autoComplete="off" maxLength={254} value={email}
        onChange={(event) => setEmail(event.target.value)} /><p className="field-hint">Por ahora usamos direcciones example.test y Mailpit local.</p></div>
      <div className="field"><label htmlFor="candidate-name">Nombre <span className="optional">(opcional)</span></label><input id="candidate-name"
        maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Por ejemplo, Alex" /></div>
      <button type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear invitación'}</button>
    </form>
    {error && <p className="inline-error" role="alert">{error}</p>}{notice && <p className="success" role="status">{notice}</p>}
    {items.length ? <ul className="invitation-list">{items.map((item) => <li key={item.id}>
      <div className="invitation-heading"><div><strong>{item.candidateName || item.candidateEmail}</strong>
        {item.candidateName && <span>{item.candidateEmail}</span>}</div><span className="badge">{statusText[item.status]}</span></div>
      <p className="field-hint">Vence el {new Date(item.expiresAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      <div className="invitation-link"><input readOnly aria-label={`Enlace de ${item.candidateEmail}`}
        value={`${window.location.origin}${window.location.pathname}#invite=${item.publicId}`} onFocus={(event) => event.target.select()} />
        <button className="text-action" type="button" onClick={() => void copy(item.publicId)}>{copied === item.publicId ? 'Copiado' : 'Copiar enlace'}</button></div>
    </li>)}</ul> : <p className="field-hint">Aún no hay invitaciones para este screening.</p>}
  </section>;
}
