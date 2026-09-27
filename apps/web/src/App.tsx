import { useEffect, useState } from 'react';

type ConnectionState = 'checking' | 'ready' | 'unavailable';

export function App() {
  const [state, setState] = useState<ConnectionState>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    setState('checking');
    fetch('/api/health/ready', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unavailable');
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object' || !('status' in data) || data.status !== 'ready') {
          throw new Error('Invalid response');
        }
        if (active) setState('ready');
      })
      .catch(() => { if (active) setState('unavailable'); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [attempt]);

  const messages = {
    checking: 'Comprobando conexión…',
    ready: 'La base del proyecto está conectada.',
    unavailable: 'No pudimos conectar. Comprobá el servicio local y volvé a intentar.',
  };

  return (
    <main className="shell">
      <header><a className="brand" href="/" aria-label="Screeningroom, inicio"><span className="brand-mark">S</span>screeningroom</a><span className="badge">En desarrollo</span></header>
      <section className="intro" aria-labelledby="title">
        <p className="eyebrow">Criterios claros. Decisiones humanas.</p>
        <h1 id="title">Cada respuesta<br />cuenta una parte.</h1>
        <p className="description">Prepará screenings para cada puesto y revisá la evidencia antes de decidir cómo continuar.</p>
      </section>
      <section className="connection" aria-labelledby="connection-title">
        <div><p className="eyebrow">Primer hito de desarrollo</p><h2 id="connection-title">Un punto de partida conectado</h2><p>Las funciones para preparar y responder screenings se incorporarán en los próximos cambios.</p></div>
        <div className={`status ${state}`} role="status" aria-live="polite"><span className="status-dot" aria-hidden="true" /><p>{messages[state]}</p></div>
        {state === 'unavailable' && <button onClick={() => setAttempt((value) => value + 1)}>Reintentar conexión</button>}
      </section>
      <footer>Screeningroom · Proyecto final AI4Devs · Luis Lujan</footer>
    </main>
  );
}
