import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type Session } from './api';

type Option = { id: string; label: string; score?: number };
type Question = { id: string; bankQuestionId?: string; criterion?: string; text?: string; type: 'boolean' | 'single_choice' | 'text';
  required: boolean; scored: boolean; weight?: number; options: Option[]; guidance?: string; exclusion?: { acceptedOptionIds: string[] } };
type Screening = { id: string; title?: string; area?: string; description?: string; status: 'draft' | 'published'; revision: number;
  threshold?: number; questions: Question[]; publishedAt?: string };
type Row = Pick<Screening, 'id' | 'title' | 'area' | 'status' | 'revision'>;
type BankQuestion = { id: string; area: string; criterion: string; text: string; type: Question['type']; options: Option[]; guidance?: string };
const areas = ['Comercio y atención al cliente', 'Administración y operaciones', 'Tecnología'];
const number = (value: string) => value === '' ? undefined : Number(value);
const readRoute = () => { const id = new URLSearchParams(window.location.hash.slice(1)).get('screening'); return id && /^[a-fA-F0-9]{24}$/.test(id) ? id : undefined; };
const hash = (id?: string) => id ? `#screening=${id}` : '';
function draftBody(screening: Screening) {
  return { title: screening.title, area: screening.area, description: screening.description, threshold: screening.threshold,
    questions: screening.questions, expectedRevision: screening.revision };
}

