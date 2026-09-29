import { useEffect, useState, type FormEvent } from 'react';
import { CandidateQuestionnaire, type CandidateSession } from './CandidateQuestionnaire';

function message(status: number, fallback: string) {
  if (status === 404) return 'La invitación venció o no está disponible. Contactá a quien te la compartió.';
  if (status === 429) return 'Esperá antes de solicitar otro código.';
  if (status === 401) return 'El código venció o es incorrecto. Revisalo o pedí uno nuevo.';
  if (status === 403) return 'La verificación de seguridad venció. Recargá e intentá otra vez.';
  return fallback;
}
export function CandidateAccess({ publicId }: { publicId: string }) {
  const [session, setSession] = useState<CandidateSession | null>(null);
  const [csrf, setCsrf] = useState('');
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    async function boot() {
      try {
        const response = await fetch('/api/candidate/session', { cache: 'no-store', signal: controller.signal });
        if (response.ok) {
          const data = await response.json() as CandidateSession;
          if (data.publicId === publicId) { if (active) setSession(data); return; }
        }
        const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store', signal: controller.signal });
        if (!csrfResponse.ok) throw new Error();
        const data = await csrfResponse.json() as { csrfToken?: string };
        if (!data.csrfToken) throw new Error();
        if (active) setCsrf(data.csrfToken);
      } catch { if (active) setError('No pudimos conectar. Recargá la página.'); }
      finally { if (active) setLoading(false); }
    }
    void boot(); return () => { active = false; controller.abort(); };
  }, [publicId]);
  async function send() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/candidate/access/request', { method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ publicId }) });
      if (!response.ok) throw new Error(message(response.status, 'No pudimos enviar el código. Volvé a intentar.'));
      setSent(true); setRetryAt(Date.now() + 60000); setSeconds(60);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos conectar.'); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/candidate/access/verify', { method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ publicId, code }) });
      if (!response.ok) throw new Error(message(response.status, 'No pudimos verificar el código. Volvé a intentar.'));
      setCode('');
      const next = await fetch('/api/candidate/session', { cache: 'no-store' });
      if (!next.ok) throw new Error('No pudimos confirmar el acceso. Recargá la página.');
      setSession(await next.json() as CandidateSession);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos conectar.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (!session) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/candidate/logout', { method: 'POST', headers: { 'X-CSRF-Token': session.csrfToken } });
      if (!response.ok) throw new Error();
      setSession(null); setSent(false); setCode('');
      const next = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (next.ok) setCsrf((await next.json() as { csrfToken: string }).csrfToken);
    } catch { throw new Error('No pudimos cerrar el acceso. Volvé a intentar.'); }
    finally { setBusy(false); }
  }
  if (session) return <CandidateQuestionnaire session={session} onLogout={logout} />;
  return <main className="shell candidate-shell"><header><a className="brand" href="/" aria-label="Screeningroom, inicio"><span className="brand-mark">S</span>screeningroom</a>
    <span className="badge">Postulante</span></header>
    <div className="candidate-layout"><div className="candidate-intro"><p className="eyebrow">Tu postulación</p><h1>Tu experiencia,<br />en tus palabras.</h1>
      <p className="description">Este espacio te acompaña paso a paso. Verificá tu correo para abrir tu invitación y continuar cuando lo necesites.</p>
      <div className="candidate-trust"><span>1. Verificá tu correo</span><span>2. Respondé con calma</span><span>3. Revisá antes de enviar</span></div></div>
      <section className="candidate-card" aria-labelledby="candidate-title">
        {loading ? <p role="status">Comprobando invitación…</p> : <>
          <p className="eyebrow">Acceso seguro</p><h2 id="candidate-title">{sent ? 'Ingresá el código' : 'Verificá tu correo'}</h2>
          <p>{sent ? 'Te enviamos un código de seis dígitos al correo registrado para esta invitación.' : 'Te enviaremos un código al correo que registró quien te invitó.'}</p>
          {!sent ? <button disabled={busy || !csrf} onClick={() => void send()}>{busy ? 'Enviando…' : 'Enviar código de acceso'}</button> : <>
            <form className="candidate-code-form" onSubmit={(event) => void verify(event)}><label htmlFor="candidate-code">Código de seis dígitos</label>
              <input id="candidate-code" autoFocus autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required
                value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" />
              <p className="field-hint">Vence en diez minutos. Encontralo en Mailpit durante esta prueba.</p>
              <button type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verificando…' : 'Continuar'}</button></form>
            <button className="text-action" disabled={busy || seconds > 0} onClick={() => void send()}>
              {seconds > 0 ? `Pedir otro código en ${seconds} s` : 'Pedir otro código'}</button></>}
        </>}
        {error && <p className="inline-error" role="alert">{error}</p>}
      </section></div><footer>Screeningroom · Proyecto final AI4Devs · Luis Lujan</footer></main>;
}
