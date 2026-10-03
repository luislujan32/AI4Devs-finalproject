import { useCallback, useEffect, useState, type FormEvent } from 'react';

import type { Session } from './api';
import { Workspace } from './Workspace';
import { CandidateAccess } from './CandidateAccess';
const readInvitation = () => new URLSearchParams(window.location.hash.slice(1)).get('invite') || '';
const sessionData = (value: unknown): value is Session => {
  if (!value || typeof value !== 'object' || !('user' in value) || !value.user || typeof value.user !== 'object') return false;
  return 'displayName' in value.user && typeof value.user.displayName === 'string'
    && 'csrfToken' in value && typeof value.csrfToken === 'string' && 'expiresAt' in value && typeof value.expiresAt === 'string';
};

export function App() {
  const [invitation, setInvitation] = useState(readInvitation);
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [csrf, setCsrf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editingDirty, setEditingDirty] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const expired = useCallback(() => { setSession(null); setCsrf(''); setEditingDirty(false); setConfirmLogout(false); setSessionExpired(true); setAttempt((n) => n + 1); setError('Tu sesión terminó. Iniciá sesión de nuevo.'); }, []);

  useEffect(() => { const change = () => setInvitation(readInvitation()); window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change); }, []);

  useEffect(() => {
    if (invitation) return;
    const controller = new AbortController();
    let active = true;
    setInitializing(true);
    fetch('/api/auth/session', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.ok) {
          const data: unknown = await response.json();
          if (!sessionData(data)) throw new Error();
          if (active) { setSession(data); setError(''); setSessionExpired(false); }
        } else if (response.status === 401) {
          const bootstrap = await fetch('/api/auth/csrf', { signal: controller.signal, cache: 'no-store' });
          if (!bootstrap.ok) throw new Error();
          const data = await bootstrap.json();
          if (typeof data.csrfToken !== 'string') throw new Error();
          if (active) setCsrf(data.csrfToken);
        } else throw new Error();
      })
      .catch(() => { if (active) { setSessionExpired(false); setError('No pudimos conectar. Volvé a intentar.'); } })
      .finally(() => { if (active) setInitializing(false); });
    return () => { active = false; controller.abort(); };
  }, [attempt, invitation]);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const suppliedPassword = password; setPassword('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ email, password: suppliedPassword }) }).catch(() => { throw new Error('No pudimos conectar. Volvé a intentar.'); });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Correo o contraseña incorrectos.');
        if (response.status === 429) throw new Error('Demasiados intentos. Volvé a intentar más tarde.');
        if (response.status === 403) { setCsrf(''); setAttempt((n) => n + 1); throw new Error('El acceso venció. Volvé a intentar.'); }
        throw new Error('No pudimos iniciar sesión. Revisá los datos e intentá nuevamente.');
      }
      const data: unknown = await response.json().catch(() => { throw new Error('No pudimos confirmar la sesión.'); });
      if (!sessionData(data)) throw new Error('No pudimos confirmar la sesión.');
      setCsrf(''); setSession(data); setSessionExpired(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos conectar.'); }
    finally { setBusy(false); }
  }
  async function logout(discard = false) {
    if (!session) return;
    if (editingDirty && !discard) { setConfirmLogout(true); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': session.csrfToken } });
      if (!response.ok && response.status !== 401) throw new Error();
      setSession(null); setEditingDirty(false); setConfirmLogout(false); setEmail(''); setCsrf(''); window.history.replaceState(null, '', window.location.pathname + window.location.search); setAttempt((n) => n + 1);
    } catch { setError('No pudimos cerrar la sesión. Volvé a intentar.'); }
    finally { setBusy(false); }
  }
  if (invitation) return <CandidateAccess key={invitation} publicId={invitation} />;
  return (
    <main className="shell">
      <header><a className="brand" href="/" aria-label="Screeningroom, inicio"><span className="brand-mark">S</span>screeningroom</a>
        {session ? <button className="logout" disabled={busy} onClick={() => void logout()}>Cerrar sesión</button> : <span className="badge">En desarrollo</span>}</header>
      {initializing ? <p className="loading" role="status">Comprobando acceso…</p> : session ? (
        <Workspace session={session} onExpired={expired} onDirtyChange={setEditingDirty} />
      ) : (
        <div className="access-layout"><section className="intro" aria-labelledby="title"><p className="eyebrow">Criterios claros. Decisiones humanas.</p>
          <h1 id="title">Cada respuesta<br />cuenta una parte.</h1><p className="description">Prepará screenings para cada puesto y revisá la evidencia antes de decidir cómo continuar.</p></section>
          <section className="access" aria-labelledby="access-title"><h2 id="access-title">Acceso del recruiter</h2><p>Entrá con tu cuenta para consultar tus screenings.</p>
            <form onSubmit={login}><label htmlFor="email">Correo electrónico</label><input id="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
              <label htmlFor="password">Contraseña</label><input id="password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="submit" disabled={busy || !csrf}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button></form></section></div>
      )}
      {confirmLogout && <div className="notice" role="alertdialog" aria-label="Salir con cambios sin guardar"><p>Tenés cambios sin guardar. ¿Querés cerrar sesión y descartarlos?</p><div className="actions"><button disabled={busy} onClick={() => void logout(true)}>Descartar cambios y cerrar sesión</button><button className="secondary" disabled={busy} onClick={() => setConfirmLogout(false)}>Seguir editando</button></div></div>}
      {error && <div className="notice" role="alert"><p>{error}</p>{!sessionExpired && <button className="secondary" disabled={busy || initializing} onClick={() => { setError(''); setAttempt((n) => n + 1); }}>Reintentar</button>}</div>}
      <footer>Screeningroom · Proyecto final AI4Devs · Luis Lujan</footer>
    </main>
  );
}