export function Workspace({ session, onExpired, onDirtyChange }: { session: Session; onExpired: () => void; onDirtyChange: (value: boolean) => void }) {
  const [route, setRoute] = useState(readRoute);
  const [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [screening, setScreening] = useState<Screening | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{ kind: 'navigate' | 'reload'; id?: string } | null>(null);
  const [bankArea, setBankArea] = useState('');
  const [bank, setBank] = useState<BankQuestion[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [bankRefresh, setBankRefresh] = useState(0);
  const published = screening?.status === 'published';

  const fail = useCallback((reason: unknown) => {
    const problem = reason instanceof ApiError ? reason : new ApiError('No pudimos completar la acción.', 0);
    if (problem.status === 401) onExpired(); else setError(problem);
  }, [onExpired]);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    const navigation = () => {
      const next = readRoute();
      if (next === route) return;
      if (dirty) { setPending({ kind: 'navigate', id: next }); window.history.replaceState(null, '', window.location.pathname + window.location.search + hash(route)); }
      else { setLoading(true); setRoute(next); }
    };
    window.addEventListener('beforeunload', handler); window.addEventListener('hashchange', navigation);
    return () => { window.removeEventListener('beforeunload', handler); window.removeEventListener('hashchange', navigation); };
  }, [dirty, route]);
  useEffect(() => {
    let active = true; setLoading(true); setError(null); setNotice('');
    const load = async () => {
      try {
        if (route) { const data = await api<Screening>(`/screenings/${route}`, session); if (active) { setScreening(data); setDirty(false); setConfirmed(false); } }
        else { const data = await api<{ screenings: Row[] }>('/screenings', session); if (active) { setRows(data.screenings); setScreening(null); setDirty(false); } }
      } catch (reason) { if (active) fail(reason); }
      finally { if (active) setLoading(false); }
    };
    void load(); return () => { active = false; };
  }, [route, refresh, session, fail]);
  useEffect(() => {
    if (!screening || published) return;
    let active = true; setBankLoading(true); setBankError(''); setBank([]);
    api<{ questions: BankQuestion[] }>(`/question-bank${bankArea ? `?area=${encodeURIComponent(bankArea)}` : ''}`, session)
      .then((data) => { if (active) setBank(data.questions); })
      .catch((reason) => { if (active) { if (reason instanceof ApiError && reason.status === 401) onExpired(); else setBankError('No pudimos cargar el banco. Podés seguir creando preguntas manuales.'); } })
      .finally(() => { if (active) setBankLoading(false); });
    return () => { active = false; };
  }, [screening?.id, published, bankArea, bankRefresh, session, onExpired]);

  function go(id?: string) {
    if (dirty) { setPending({ kind: 'navigate', id }); return; }
    setLoading(true); window.history.pushState(null, '', window.location.pathname + window.location.search + hash(id)); setRoute(id); setScreening(null);
  }
  function reload() { if (dirty) setPending({ kind: 'reload' }); else { setLoading(true); setRefresh((value) => value + 1); } }
  function discard() {
    const action = pending; setPending(null); setDirty(false); setLoading(true);
    if (action?.kind === 'reload') setRefresh((value) => value + 1);
    else { window.history.pushState(null, '', window.location.pathname + window.location.search + hash(action?.id)); setRoute(action?.id); setScreening(null); }
  }
  function edit(next: Screening) { setScreening(next); setDirty(true); setConfirmed(false); setNotice(''); setError(null); }
  function question(index: number, next: Question) { if (screening) edit({ ...screening, questions: screening.questions.map((q, n) => n === index ? next : q) }); }
  async function create() {
    setBusy(true); setError(null);
    try { const data = await api<Screening>('/screenings', session, 'POST', {}); go(data.id); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function save() {
    if (!screening) return; setBusy(true); setError(null);
    try { const data = await api<Screening>(`/screenings/${screening.id}`, session, 'PUT', draftBody(screening)); setScreening(data); setDirty(false); setConfirmed(false); setNotice('Borrador guardado.'); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function publish() {
    if (!screening || dirty || !confirmed) return; setBusy(true); setError(null);
    try { const data = await api<Pick<Screening, 'id' | 'status' | 'revision' | 'publishedAt'>>(`/screenings/${screening.id}/publish`, session, 'POST', { expectedRevision: screening.revision, confirmConfiguration: confirmed }); setScreening({ ...screening, ...data }); setConfirmed(false); setNotice('Screening publicado. Su configuración queda protegida de cambios.'); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function copy() {
    if (!screening) return; setBusy(true); setError(null);
    try { const data = await api<Screening>(`/screenings/${screening.id}/copy`, session, 'POST', {}); go(data.id); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function addBank(id: string) {
    if (!screening || dirty) return; setBusy(true); setError(null);
    try { const data = await api<Screening>(`/screenings/${screening.id}/questions/from-bank`, session, 'POST', { expectedRevision: screening.revision, bankQuestionId: id });
      setScreening(data); setConfirmed(false); setNotice('Pregunta del banco incorporada. Revisá sus reglas para este puesto.'); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  function addManual() {
    if (!screening) return;
    edit({ ...screening, questions: [...screening.questions, { id: crypto.randomUUID(), criterion: '', text: '', type: 'boolean', required: false, scored: false,
      options: [{ id: crypto.randomUUID(), label: 'Sí' }, { id: crypto.randomUUID(), label: 'No' }] }] });
  }
  function changeType(q: Question, type: Question['type']): Question {
    return { ...q, type, scored: false, weight: undefined, exclusion: undefined, options: type === 'text' ? []
      : [{ id: crypto.randomUUID(), label: type === 'boolean' ? 'Sí' : 'Opción 1' }, { id: crypto.randomUUID(), label: type === 'boolean' ? 'No' : 'Opción 2' }] };
  }
  return <section className="workspace" aria-labelledby="workspace-title">
    {pending && <div className="notice" role="alertdialog" aria-label="Cambios sin guardar"><p>Tenés cambios sin guardar. ¿Querés descartarlos para continuar?</p>
      <div className="actions"><button onClick={discard}>Descartar cambios y continuar</button><button className="secondary" onClick={() => setPending(null)}>Seguir editando</button></div></div>}
    {notice && <p className="success" role="status">{notice}</p>}
    {error && <div className="notice" role="alert"><p>{error.message}</p>{error.issues.length > 0 && <ul>{error.issues.map((issue, n) => <li key={n}>{issue}</li>)}</ul>}
      {error.status === 409 && <p>Tu edición local sigue disponible. Recargá la versión guardada antes de continuar.</p>}<button className="secondary" disabled={busy} onClick={reload}>Recargar versión guardada</button></div>}
    {loading ? <p role="status">Cargando screenings…</p> : route && screening?.id === route ? <>
      <div className="editor-heading"><button className="secondary" disabled={busy} onClick={() => go()}>Volver a mis screenings</button><span className="badge">{published ? 'Publicado' : dirty ? 'Cambios sin guardar' : 'Borrador guardado'}</span></div>
      <h1 id="workspace-title">{published ? screening.title : 'Preparar screening'}</h1>
      {published && <p>Esta configuración ya está publicada. Creá una copia para preparar otro screening.</p>}
      <fieldset className="editor-card" disabled={published || busy}><legend>Datos del puesto</legend>
        <label htmlFor="screening-title">Título del screening</label><input id="screening-title" maxLength={120} value={screening.title ?? ''} onChange={(e) => edit({ ...screening, title: e.target.value })} />
        <label htmlFor="screening-area">Área</label><input id="screening-area" list="areas" maxLength={120} value={screening.area ?? ''} onChange={(e) => edit({ ...screening, area: e.target.value })} /><datalist id="areas">{areas.map((area) => <option key={area} value={area} />)}</datalist>
        <label htmlFor="screening-description">Descripción del puesto (opcional)</label><textarea id="screening-description" maxLength={6000} rows={3} value={screening.description ?? ''} onChange={(e) => edit({ ...screening, description: e.target.value })} />
        <label htmlFor="threshold">Umbral para este puesto (0–100)</label><input id="threshold" className="number-field" type="number" min={0} max={100} step={1} value={screening.threshold ?? ''} onChange={(e) => edit({ ...screening, threshold: number(e.target.value) })} />
        {!published && <p className="help">Podés guardar un borrador incompleto. Antes de publicar, revisá título, área, reglas y umbral.</p>}
      </fieldset>
      <h2>Preguntas ({screening.questions.length}/20)</h2><p className="help">El texto libre aporta evidencia y se revisa de forma humana. «No puedo confirmarlo» se ofrecerá como respuesta desconocida y nunca tendrá puntaje.</p>
      {screening.questions.map((q, index) => <fieldset className="editor-card" key={q.id} disabled={published || busy}><legend>Pregunta {index + 1}</legend>
        <label htmlFor={`criterion-${q.id}`}>Criterio de pregunta {index + 1}</label><input id={`criterion-${q.id}`} maxLength={120} value={q.criterion ?? ''} onChange={(e) => question(index, { ...q, criterion: e.target.value })} />
        <label htmlFor={`text-${q.id}`}>Texto de pregunta {index + 1}</label><textarea id={`text-${q.id}`} maxLength={500} rows={2} value={q.text ?? ''} onChange={(e) => question(index, { ...q, text: e.target.value })} />
        <label htmlFor={`type-${q.id}`}>Tipo de pregunta {index + 1}</label><select id={`type-${q.id}`} value={q.type} onChange={(e) => question(index, changeType(q, e.target.value as Question['type']))}><option value="boolean">Sí / No</option><option value="single_choice">Opción única</option><option value="text">Texto libre</option></select>
        {q.guidance && <p className="help">Orientación: {q.guidance}</p>}
        <label className="check"><input type="checkbox" checked={q.required} onChange={(e) => question(index, { ...q, required: e.target.checked })} />Respuesta requerida en pregunta {index + 1}</label>
        {q.type !== 'text' && <><label className="check"><input type="checkbox" checked={q.scored} onChange={(e) => question(index, { ...q, scored: e.target.checked, weight: undefined, options: q.options.map((o) => ({ ...o, score: undefined })) })} />Puntuar pregunta {index + 1}</label>
          {q.scored && <><label htmlFor={`weight-${q.id}`}>Peso de pregunta {index + 1} (1–5)</label><input id={`weight-${q.id}`} className="number-field" type="number" min={1} max={5} step={1} value={q.weight ?? ''} onChange={(e) => question(index, { ...q, weight: number(e.target.value) })} /></>}
          <label className="check"><input type="checkbox" checked={!!q.exclusion} onChange={(e) => question(index, { ...q, exclusion: e.target.checked ? { acceptedOptionIds: [] } : undefined })} />Requisito excluyente en pregunta {index + 1}</label>
          <p className="help">La obligatoriedad exige responder. Un excluyente indica cuáles respuestas cumplen un requisito del puesto.</p>
          {q.options.map((option, n) => <div className="option-row" key={option.id}><div><label htmlFor={`label-${option.id}`}>Opción {n + 1} de pregunta {index + 1}</label><input id={`label-${option.id}`} maxLength={300} value={option.label} readOnly={q.type === 'boolean'} onChange={(e) => question(index, { ...q, options: q.options.map((o) => o.id === option.id ? { ...o, label: e.target.value } : o) })} /></div>
            {q.scored && <div><label htmlFor={`score-${option.id}`}>Puntaje opción {n + 1} de pregunta {index + 1}</label><input id={`score-${option.id}`} type="number" min={0} max={100} step={1} value={option.score ?? ''} onChange={(e) => question(index, { ...q, options: q.options.map((o) => o.id === option.id ? { ...o, score: number(e.target.value) } : o) })} /></div>}
            {q.exclusion && <label className="check"><input type="checkbox" checked={q.exclusion.acceptedOptionIds.includes(option.id)} onChange={(e) => question(index, { ...q, exclusion: { acceptedOptionIds: e.target.checked ? [...q.exclusion!.acceptedOptionIds, option.id] : q.exclusion!.acceptedOptionIds.filter((id) => id !== option.id) } })} />Cumple requisito: opción {n + 1} de pregunta {index + 1}</label>}
            {q.type === 'single_choice' && <button className="secondary" disabled={q.options.length <= 2} onClick={() => question(index, { ...q, options: q.options.filter((o) => o.id !== option.id), ...(q.exclusion ? { exclusion: { acceptedOptionIds: q.exclusion.acceptedOptionIds.filter((id) => id !== option.id) } } : {}) })}>Quitar opción {n + 1} de pregunta {index + 1}</button>}
          </div>)}
          {q.type === 'single_choice' && <button className="secondary" disabled={q.options.length >= 8} onClick={() => question(index, { ...q, options: [...q.options, { id: crypto.randomUUID(), label: `Opción ${q.options.length + 1}` }] })}>Agregar opción a pregunta {index + 1}</button>}
        </>}
        <button className="secondary" onClick={() => edit({ ...screening, questions: screening.questions.filter((item) => item.id !== q.id) })}>Quitar pregunta {index + 1}</button>
      </fieldset>)}
      {!published && <><button className="secondary" disabled={busy || screening.questions.length >= 20} onClick={addManual}>Agregar pregunta manual</button>
        <details className="editor-card"><summary>Agregar preguntas del banco</summary><p className="help">La copia conserva el texto y la orientación. Configurá la evaluación para este puesto; no hay puntajes ni excluyentes preaprobados.</p>
          <label htmlFor="bank-area">Filtrar banco por área</label><select id="bank-area" value={bankArea} onChange={(e) => setBankArea(e.target.value)}><option value="">Todas las áreas</option>{areas.map((area) => <option key={area}>{area}</option>)}</select>
          {dirty && <p className="help">Guardá el borrador antes de incorporar una pregunta del banco.</p>}
          {bankLoading ? <p role="status">Cargando banco…</p> : bankError ? <div role="alert"><p>{bankError}</p><button className="secondary" onClick={() => setBankRefresh((n) => n + 1)}>Reintentar banco</button></div> : bank.length ? <ul className="bank-list">{bank.map((entry) => <li key={entry.id}><h3>{entry.criterion}</h3><p>{entry.text}</p><p className="help">{entry.area}</p><button disabled={busy || dirty || screening.questions.length >= 20} onClick={() => addBank(entry.id)}>Agregar: {entry.criterion}</button></li>)}</ul> : <p>No hay preguntas disponibles para esta área. Podés seguir creando preguntas manuales.</p>}
        </details>
        <div className="editor-card"><h2>Guardar y publicar</h2><p>Publicar congela la configuración. Para cambiarla después, tendrás que crear una copia.</p>
          <div className="actions"><button disabled={busy} onClick={save}>{busy ? 'Procesando…' : 'Guardar borrador'}</button><button className="secondary" disabled={busy} onClick={reload}>Recargar versión guardada</button></div>
          {dirty && <p className="help">Guardá los cambios antes de confirmar y publicar.</p>}
          <label className="check"><input type="checkbox" disabled={dirty || busy} checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />Revisé las preguntas, valores, pesos, excluyentes y obligatoriedad; confirmo el umbral para este puesto.</label>
          <button disabled={busy || dirty || !confirmed} onClick={publish}>Publicar screening</button>
        </div></>}
      {published && <button disabled={busy} onClick={copy}>Crear copia como borrador</button>}
    </> : route ? <><h1 id="workspace-title">No pudimos abrir el screening</h1><button className="secondary" onClick={() => go()}>Volver a mis screenings</button></> : <>
      <p className="eyebrow">Tu espacio de trabajo</p><h1 id="workspace-title">Tus screenings</h1><p className="description">Hola, {session.user.displayName}. Prepará las preguntas y criterios para cada puesto.</p>
      <button disabled={busy} onClick={create}>Crear screening</button>
      {rows.length ? <ul className="screening-list">{rows.map((row) => <li key={row.id}><div><h2><a href={hash(row.id)} onClick={(event) => { event.preventDefault(); go(row.id); }}>{row.title || 'Sin título'}</a></h2><p>{row.area || 'Área pendiente'}</p></div><span className="badge">{row.status === 'draft' ? 'Borrador' : 'Publicado'}</span></li>)}</ul> : <p className="empty">Todavía no tenés screenings. Creá el primero para comenzar.</p>}
      {rows.length === 100 && <p>Se muestran los primeros 100 screenings.</p>}
    </>}
  </section>;
}
