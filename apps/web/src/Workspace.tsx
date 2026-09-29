import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, type Session } from './api';
import { Invitations } from './Invitations';

type Option = { id: string; label: string; score?: number };
type Question = { id: string; bankQuestionId?: string; criterion?: string; text?: string; type: 'boolean' | 'single_choice' | 'text';
  required: boolean; scored: boolean; weight?: number; options: Option[]; guidance?: string; exclusion?: { acceptedOptionIds: string[] } };
type Screening = { id: string; title?: string; area?: string; description?: string; status: 'draft' | 'published'; revision: number;
  threshold?: number; questions: Question[]; publishedAt?: string };
type Row = Pick<Screening, 'id' | 'title' | 'area' | 'status' | 'revision'>;
type BankQuestion = { id: string; area: string; criterion: string; text: string; type: Question['type']; options: Option[]; guidance?: string };
type EditorStep = 'puesto' | 'preguntas' | 'revision';
type PendingEditAction = { kind: 'remove'; id: string } | { kind: 'type'; id: string; type: Question['type'] };
const areas = ['Comercio y atención al cliente', 'Administración y operaciones', 'Tecnología'];
const typeLabels: Record<Question['type'], string> = { boolean: 'Sí / No', single_choice: 'Opción única', text: 'Texto libre' };
const number = (value: string) => value === '' ? undefined : Number(value);
const readable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
const readRoute = () => { const id = new URLSearchParams(window.location.hash.slice(1)).get('screening'); return id && /^[a-fA-F0-9]{24}$/.test(id) ? id : undefined; };
const hash = (id?: string) => id ? `#screening=${id}` : '';
function questionState(q: Question) {
  if (!q.criterion?.trim() || !q.text?.trim()) return 'Falta contenido';
  if (q.scored && (!q.weight || q.options.some((option) => option.score === undefined))) return 'Faltan valores';
  if (q.exclusion && (!q.exclusion.acceptedOptionIds.length || q.exclusion.acceptedOptionIds.length >= q.options.length)) return 'Revisar excluyente';
  return 'Para revisar';
}
function FieldHelp({ title, children }: { title: string; children: string }) {
  return <details className="field-help"><summary><span aria-hidden="true">ⓘ</span> {title}</summary><p>{children}</p></details>;
}
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
  const [step, setStep] = useState<EditorStep>('puesto');
  const [activeQuestionId, setActiveQuestionId] = useState<string>();
  const [bankOpen, setBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pendingEditAction, setPendingEditAction] = useState<PendingEditAction | null>(null);
  const [focusTarget, setFocusTarget] = useState<string>();
  const cancelActionRef = useRef<HTMLButtonElement>(null);
  const published = screening?.status === 'published';
  const activeQuestion = screening?.questions.find((q) => q.id === activeQuestionId) ?? screening?.questions[0];
  const activeIndex = screening?.questions.findIndex((q) => q.id === activeQuestion?.id) ?? -1;
  const matchingBank = bank.filter((entry) => !bankSearch.trim() || readable(`${entry.criterion} ${entry.text} ${entry.area}`).includes(readable(bankSearch.trim())));

  const fail = useCallback((reason: unknown) => {
    const problem = reason instanceof ApiError ? reason : new ApiError('No pudimos completar la acción.', 0);
    if (problem.status === 401) onExpired(); else setError(problem);
  }, [onExpired]);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { if (pendingEditAction) cancelActionRef.current?.focus(); }, [pendingEditAction]);
  useEffect(() => {
    if (!focusTarget) return;
    document.getElementById(focusTarget)?.focus();
    setFocusTarget(undefined);
  }, [focusTarget, step, activeQuestionId]);
  useEffect(() => { if (error) document.getElementById('workspace-error')?.focus(); }, [error]);
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
        if (route) { const data = await api<Screening>(`/screenings/${route}`, session); if (active) { setScreening(data); setDirty(false); setConfirmed(false);
          setStep(data.status === 'published' ? 'revision' : data.questions.length ? 'preguntas' : 'puesto'); setActiveQuestionId(data.questions[0]?.id); setBankOpen(false); setPendingEditAction(null); } }
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
    setLoading(true); window.history.pushState(null, '', window.location.pathname + window.location.search + hash(id)); setRoute(id); setScreening(null); setPendingEditAction(null);
  }
  function reload() { if (dirty) setPending({ kind: 'reload' }); else { setLoading(true); setRefresh((value) => value + 1); } }
  function discard() {
    const action = pending; setPending(null); setDirty(false); setLoading(true);
    if (action?.kind === 'reload') setRefresh((value) => value + 1);
    else { window.history.pushState(null, '', window.location.pathname + window.location.search + hash(action?.id)); setRoute(action?.id); setScreening(null); }
  }
  function edit(next: Screening) { setScreening(next); setDirty(true); setConfirmed(false); setNotice(''); setError(null); setPendingEditAction(null); }
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
    if (!screening) return; setBusy(true); setError(null);
    try { let current = screening;
      if (dirty) { current = await api<Screening>(`/screenings/${screening.id}`, session, 'PUT', draftBody(screening));
        setScreening(current); setDirty(false); setConfirmed(false); setNotice('Borrador guardado.'); }
      const data = await api<Screening>(`/screenings/${current.id}/questions/from-bank`, session, 'POST', { expectedRevision: current.revision, bankQuestionId: id });
      setScreening(data); setActiveQuestionId(data.questions.at(-1)?.id); setBankOpen(false); setConfirmed(false); setNotice('Pregunta del banco incorporada. Configurá sus reglas para este puesto.'); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  function addManual(type: Question['type']) {
    if (!screening || screening.questions.length >= 20) return;
    const id = crypto.randomUUID();
    edit({ ...screening, questions: [...screening.questions, { id, criterion: '', text: '', type, required: false, scored: false,
      options: type === 'text' ? [] : [{ id: crypto.randomUUID(), label: type === 'boolean' ? 'Sí' : 'Opción 1' },
        { id: crypto.randomUUID(), label: type === 'boolean' ? 'No' : 'Opción 2' }] }] });
    setActiveQuestionId(id); setBankOpen(false); setAddOpen(false); setStep('preguntas');
  }
  function changeType(q: Question, type: Question['type']): Question {
    return { ...q, type, scored: false, weight: undefined, exclusion: undefined, options: type === 'text' ? []
      : [{ id: crypto.randomUUID(), label: type === 'boolean' ? 'Sí' : 'Opción 1' }, { id: crypto.randomUUID(), label: type === 'boolean' ? 'No' : 'Opción 2' }] };
  }
  function requestTypeChange(q: Question, type: Question['type']) {
    if (type === q.type || !screening) return;
    const customized = q.options.some((option, index) => option.score !== undefined
      || ![['Sí', 'No'][index], `Opción ${index + 1}`].includes(option.label));
    if (q.scored || q.exclusion || q.bankQuestionId || customized) setPendingEditAction({ kind: 'type', id: q.id, type });
    else question(activeIndex, changeType(q, type));
  }
  function requestRemove(q: Question) {
    if (!screening) return;
    const customized = q.options.some((option, index) => option.score !== undefined
      || ![['Sí', 'No'][index], `Opción ${index + 1}`].includes(option.label));
    if (q.criterion?.trim() || q.text?.trim() || q.required || q.scored || q.exclusion || q.bankQuestionId || customized)
      setPendingEditAction({ kind: 'remove', id: q.id });
    else removeQuestion(q.id);
  }
  function removeQuestion(id: string) {
    if (!screening) return;
    const remaining = screening.questions.filter((item) => item.id !== id);
    edit({ ...screening, questions: remaining }); setActiveQuestionId(remaining[0]?.id); setPendingEditAction(null);
  }
  function confirmEditAction() {
    if (!screening || !pendingEditAction) return;
    const action = pendingEditAction;
    if (action.kind === 'remove') removeQuestion(action.id);
    else {
      const index = screening.questions.findIndex((q) => q.id === action.id);
      if (index >= 0) question(index, changeType(screening.questions[index], action.type));
      setPendingEditAction(null);
    }
  }
  function cancelEditAction() {
    if (!pendingEditAction) return;
    setFocusTarget(pendingEditAction.kind === 'type' ? `type-${pendingEditAction.id}` : `remove-${pendingEditAction.id}`);
    setPendingEditAction(null);
  }
  function jumpToIssue(issue: string) {
    const match = /^Pregunta (\d+):/.exec(issue);
    if (match && screening) { const q = screening.questions[Number(match[1]) - 1]; if (q) { setActiveQuestionId(q.id); setBankOpen(false); setStep('preguntas');
      const invalidScore = q.options.find((option) => !Number.isInteger(option.score) || option.score! < 0 || option.score! > 100);
      const invalidLabel = q.options.find((option) => !option.label.trim() || readable(option.label) === 'no puedo confirmarlo');
      const target = issue.includes('peso') ? (!Number.isInteger(q.weight) || q.weight! < 1 || q.weight! > 5 ? `weight-${q.id}` : `score-${invalidScore?.id}`)
        : issue.includes('excluyente') ? `exclusion-${q.id}`
        : issue.includes('opci') || issue.includes('respuesta') ? invalidLabel && q.type !== 'boolean' ? `label-${invalidLabel.id}` : `type-${q.id}`
        : issue.includes('criterio') ? !q.criterion?.trim() ? `criterion-${q.id}` : `text-${q.id}` : `type-${q.id}`;
      setFocusTarget(target); return; } }
    if (issue.includes('título')) { setStep('puesto'); setFocusTarget('screening-title'); }
    else if (issue.includes('área')) { setStep('puesto'); setFocusTarget('screening-area'); }
    else if (issue.includes('umbral')) { setStep('revision'); setFocusTarget('threshold'); }
    else { setStep('preguntas'); setFocusTarget('question-list-title'); }
  }
  return <section className="workspace editor-workspace" aria-labelledby="workspace-title">
    {pending && <div className="notice" role="alertdialog" aria-label="Cambios sin guardar">
      <p>Tenés cambios sin guardar. ¿Querés descartarlos para continuar?</p>
      <div className="actions"><button onClick={discard}>Descartar cambios</button><button className="outline-button" onClick={() => setPending(null)}>Seguir editando</button></div>
    </div>}
    {error && <div className="notice" id="workspace-error" role="alert" tabIndex={-1}>
      <h2>Necesitamos revisar esto</h2><p>{error.message}</p>
      {error.issues.length > 0 && <ul className="issue-list">{error.issues.map((issue, n) =>
        <li key={n}><button className="text-action issue-action" onClick={() => jumpToIssue(issue)}>{issue} <span aria-hidden="true">↗</span></button></li>)}</ul>}
      {error.status === 409 && <><p>Tu edición local sigue disponible. Recargá la versión guardada cuando decidas descartarla.</p>
        <button className="outline-button" disabled={busy} onClick={reload}>Recargar versión guardada</button></>}
    </div>}
    {notice && <p className="success" role="status">{notice}</p>}
    {loading ? <p role="status">Cargando screenings…</p> : route && screening?.id === route ? <>
      <div className="editor-toolbar">
        <button className="text-action back-action" disabled={busy} onClick={() => go()}><span aria-hidden="true">←</span> Tus screenings</button>
        <div className="toolbar-actions">
          <span className={`save-state ${dirty ? 'is-dirty' : ''}`} role="status">{published ? 'Publicado' : dirty ? 'Cambios sin guardar' : 'Borrador guardado'}</span>
          {!published && <><button className="save-action" disabled={busy || !dirty} onClick={save}>{busy ? 'Procesando…' : 'Guardar borrador'}</button>
            <button className="outline-button" disabled={busy} onClick={() => setStep('revision')}>Revisar publicación</button></>}
          {published && <button className="save-action" disabled={busy} onClick={copy}>Crear copia</button>}
        </div>
      </div>
      <div className="editor-intro">
        <p className="eyebrow">{published ? 'Screening publicado' : 'Editor de screening'}</p>
        <h1 id="workspace-title">{screening.title || 'Nuevo screening'}</h1>
        <p className="help">{published ? 'Esta configuración es de solo lectura. Creá una copia para modificarla.' : 'Prepará el puesto, sus preguntas y la evaluación. Podés guardar un borrador incompleto.'}</p>
      </div>
      <nav className="editor-steps" aria-label="Secciones del screening">
        {([{ id: 'puesto', label: '1. Puesto' }, { id: 'preguntas', label: `2. Preguntas (${screening.questions.length})` }, { id: 'revision', label: '3. Revisión' }] as const).map((item) =>
          <button key={item.id} className={`step-action ${step === item.id ? 'active' : ''}`} aria-current={step === item.id ? 'step' : undefined}
            onClick={() => { setStep(item.id); setBankOpen(false); setPendingEditAction(null); }}>{item.label}</button>)}
      </nav>
      {step === 'puesto' && <section className="stage-panel" aria-labelledby="puesto-title">
        <div className="stage-heading"><div><p className="eyebrow">Paso 1</p><h2 id="puesto-title">Datos del puesto</h2></div>
          <p>Usá un título reconocible. El área ayuda a encontrar preguntas del banco.</p></div>
        <fieldset className="editor-fields" disabled={published || busy}><legend className="sr-only">Datos del puesto</legend>
          <div className="field"><label htmlFor="screening-title">Título del screening</label>
            <input id="screening-title" maxLength={120} value={screening.title ?? ''} placeholder="Por ejemplo, Soporte técnico inicial"
              onChange={(e) => edit({ ...screening, title: e.target.value })} /></div>
          <div className="field"><label htmlFor="screening-area">Área</label>
            <input id="screening-area" list="areas" maxLength={120} value={screening.area ?? ''} placeholder="Elegí una sugerencia o escribí otra"
              onChange={(e) => edit({ ...screening, area: e.target.value })} />
            <datalist id="areas">{areas.map((area) => <option key={area} value={area} />)}</datalist>
            <p className="field-hint">Podés crear preguntas manuales aunque tu área no esté en el banco.</p></div>
          <div className="field"><label htmlFor="screening-description">Descripción del puesto <span className="optional">(opcional)</span></label>
            <textarea id="screening-description" maxLength={6000} rows={4} value={screening.description ?? ''} placeholder="Responsabilidades y contexto del puesto"
              onChange={(e) => edit({ ...screening, description: e.target.value })} /></div>
        </fieldset>
        <div className="stage-footer"><button className="outline-button" onClick={() => setStep('preguntas')}>Continuar a preguntas <span aria-hidden="true">→</span></button></div>
      </section>}
      {step === 'preguntas' && <section className="stage-panel" aria-labelledby="preguntas-title">
        <div className="stage-heading"><div><p className="eyebrow">Paso 2</p><h2 id="preguntas-title">Preguntas</h2></div>
          <p>Elegí una para editarla. Hasta veinte por screening.</p></div>
        {bankOpen ? <div className="bank-browser">
          <div className="panel-heading"><h3>Banco de preguntas</h3><button className="text-action" onClick={() => setBankOpen(false)}>← Volver a mis preguntas</button></div>
          <p className="field-hint">Al incorporar una pregunta se guarda el borrador primero. Después configurás sus reglas para este puesto.</p>
          <div className="bank-filters">
            <div className="field"><label htmlFor="bank-area">Área</label><select id="bank-area" value={bankArea} onChange={(e) => setBankArea(e.target.value)}>
              <option value="">Todas las áreas</option>{areas.map((area) => <option key={area}>{area}</option>)}</select></div>
            <div className="field"><label htmlFor="bank-search">Buscar pregunta</label><input id="bank-search" type="search" value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)} placeholder="Criterio o palabras de la pregunta" /></div>
          </div>
          {bankLoading ? <p role="status">Cargando banco…</p> : bankError ? <div role="alert"><p>{bankError}</p><button className="text-action" onClick={() => setBankRefresh((n) => n + 1)}>Reintentar</button></div>
            : matchingBank.length ? <ul className="bank-results">{matchingBank.map((entry) => <li key={entry.id} className="bank-entry">
              <div><p className="eyebrow">{entry.area} · {typeLabels[entry.type]}</p><h4>{entry.criterion}</h4><p>{entry.text}</p></div>
              <button className="text-action" disabled={busy || screening.questions.length >= 20} onClick={() => addBank(entry.id)}>＋ Añadir pregunta</button>
            </li>)}</ul> : <p className="empty">No encontramos preguntas para este filtro. Podés crear una manualmente.</p>}
        </div> : <div className="question-layout">
          <aside className="question-index" aria-labelledby="question-list-title">
            <div className="panel-heading"><h3 id="question-list-title" tabIndex={-1}>Tus preguntas</h3><span>{screening.questions.length}/20</span></div>
            {screening.questions.length ? <ol>{screening.questions.map((q, index) => <li key={q.id}>
              <button className={`question-item ${activeQuestion?.id === q.id ? 'selected' : ''}`} aria-current={activeQuestion?.id === q.id ? 'true' : undefined}
                onClick={() => { setActiveQuestionId(q.id); setPendingEditAction(null); }}>
                <span className="question-item-name">{index + 1}. {q.criterion?.trim() || q.text?.trim() || 'Nueva pregunta'}</span>
                <span className="question-item-meta">{typeLabels[q.type]} · {questionState(q)}</span>
              </button></li>)}</ol> : <p className="field-hint">Todavía no hay preguntas.</p>}
            {!published && <div className="add-controls">
              <button className="text-action" disabled={busy || screening.questions.length >= 20} aria-expanded={addOpen} onClick={() => setAddOpen(!addOpen)}>＋ Agregar pregunta</button>
              {addOpen && <div className="add-choices" role="group" aria-label="Elegir tipo de pregunta">
                {(['boolean', 'single_choice', 'text'] as const).map((type) => <button key={type} className="text-action" onClick={() => addManual(type)}>{typeLabels[type]}</button>)}
              </div>}
              <button className="text-action" disabled={busy || screening.questions.length >= 20} onClick={() => { setBankOpen(true); setAddOpen(false); }}>＋ Buscar en el banco</button>
            </div>}
          </aside>
          <div className="question-detail">
            {!activeQuestion ? <div className="question-empty"><h3>Empezá por una pregunta</h3><p>Podés redactarla o elegir una del banco.</p></div> : <>
              <div className="panel-heading question-detail-heading"><div><p className="eyebrow">Pregunta {activeIndex + 1}</p><h3>{activeQuestion.criterion?.trim() || 'Nueva pregunta'}</h3></div>
                {!published && <button id={`remove-${activeQuestion.id}`} className="text-action danger-action" disabled={busy} onClick={() => requestRemove(activeQuestion)}>Quitar pregunta</button>}</div>
              {pendingEditAction?.id === activeQuestion.id && <div className="confirm-inline" role="group" aria-label="Confirmar cambio que elimina configuración" onKeyDown={(event) => { if (event.key === 'Escape') cancelEditAction(); }}>
                <p>{pendingEditAction.kind === 'type' ? 'Cambiar el tipo restablecerá respuestas, puntajes, peso y excluyentes de esta pregunta.' : 'Quitar esta pregunta eliminará su contenido y reglas del borrador al guardar.'}</p>
                <div className="actions"><button ref={cancelActionRef} className="outline-button" onClick={cancelEditAction}>Seguir editando</button>
                  <button className="danger-button" onClick={confirmEditAction}>{pendingEditAction.kind === 'type' ? 'Confirmar cambio de tipo' : 'Confirmar eliminación'}</button></div>
              </div>}
              <fieldset className="question-fields" disabled={published || busy}><legend className="sr-only">Editar pregunta {activeIndex + 1}</legend>
                <div className="field"><div className="field-label"><label htmlFor={`criterion-${activeQuestion.id}`}>Criterio</label>
                  <FieldHelp title="¿Qué es?">Es el aspecto del puesto que querés observar con esta pregunta, por ejemplo comunicación o control de registros.</FieldHelp></div>
                  <input id={`criterion-${activeQuestion.id}`} maxLength={120} value={activeQuestion.criterion ?? ''} placeholder="Por ejemplo, Comunicación con clientes"
                    onChange={(e) => question(activeIndex, { ...activeQuestion, criterion: e.target.value })} /></div>
                <div className="field"><label htmlFor={`text-${activeQuestion.id}`}>Pregunta que verá la persona candidata</label>
                  <textarea id={`text-${activeQuestion.id}`} maxLength={500} rows={3} value={activeQuestion.text ?? ''} placeholder="Escribí una pregunta clara y concreta"
                    onChange={(e) => question(activeIndex, { ...activeQuestion, text: e.target.value })} /></div>
                <div className="field"><label htmlFor={`type-${activeQuestion.id}`}>Tipo de respuesta</label>
                  <select id={`type-${activeQuestion.id}`} value={activeQuestion.type}
                    onChange={(e) => requestTypeChange(activeQuestion, e.target.value as Question['type'])}>
                    <option value="boolean">Sí / No</option><option value="single_choice">Opción única</option><option value="text">Texto libre</option></select>
                  {activeQuestion.guidance && <p className="field-hint">Orientación del banco: {activeQuestion.guidance}</p>}</div>
                {activeQuestion.type !== 'text' && <fieldset className="answers-group"><legend>Respuestas</legend>
                  <p className="field-hint">«No puedo confirmarlo» se ofrecerá aparte como respuesta desconocida y no tendrá puntaje.</p>
                  {activeQuestion.options.map((option, index) => <div className="answer-row" key={option.id}>
                    <div className="field">{activeQuestion.type === 'boolean' ? <span className="field-caption">Respuesta {index + 1}</span>
                      : <label htmlFor={`label-${option.id}`}>Respuesta {index + 1}</label>}
                      {activeQuestion.type === 'boolean' ? <span className="static-answer">{option.label}</span> :
                        <input id={`label-${option.id}`} maxLength={300} value={option.label} onChange={(e) => question(activeIndex,
                          { ...activeQuestion, options: activeQuestion.options.map((o) => o.id === option.id ? { ...o, label: e.target.value } : o) })} />}</div>
                    {activeQuestion.scored && <div className="field score-field"><label htmlFor={`score-${option.id}`}>Valor (0–100)</label>
                      <input id={`score-${option.id}`} aria-label={`Valor de ${option.label} (0–100)`} type="number" min={0} max={100} step={1} value={option.score ?? ''}
                        onChange={(e) => question(activeIndex, { ...activeQuestion, options: activeQuestion.options.map((o) => o.id === option.id ? { ...o, score: number(e.target.value) } : o) })} /></div>}
                    {activeQuestion.exclusion && <label className="check answer-accept"><input type="checkbox" aria-label={`${option.label} cumple requisito`}
                      checked={activeQuestion.exclusion.acceptedOptionIds.includes(option.id)}
                      onChange={(e) => question(activeIndex, { ...activeQuestion, exclusion: { acceptedOptionIds: e.target.checked
                        ? [...activeQuestion.exclusion!.acceptedOptionIds, option.id] : activeQuestion.exclusion!.acceptedOptionIds.filter((id) => id !== option.id) } })} />Cumple requisito</label>}
                    {activeQuestion.type === 'single_choice' && <button className="text-action danger-action" disabled={activeQuestion.options.length <= 2}
                      onClick={() => question(activeIndex, { ...activeQuestion, options: activeQuestion.options.filter((o) => o.id !== option.id),
                        ...(activeQuestion.exclusion ? { exclusion: { acceptedOptionIds: activeQuestion.exclusion.acceptedOptionIds.filter((id) => id !== option.id) } } : {}) })}>Quitar respuesta {index + 1}</button>}
                  </div>)}
                  {activeQuestion.type === 'single_choice' && <button className="text-action" disabled={activeQuestion.options.length >= 8}
                    onClick={() => question(activeIndex, { ...activeQuestion, options: [...activeQuestion.options,
                      { id: crypto.randomUUID(), label: `Opción ${activeQuestion.options.length + 1}` }] })}>＋ Agregar respuesta</button>}
                </fieldset>}
                <section className="evaluation-panel" aria-labelledby={`evaluation-${activeQuestion.id}`}>
                  <h4 id={`evaluation-${activeQuestion.id}`}>Evaluación para este puesto</h4>
                  <p className="field-hint">Estas reglas no vienen aprobadas del banco. Revisalas para cada screening.</p>
                  <div className="toggle-field"><label className="check"><input type="checkbox" checked={activeQuestion.required}
                    onChange={(e) => question(activeIndex, { ...activeQuestion, required: e.target.checked })} />Respuesta requerida</label>
                    <p className="field-hint">La persona debe responder para enviar; no significa que sea excluyente.</p></div>
                  {activeQuestion.type === 'text' ? <p className="field-hint">El texto libre aporta evidencia para revisión humana, sin puntaje ni exclusión automática.</p> : <>
                    <div className="toggle-field"><label className="check"><input type="checkbox" checked={activeQuestion.scored}
                      onChange={(e) => question(activeIndex, { ...activeQuestion, scored: e.target.checked, weight: undefined,
                        options: activeQuestion.options.map((o) => ({ ...o, score: undefined })) })} />Incluir en el puntaje</label>
                      {activeQuestion.scored && <div className="field compact-field"><div className="field-label"><label htmlFor={`weight-${activeQuestion.id}`}>Peso (1–5)</label>
                        <FieldHelp title="¿Cómo funciona?">Un peso mayor hace que esta pregunta influya más en el puntaje total. Asigná también un valor a cada respuesta.</FieldHelp></div>
                        <input id={`weight-${activeQuestion.id}`} className="number-field" type="number" min={1} max={5} step={1}
                          value={activeQuestion.weight ?? ''} onChange={(e) => question(activeIndex, { ...activeQuestion, weight: number(e.target.value) })} /></div>}</div>
                    <div className="toggle-field"><label className="check"><input id={`exclusion-${activeQuestion.id}`} type="checkbox" checked={!!activeQuestion.exclusion}
                      onChange={(e) => question(activeIndex, { ...activeQuestion, exclusion: e.target.checked ? { acceptedOptionIds: [] } : undefined })} />Requisito excluyente</label>
                      <p className="field-hint">Marcá arriba qué respuestas cumplen este requisito. Debe haber al menos una aceptada y otra no aceptada.</p></div>
                  </>}
                </section>
              </fieldset>
            </>}
          </div>
        </div>}
      </section>}
      {step === 'revision' && <section className="stage-panel" aria-labelledby="revision-title">
        <div className="stage-heading"><div><p className="eyebrow">Paso 3</p><h2 id="revision-title">Revisar antes de publicar</h2></div>
          <p>Publicar congela la configuración. Para cambiarla después, tendrás que crear una copia.</p></div>
        <div className="review-section"><div className="panel-heading"><h3>Datos del puesto</h3>
          {!published && <button className="text-action" onClick={() => setStep('puesto')}>Editar puesto</button>}</div>
          <dl className="review-grid"><div><dt>Título</dt><dd>{screening.title || 'Pendiente'}</dd></div>
            <div><dt>Área</dt><dd>{screening.area || 'Pendiente'}</dd></div>
            <div><dt>Descripción</dt><dd>{screening.description || 'No indicada'}</dd></div></dl>
          <div className="field threshold-field"><div className="field-label"><label htmlFor="threshold">Umbral del puesto (0–100)</label>
            <FieldHelp title="¿Qué significa?">Es el mínimo de puntaje para superar los criterios numéricos. No reemplaza la revisión humana ni anula requisitos excluyentes.</FieldHelp></div>
            {published ? <p className="static-value">{screening.threshold ?? 'No definido'}</p> :
              <input id="threshold" className="number-field" type="number" min={0} max={100} step={1} value={screening.threshold ?? ''}
                onChange={(e) => edit({ ...screening, threshold: number(e.target.value) })} />}
          </div>
        </div>
        <div className="review-section"><div className="panel-heading"><h3>Preguntas ({screening.questions.length})</h3>
          {!published && <button className="text-action" onClick={() => { setStep('preguntas'); setBankOpen(false); }}>Editar preguntas</button>}</div>
          {screening.questions.length ? <ol className="review-questions">{screening.questions.map((q, index) => <li key={q.id}>
            <div><strong>{index + 1}. {q.criterion || 'Sin criterio'}</strong><p>{q.text || 'Sin texto'}</p>
              <p className="question-item-meta">{typeLabels[q.type]} · {q.required ? 'Requerida' : 'Opcional'} · {q.scored ? `Puntuable, peso ${q.weight ?? 'pendiente'}` : 'Sin puntaje'} · {q.exclusion ? 'Excluyente' : 'No excluyente'}{q.bankQuestionId ? ' · Del banco' : ''}</p>
              {q.options.length > 0 && <ul className="review-options">{q.options.map((option) => <li key={option.id}>
                <span>{option.label}</span><span>{q.scored ? `Valor: ${option.score ?? 'pendiente'}` : 'Sin puntaje'}{q.exclusion ? ` · ${q.exclusion.acceptedOptionIds.includes(option.id) ? 'Cumple requisito' : 'No cumple requisito'}` : ''}</span>
              </li>)}</ul>}</div>
            <button className="text-action" onClick={() => { setActiveQuestionId(q.id); setBankOpen(false); setStep('preguntas'); setFocusTarget(published ? 'question-list-title' : `text-${q.id}`); }}>{published ? 'Ver' : 'Editar'}</button>
          </li>)}</ol> : <p className="field-hint">Agregá al menos una pregunta; una debe ser puntuable para publicar.</p>}
        </div>
        {!published && <div className="publish-panel"><h3>Confirmación de publicación</h3>
          {dirty && <p className="review-warning">Hay cambios sin guardar. Usá «Guardar borrador» arriba antes de publicar.</p>}
          <p className="field-hint">La validación final se hace en el servidor. Si algo falta, verás qué corregir y podrás ir al campo.</p>
          <label className="check"><input type="checkbox" disabled={dirty || busy} checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)} />Revisé preguntas, valores, pesos, excluyentes, obligatoriedad y umbral para este puesto.</label>
          <button className="publish-action" disabled={busy || dirty || !confirmed} onClick={publish}>Publicar screening</button>
          {!dirty && !confirmed && <p className="field-hint">Confirmá la revisión para habilitar la publicación.</p>}
        </div>}
        {published && <div className="stage-footer"><button className="outline-button" disabled={busy} onClick={copy}>Crear copia como borrador</button></div>}
      </section>}
      {published && <Invitations screeningId={screening.id} session={session} onExpired={onExpired} />}
    </> : route ? <><h1 id="workspace-title">No pudimos abrir el screening</h1><button className="outline-button" onClick={() => go()}>Volver a mis screenings</button></> : <>
      <p className="eyebrow">Tu espacio de trabajo</p><h1 id="workspace-title">Tus screenings</h1><p className="description">Hola, {session.user.displayName}. Prepará las preguntas y criterios para cada puesto.</p>
      <button disabled={busy} onClick={create}>Crear screening</button>
      {rows.length ? <ul className="screening-list">{rows.map((row) => <li key={row.id}><div><h2><a href={hash(row.id)} onClick={(event) => { event.preventDefault(); go(row.id); }}>{row.title || 'Sin título'}</a></h2><p>{row.area || 'Área pendiente'}</p></div><span className="badge">{row.status === 'draft' ? 'Borrador' : 'Publicado'}</span></li>)}</ul> : <p className="empty">Todavía no tenés screenings. Creá el primero para comenzar.</p>}
      {rows.length === 100 && <p>Se muestran los primeros 100 screenings.</p>}
    </>}
  </section>;
}
