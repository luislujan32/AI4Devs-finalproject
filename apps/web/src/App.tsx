import { useEffect, useState, type FormEvent } from 'react';

type Session = { user: { id: string; email: string; displayName: string }; csrfToken: string; expiresAt: string };
type Screening = { id: string; title: string; area: string; status: 'draft' | 'published'; revision: number };
const sessionData = (value: unknown): value is Session => {
  if (!value || typeof value !== 'object' || !('user' in value) || !value.user || typeof value.user !== 'object') return false;
  return 'displayName' in value.user && typeof value.user.displayName === 'string'
    && 'csrfToken' in value && typeof value.csrfToken === 'string' && 'expiresAt' in value && typeof value.expiresAt === 'string';
};

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [csrf, setCsrf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setInitializing(true);
    fetch('/api/auth/session', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.ok) {
          const data: unknown = await response.json();
          if (!sessionData(data)) throw new Error();
          if (active) { setSession(data); setError(''); }
        } else if (response.status === 401) {
          const bootstrap = await fetch('/api/auth/csrf', { signal: controller.signal, cache: 'no-store' });
          if (!bootstrap.ok) throw new Error();
          const data = await bootstrap.json();
          if (typeof data.csrfToken !== 'string') throw new Error();
          if (active) setCsrf(data.csrfToken);
        } else throw new Error();
      })
      .catch(() => { if (active) setError('No pudimos conectar. Volvé a intentar.'); })
      .finally(() => { if (active) setInitializing(false); });
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let active = true;
    setLoadingList(true); setScreenings([]);
    fetch('/api/screenings', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) { setSession(null); setCsrf(''); setAttempt((n) => n + 1); setError('Tu sesión venció. Volvé a entrar.'); }
          return;
        }
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data.screenings)) throw new Error();
        if (active) setScreenings(data.screenings);
      })
      .catch(() => { if (active) setError('No pudimos cargar tus screenings. Volvé a intentar.'); })
      .finally(() => { if (active) setLoadingList(false); });
    return () => { active = false; controller.abort(); };
  }, [session, attempt]);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const suppliedPassword = password; setPassword('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ email, password: suppliedPassword }) });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Correo o contraseña incorrectos.');
        if (response.status === 429) throw new Error('Demasiados intentos. Volvé a intentar más tarde.');
        if (response.status === 403) { setCsrf(''); setAttempt((n) => n + 1); throw new Error('El acceso venció. Volvé a intentar.'); }
        throw new Error('No pudimos iniciar sesión. Revisá los datos e intentá nuevamente.');
      }
      const data: unknown = await response.json();
      if (!sessionData(data)) throw new Error('No pudimos confirmar la sesión.');
      setCsrf(''); setSession(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos conectar.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (!session) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': session.csrfToken } });
      if (!response.ok && response.status !== 401) throw new Error();
      setSession(null); setScreenings([]); setEmail(''); setCsrf(''); setAttempt((n) => n + 1);
    } catch { setError('No pudimos cerrar la sesión. Volvé a intentar.'); }
    finally { setBusy(false); }
  }
  return (
    <main className="shell">
      <header><a className="brand" href="/" aria-label="Screeningroom, inicio"><span className="brand-mark">S</span>screeningroom</a>
        {session ? <button className="logout" disabled={busy} onClick={logout}>Cerrar sesión</button> : <span className="badge">En desarrollo</span>}</header>
      {initializing ? <p className="loading" role="status">Comprobando acceso…</p> : session ? (
        <section className="workspace" aria-labelledby="workspace-title">
          <p className="eyebrow">Tu espacio de trabajo</p><h1 id="workspace-title">Tus screenings</h1>
          <p className="description">Hola, {session.user.displayName}. Estos son tus screenings.</p>
          {loadingList ? <p role="status">Cargando screenings…</p> : screenings.length ? <ul className="screening-list">{screenings.map((screening) => (
            <li key={screening.id}><div><h2>{screening.title}</h2><p>{screening.area || 'Área pendiente'}</p></div>
              <span className="badge">{screening.status === 'draft' ? 'Borrador' : 'Publicado'}</span></li>
          ))}</ul> : !error && <p className="empty">Todavía no tenés screenings.</p>}
          {screenings.length === 100 && <p>Se muestran los primeros 100 screenings.</p>}
        </section>
      ) : (
        <div className="access-layout"><section className="intro" aria-labelledby="title"><p className="eyebrow">Criterios claros. Decisiones humanas.</p>
          <h1 id="title">Cada respuesta<br />cuenta una parte.</h1><p className="description">Prepará screenings para cada puesto y revisá la evidencia antes de decidir cómo continuar.</p></section>
          <section className="access" aria-labelledby="access-title"><h2 id="access-title">Acceso del recruiter</h2><p>Entrá con tu cuenta para consultar tus screenings.</p>
            <form onSubmit={login}><label htmlFor="email">Correo electrónico</label><input id="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
              <label htmlFor="password">Contraseña</label><input id="password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="submit" disabled={busy || !csrf}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button></form></section></div>
      )}
      {error && <div className="notice" role="alert"><p>{error}</p><button className="secondary" disabled={busy || initializing} onClick={() => { setError(''); setAttempt((n) => n + 1); }}>Reintentar</button></div>}
      <footer>Screeningroom · Proyecto final AI4Devs · Luis Lujan</footer>
    </main>
  );
}
