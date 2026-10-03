import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { api, ApiError, type Session } from './api';
import { Invitations } from './Invitations';

type Option = { id: string; label: string; score?: number };
type Question = { id: string; bankQuestionId?: string; criterion?: string; text?: string; type: 'boolean' | 'single_choice' | 'text';
  required: boolean; scored: boolean; weight?: number; options: Option[]; guidance?: string; exclusion?: { acceptedOptionIds: string[] } };
type Screening = { id: string; title?: string; area?: string; description?: string; status: 'draft' | 'published' | 'closed'; revision: number;
  threshold?: number; questions: Question[]; publishedAt?: string; closedAt?: string; basedOnScreeningId?: string };
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
function FieldHelp({ label, children }: { label: string; children: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  return <span className={`field-help ${open ? 'open' : ''} ${dismissed ? 'dismissed' : ''}`}
    onMouseLeave={() => { setOpen(false); setDismissed(false); }}>
    <button type="button" aria-label={label} aria-describedby={id} aria-expanded={open}
      onClick={() => { setDismissed(false); setOpen((value) => !value); }}
      onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); setDismissed(true); } }}
      onFocus={() => setDismissed(false)} onBlur={() => { setOpen(false); setDismissed(false); }}><span aria-hidden="true">ⓘ</span></button><span id={id} role="tooltip">{children}</span>
  </span>;
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
  const [saveState, setSaveState] = useState<'saved' | 'pending' | 'saving' | 'error'>('saved');
  const draftRef = useRef<Screening | null>(null);
  const editVersion = useRef(0);
  const savedVersion = useRef(0);
  const flushRef = useRef<Promise<Screening | null> | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{ kind: 'navigate' | 'reload'; id?: string } | null>(null);
  const [bankArea, setBankArea] = useState('');
  const [bank, setBank] = useState<BankQuestion[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [bankRefresh, setBankRefresh] = useState(0);
  const [step, setStep] = useState<EditorStep>('puesto');
  const [area, setArea] = useState<'configuracion' | 'postulantes'>('configuracion');
  const [activeQuestionId, setActiveQuestionId] = useState<string>();
  const [bankOpen, setBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pendingEditAction, setPendingEditAction] = useState<PendingEditAction | null>(null);
  const [focusTarget, setFocusTarget] = useState<string>();
  const cancelActionRef = useRef<HTMLButtonElement>(null);
  const published = screening?.status === 'published';
  const readOnly = !!screening && screening.status !== 'draft';
  const closed = screening?.status === 'closed';
  const activeQuestion = screening?.questions.find((q) => q.id === activeQuestionId) ?? screening?.questions[0];
  const activeIndex = screening?.questions.findIndex((q) => q.id === activeQuestion?.id) ?? -1;
  const matchingBank = bank.filter((entry) => !bankSearch.trim() || readable(`${entry.criterion} ${entry.text} ${entry.area}`).includes(readable(bankSearch.trim())));
  const scoredQuestions = screening?.questions.filter((q) => q.scored && q.weight && q.options.length && q.options.every((o) => o.score !== undefined)) ?? [];
  const maximumScore = scoredQuestions.length && scoredQuestions.length === screening?.questions.filter((q) => q.scored).length
    ? scoredQuestions.reduce((sum, q) => sum + Math.max(...q.options.map((o) => o.score!)) * q.weight!, 0)
      / scoredQuestions.reduce((sum, q) => sum + q.weight!, 0) : undefined;
  const basicIssues = screening ? [
    ...(!screening.title?.trim() ? ['Falta el título del screening.'] : []),
    ...(!screening.area?.trim() ? ['Falta el área del puesto.'] : []),
    ...(!screening.questions.length ? ['Agregá al menos una pregunta.'] : []),
    ...(!screening.questions.some((q) => q.scored) ? ['Marcá al menos una pregunta para el puntaje.'] : []),
    ...(screening.threshold === undefined ? ['Definí el umbral del puesto.'] : []),
    ...screening.questions.flatMap((q, index) => [
      ...(!q.criterion?.trim() || !q.text?.trim() ? [`Pregunta ${index + 1}: completá pregunta y criterio.`] : []),
      ...(q.scored && (!q.weight || q.options.some((option) => option.score === undefined))
        ? [`Pregunta ${index + 1}: completá peso y valores de las respuestas.`] : []),
      ...(q.type !== 'text' && q.options.some((option) => !option.label.trim())
        ? [`Pregunta ${index + 1}: completá las opciones de respuesta.`] : []),
      ...(q.exclusion && (!q.exclusion.acceptedOptionIds.length || q.exclusion.acceptedOptionIds.length >= q.options.length)
        ? [`Pregunta ${index + 1}: revisá el requisito excluyente.`] : []),
    ]),
    ...(maximumScore !== undefined && screening.threshold !== undefined && maximumScore < screening.threshold
      ? [`El umbral de ${screening.threshold} supera el máximo posible de ${Number(maximumScore.toFixed(1))}.`] : []),
  ] : [];

  const fail = useCallback((reason: unknown) => {
    const problem = reason instanceof ApiError ? reason : new ApiError('No pudimos completar la acción.', 0);
    if (problem.status === 401) onExpired(); else setError(problem);
  }, [onExpired]);
  const flushDraft = useCallback(async (): Promise<Screening | null> => {
    if (flushRef.current) return flushRef.current;
    const run = async () => {
      while (draftRef.current && savedVersion.current < editVersion.current) {
        const snapshot = draftRef.current;
        const version = editVersion.current;
        setSaveState('saving');
        const saved = await api<Screening>(`/screenings/${snapshot.id}`, session, 'PUT', draftBody(snapshot));
        savedVersion.current = version;
        if (draftRef.current?.id !== saved.id) return null;
        const next = { ...draftRef.current, revision: saved.revision };
        draftRef.current = next;
        setScreening(next);
        if (editVersion.current === version) { setDirty(false); setSaveState('saved'); }
        else setSaveState('pending');
      }
      return draftRef.current;
    };
    const pending = run().catch((reason: unknown) => { setSaveState('error'); fail(reason); throw reason; });
    flushRef.current = pending;
    try { return await pending; } finally { flushRef.current = null; }
  }, [session, fail]);
  useEffect(() => {
    if (!dirty || saveState !== 'pending' || !screening || screening.status !== 'draft') return;
    const timer = window.setTimeout(() => { void flushDraft().catch(() => undefined); }, 700);
    return () => window.clearTimeout(timer);
  }, [dirty, saveState, screening, flushDraft]);
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
        if (route) { const data = await api<Screening>(`/screenings/${route}`, session); if (active) { draftRef.current = data; editVersion.current = 0; savedVersion.current = 0;
          setScreening(data); setDirty(false); setSaveState('saved'); setConfirmed(false);
          setStep(data.status !== 'draft' ? 'revision' : data.questions.length ? 'preguntas' : 'puesto'); setArea(data.status !== 'draft' ? 'postulantes' : 'configuracion'); setActiveQuestionId(data.questions[0]?.id); setBankOpen(false); setPendingEditAction(null); setConfirmDelete(false); setConfirmClose(false); } }
        else { const data = await api<{ screenings: Row[] }>('/screenings', session); if (active) { setRows(data.screenings); draftRef.current = null;
          setScreening(null); setDirty(false); setSaveState('saved'); } }
      } catch (reason) { if (active) fail(reason); }
      finally { if (active) setLoading(false); }
    };
    void load(); return () => { active = false; };
  }, [route, refresh, session, fail]);
  useEffect(() => {
    if (!screening || readOnly) return;
    let active = true; setBankLoading(true); setBankError(''); setBank([]);
    api<{ questions: BankQuestion[] }>(`/question-bank${bankArea ? `?area=${encodeURIComponent(bankArea)}` : ''}`, session)
      .then((data) => { if (active) setBank(data.questions); })
      .catch((reason) => { if (active) { if (reason instanceof ApiError && reason.status === 401) onExpired(); else setBankError('No pudimos cargar el banco. Podés seguir creando preguntas manuales.'); } })
      .finally(() => { if (active) setBankLoading(false); });
    return () => { active = false; };
  }, [screening?.id, readOnly, bankArea, bankRefresh, session, onExpired]);

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
  function edit(next: Screening) { draftRef.current = next; editVersion.current += 1; setScreening(next); setDirty(true); setSaveState('pending');
    setConfirmed(false); setNotice(''); setError(null); setPendingEditAction(null); }
  function question(index: number, next: Question) { if (screening) edit({ ...screening, questions: screening.questions.map((q, n) => n === index ? next : q) }); }
  async function create() {
    setBusy(true); setError(null);
    try { const data = await api<Screening>('/screenings', session, 'POST', {}); go(data.id); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function saveAndContinue() {
    try { await flushDraft(); const action = pending; setPending(null);
      if (action?.kind === 'reload') setRefresh((value) => value + 1);
      else { const id = action?.id; setLoading(true); window.history.pushState(null, '', window.location.pathname + window.location.search + hash(id));
        setRoute(id); setScreening(null); setPendingEditAction(null); }
    } catch { /* El borrador queda visible para reintentar. */ }
  }
  async function publish() {
    if (!screening || dirty || !confirmed) return; setBusy(true); setError(null);
    try { const data = await api<Pick<Screening, 'id' | 'status' | 'revision' | 'publishedAt'>>(`/screenings/${screening.id}/publish`, session, 'POST', { expectedRevision: screening.revision, confirmConfiguration: confirmed }); const next = { ...screening, ...data }; draftRef.current = next;
      setScreening(next); setArea('postulantes'); setConfirmed(false); setNotice('Screening publicado. Ya podés invitar postulantes.'); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function copy() {
    if (!screening) return; setBusy(true); setError(null);
    try { const data = await api<Screening>(`/screenings/${screening.id}/copy`, session, 'POST', {}); go(data.id); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function close() {
    if (!screening || !published) return; setBusy(true); setError(null);
    try { const data = await api<Pick<Screening, 'id' | 'status' | 'revision' | 'closedAt'>>(`/screenings/${screening.id}/close`, session,
      'POST', { expectedRevision: screening.revision, confirmClosure: true });
      const next = { ...screening, ...data }; draftRef.current = next;
      setScreening(next); setConfirmClose(false); setArea('postulantes');
      setNotice('Screening cerrado. Podés seguir consultando resultados.'); }
    catch (reason) { setConfirmClose(false); fail(reason); } finally { setBusy(false); }
  }
  async function remove() {
    if (!screening || readOnly) return;
    setBusy(true); setError(null);
    try { const current = dirty ? await flushDraft() : screening;
      if (!current) return;
      await api<void>(`/screenings/${current.id}`, session, 'DELETE', { expectedRevision: current.revision });
      setConfirmDelete(false); setDirty(false); setScreening(null); setLoading(true);
      window.history.pushState(null, '', window.location.pathname + window.location.search); setRoute(undefined); }
    catch (reason) { fail(reason); } finally { setBusy(false); }
  }
  async function addBank(id: string) {
    if (!screening) return; setBusy(true); setError(null);
    try { const current = dirty ? await flushDraft() : screening;
      if (!current) return;
      const data = await api<Screening>(`/screenings/${current.id}/questions/from-bank`, session, 'POST', { expectedRevision: current.revision, bankQuestionId: id });
      draftRef.current = data; setScreening(data); setDirty(false); setSaveState('saved'); setActiveQuestionId(data.questions.at(-1)?.id);
      setBankOpen(false); setConfirmed(false); setNotice('Pregunta del banco incorporada. Revisá sus reglas para este puesto.'); }
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
    {pending && <div className="notice" role="alertdialog" aria-label="Cambios pendientes de guardar">
      <p>Hay cambios pendientes de guardar. ¿Cómo querés continuar?</p>
      <div className="actions"><button onClick={() => void saveAndContinue()}>Guardar y continuar</button>
        <button className="outline-button" disabled={saveState === 'saving'} onClick={discard}>Descartar cambios</button>
        <button className="text-action" onClick={() => setPending(null)}>Seguir editando</button></div>
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
          <span className={`save-state ${dirty ? 'is-dirty' : ''}`} role="status">{closed ? 'Cerrado' : published ? 'Publicado'
            : saveState === 'saving' ? 'Guardando…' : saveState === 'error' ? 'No se pudo guardar' : dirty ? 'Cambios pendientes' : 'Borrador guardado'}</span>
          {!readOnly && <>{saveState === 'error' && <button className="outline-button" onClick={() => void flushDraft().catch(() => undefined)}>Reintentar guardado</button>}
            <button className="outline-button" disabled={busy} onClick={() => setStep('revision')}>Revisar publicación</button>
            <button className="text-action danger-action" disabled={busy} onClick={() => setConfirmDelete(true)}>Eliminar borrador</button></>}
          {readOnly && <button className="save-action" disabled={busy} onClick={copy}>Crear nueva versión</button>}
          {published && <button className="text-action danger-action" disabled={busy} onClick={() => setConfirmClose(true)}>Cerrar SC</button>}
        </div>
      </div>
      {confirmDelete && <div className="confirm-inline" role="alertdialog" aria-label="Eliminar borrador">
        <p>¿Eliminar este borrador? Se perderán su configuración y los cambios sin guardar. Esta acción no se puede deshacer.</p>
        <div className="actions"><button className="danger-button" disabled={busy} onClick={() => void remove()}>Eliminar borrador</button>
          <button className="outline-button" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancelar</button></div>
      </div>}
      {confirmClose && <div className="confirm-inline" role="alertdialog" aria-label="Cerrar screening">
        <p>¿Cerrar este screening? No se podrán enviar nuevas invitaciones. Quienes ya recibieron una podrán responder hasta que venza su enlace. Los resultados enviados seguirán disponibles durante el plazo de conservación.</p>
        <div className="actions"><button className="danger-button" disabled={busy} onClick={() => void close()}>Confirmar cierre</button>
          <button className="outline-button" disabled={busy} onClick={() => setConfirmClose(false)}>Cancelar</button></div>
      </div>}
      <div className="editor-intro">
        <p className="eyebrow">{closed ? 'Screening cerrado' : published ? 'Screening publicado' : 'Editor de screening'}</p>
        <h1 id="workspace-title">{screening.title || 'Nuevo screening'}</h1>
        <p className="help">{readOnly ? 'Las personas ya invitadas conservan estas preguntas y reglas. Para cambiarlas para futuras invitaciones, creá una nueva versión editable.'
          : 'Prepará el puesto, sus preguntas y la evaluación. El borrador se guarda automáticamente, incluso si está incompleto.'}</p>
        {screening.basedOnScreeningId && <p className="field-hint">Esta versión se creó a partir de un screening anterior.
          <button className="text-action" onClick={() => go(screening.basedOnScreeningId)}>Ver versión original</button>
          Sus postulantes y resultados permanecen en la versión original.</p>}
      </div>
      {readOnly && <nav className="workspace-areas" aria-label="Áreas del screening">
        <button className={area === 'configuracion' ? 'active' : ''} aria-current={area === 'configuracion' ? 'page' : undefined} onClick={() => setArea('configuracion')}>Configuración</button>
        <button className={area === 'postulantes' ? 'active' : ''} aria-current={area === 'postulantes' ? 'page' : undefined} onClick={() => setArea('postulantes')}>Postulantes</button>
      </nav>}
      {area === 'configuracion' && <>
      <nav className="editor-steps" aria-label="Secciones del screening">
        {([{ id: 'puesto', label: '1. Puesto' }, { id: 'preguntas', label: `2. Preguntas (${screening.questions.length})` }, { id: 'revision', label: '3. Revisión' }] as const).map((item) =>
          <button key={item.id} className={`step-action ${step === item.id ? 'active' : ''}`} aria-current={step === item.id ? 'step' : undefined}
            onClick={() => { setStep(item.id); setBankOpen(false); setPendingEditAction(null); }}>{item.label}</button>)}
      </nav>
      {step === 'puesto' && <section className="stage-panel" aria-labelledby="puesto-title">
        <div className="stage-heading"><div><p className="eyebrow">Paso 1</p><h2 id="puesto-title">Datos del puesto</h2></div>
          <p>Usá un título reconocible. El área ayuda a encontrar preguntas del banco.</p></div>
        <fieldset className="editor-fields" disabled={readOnly || busy}><legend className="sr-only">Datos del puesto</legend>
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
          <p className="field-hint">Al incorporar una pregunta se guardan primero tus cambios pendientes. Luego podés revisar sus reglas para este puesto.</p>
          <div className="bank-filters">
            <div className="field"><label htmlFor="bank-area">Área</label><select id="bank-area" value={bankArea} onChange={(e) => setBankArea(e.target.value)}>
              <option value="">Todas las áreas</option>{areas.map((area) => <option key={area}>{area}</option>)}</select></div>
            <div className="field"><label htmlFor="bank-search">Buscar pregunta</label><input id="bank-search" type="search" value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)} placeholder="Criterio o palabras de la pregunta" /></div>
          </div>
          {bankLoading ? <p role="status">Cargando banco…</p> : bankError ? <div role="alert"><p>{bankError}</p><button className="text-action" onClick={() => setBankRefresh((n) => n + 1)}>Reintentar</button></div>
            : matchingBank.length ? <ul className="bank-results">{matchingBank.map((entry) => <li key={entry.id} className="bank-entry">
              <div><p className="eyebrow">{entry.area} · {typeLabels[entry.type]}</p><h4>{entry.criterion}</h4><p>{entry.text}</p></div>
              <button className="text-action" disabled={busy || screening.questions.length >= 20 || screening.questions.some((q) => q.bankQuestionId === entry.id)}
                onClick={() => void addBank(entry.id)}>{screening.questions.some((q) => q.bankQuestionId === entry.id) ? 'Ya agregada' : '＋ Añadir pregunta'}</button>
            </li>)}</ul> : <p className="empty">No encontramos preguntas para este filtro. Podés crear una manualmente.</p>}
        </div> : <div className="question-layout">
          <aside className="question-index" aria-labelledby="question-list-title">
            <div className="panel-heading"><h3 id="question-list-title" tabIndex={-1}>Tus preguntas</h3><span>{screening.questions.length}/20</span></div>
            {screening.questions.length ? <><div className="field mobile-question-picker"><label htmlFor="question-picker">Ir a pregunta</label>
              <select id="question-picker" value={activeQuestion?.id ?? screening.questions[0].id}
                onChange={(event) => { setActiveQuestionId(event.target.value); setPendingEditAction(null); }}>
                {screening.questions.map((q, index) => <option key={q.id} value={q.id}>{index + 1}. {q.criterion?.trim() || q.text?.trim() || 'Nueva pregunta'}</option>)}
              </select></div><ol>{screening.questions.map((q, index) => <li key={q.id}>
              <button className={`question-item ${activeQuestion?.id === q.id ? 'selected' : ''}`} aria-current={activeQuestion?.id === q.id ? 'true' : undefined}
                onClick={() => { setActiveQuestionId(q.id); setPendingEditAction(null); }}>
                <span className="question-item-name">{index + 1}. {q.criterion?.trim() || q.text?.trim() || 'Nueva pregunta'}</span>
                <span className="question-item-meta">{typeLabels[q.type]} · {questionState(q)}</span>
              </button></li>)}</ol></> : <p className="field-hint">Todavía no hay preguntas.</p>}
            {!readOnly && <div className="add-controls">
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
                {!readOnly && <button id={`remove-${activeQuestion.id}`} className="text-action danger-action" disabled={busy} onClick={() => requestRemove(activeQuestion)}>Quitar pregunta</button>}</div>
              {pendingEditAction?.id === activeQuestion.id && <div className="confirm-inline" role="group" aria-label="Confirmar cambio que elimina configuración" onKeyDown={(event) => { if (event.key === 'Escape') cancelEditAction(); }}>
                <p>{pendingEditAction.kind === 'type' ? 'Cambiar el tipo restablecerá respuestas, puntajes, peso y excluyentes de esta pregunta.' : 'Quitar esta pregunta eliminará su contenido y reglas del borrador al guardar.'}</p>
                <div className="actions"><button ref={cancelActionRef} className="outline-button" onClick={cancelEditAction}>Seguir editando</button>
                  <button className="danger-button" onClick={confirmEditAction}>{pendingEditAction.kind === 'type' ? 'Confirmar cambio de tipo' : 'Confirmar eliminación'}</button></div>
              </div>}
              <fieldset className="question-fields" disabled={readOnly || busy}><legend className="sr-only">Editar pregunta {activeIndex + 1}</legend>
                <div className="field"><div className="field-label"><label htmlFor={`criterion-${activeQuestion.id}`}>Criterio</label>
                  <FieldHelp label="Ayuda sobre el criterio">Es el aspecto del puesto que querés observar con esta pregunta, por ejemplo comunicación o control de registros.</FieldHelp></div>
                  <input id={`criterion-${activeQuestion.id}`} maxLength={120} value={activeQuestion.criterion ?? ''} placeholder="Por ejemplo, Comunicación con clientes"
                    onChange={(e) => question(activeIndex, { ...activeQuestion, criterion: e.target.value })} /></div>
                <div className="field"><label htmlFor={`text-${activeQuestion.id}`}>Pregunta que verá el candidato</label>
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
                  <p className="field-hint">El banco aporta la pregunta; vos definís cómo evaluarla para este puesto. Por ejemplo, podés puntuar cada respuesta entre 0 y 100 y dar más peso a lo más importante.</p>
                  <div className="toggle-field"><label className="check"><input type="checkbox" checked={activeQuestion.required}
                    onChange={(e) => question(activeIndex, { ...activeQuestion, required: e.target.checked })} />Respuesta requerida</label>
                    <p className="field-hint">La persona debe responder para enviar; no significa que sea excluyente.</p></div>
                  {activeQuestion.type === 'text' ? <p className="field-hint">El texto libre aporta evidencia para revisión humana, sin puntaje ni exclusión automática.</p> : <>
                    <div className="toggle-field"><label className="check"><input type="checkbox" checked={activeQuestion.scored}
                      onChange={(e) => question(activeIndex, { ...activeQuestion, scored: e.target.checked, weight: undefined,
                        options: activeQuestion.options.map((o) => ({ ...o, score: undefined })) })} />Incluir en el puntaje</label>
                      {activeQuestion.scored && <div className="field compact-field"><div className="field-label"><label htmlFor={`weight-${activeQuestion.id}`}>Peso (1–5)</label>
                        <FieldHelp label="Ayuda sobre el peso">Un peso mayor hace que esta pregunta influya más en el puntaje total. Asigná también un valor a cada respuesta.</FieldHelp></div>
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
          <p>Publicar fija las preguntas y reglas para quienes reciban esta versión. Los cambios futuros se hacen en una nueva versión.</p></div>
        <div className="review-section"><div className="panel-heading"><h3>Datos del puesto</h3>
          {!readOnly && <button className="text-action" onClick={() => setStep('puesto')}>Editar puesto</button>}</div>
          <dl className="review-grid"><div><dt>Título</dt><dd>{screening.title || 'Pendiente'}</dd></div>
            <div><dt>Área</dt><dd>{screening.area || 'Pendiente'}</dd></div>
            <div><dt>Descripción</dt><dd>{screening.description || 'No indicada'}</dd></div></dl>
          <div className="field threshold-field"><div className="field-label"><label htmlFor="threshold">Umbral del puesto (0–100)</label>
            <FieldHelp label="Ayuda sobre el umbral">El puntaje es el promedio ponderado de las preguntas puntuables, no la suma de sus pesos. El umbral es el mínimo para cumplir los criterios numéricos; no reemplaza la revisión humana ni anula excluyentes.</FieldHelp></div>
            {readOnly ? <p className="static-value">{screening.threshold ?? 'No definido'}</p> :
              <input id="threshold" className="number-field" type="number" min={0} max={100} step={1} value={screening.threshold ?? ''}
                onChange={(e) => edit({ ...screening, threshold: number(e.target.value) })} />}
            <p className="field-hint">Los valores de respuesta van de 0 a 100. El peso (1–5) determina cuánto influye cada pregunta en el promedio.</p>
            {maximumScore !== undefined && <p className={screening.threshold !== undefined && maximumScore < screening.threshold ? 'review-warning' : 'field-hint'}>
              Máximo posible con las respuestas configuradas: {Number(maximumScore.toFixed(1))} / 100.</p>}
          </div>
        </div>
        <div className="review-section"><div className="panel-heading"><h3>Preguntas ({screening.questions.length})</h3>
          {!readOnly && <button className="text-action" onClick={() => { setStep('preguntas'); setBankOpen(false); }}>Editar preguntas</button>}</div>
          {screening.questions.length ? <ol className="review-questions">{screening.questions.map((q, index) => <li key={q.id}>
            <div><strong>{index + 1}. {q.criterion || 'Sin criterio'}</strong><p>{q.text || 'Sin texto'}</p>
              <p className="question-item-meta">{typeLabels[q.type]} · {q.required ? 'Requerida' : 'Opcional'} · {q.scored ? `Puntuable, peso ${q.weight ?? 'pendiente'}` : 'Sin puntaje'} · {q.exclusion ? 'Excluyente' : 'No excluyente'}{q.bankQuestionId ? ' · Del banco' : ''}</p>
              {q.options.length > 0 && <ul className="review-options">{q.options.map((option) => <li key={option.id}>
                <span>{option.label}</span><span>{q.scored ? `Valor: ${option.score ?? 'pendiente'}` : 'Sin puntaje'}{q.exclusion ? ` · ${q.exclusion.acceptedOptionIds.includes(option.id) ? 'Cumple requisito' : 'No cumple requisito'}` : ''}</span>
              </li>)}</ul>}</div>
            <button className="text-action" onClick={() => { setActiveQuestionId(q.id); setBankOpen(false); setStep('preguntas'); setFocusTarget(readOnly ? 'question-list-title' : `text-${q.id}`); }}>{readOnly ? 'Ver' : 'Editar'}</button>
          </li>)}</ol> : <p className="field-hint">Agregá al menos una pregunta; una debe ser puntuable para publicar.</p>}
        </div>
        {!readOnly && <div className="publish-panel"><h3>Confirmación de publicación</h3>
          {dirty && <p className="review-warning">{saveState === 'error' ? 'No se pudieron guardar los cambios. Reintentá el guardado.' : 'Esperá a que termine el guardado automático antes de publicar.'}</p>}
          {basicIssues.length > 0 && <div className="review-warning"><strong>Antes de publicar:</strong><ul>{basicIssues.map((issue) =>
            <li key={issue}><button className="text-action issue-action" onClick={() => jumpToIssue(issue)}>{issue} <span aria-hidden="true">↗</span></button></li>)}</ul></div>}
          <p className="field-hint">El servidor también revisa el contenido y las reglas de cada pregunta. Si algo falta, podrás ir al campo correspondiente.</p>
          <label className="check"><input type="checkbox" disabled={dirty || busy || basicIssues.length > 0} checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)} />Revisé preguntas, valores, pesos, excluyentes, obligatoriedad y umbral para este puesto.</label>
          <button className="publish-action" disabled={busy || dirty || !confirmed || basicIssues.length > 0} onClick={publish}>Publicar screening</button>
          {!dirty && !confirmed && basicIssues.length === 0 && <p className="field-hint">Confirmá la revisión para habilitar la publicación.</p>}
        </div>}
        {readOnly && <div className="stage-footer"><button className="outline-button" disabled={busy} onClick={copy}>Crear nueva versión editable</button></div>}
      </section>}
      </>}
      {readOnly && area === 'postulantes' && <Invitations screeningId={screening.id} closed={closed} session={session} onExpired={onExpired} />}
    </> : route ? <><h1 id="workspace-title">No pudimos abrir el screening</h1><button className="outline-button" onClick={() => go()}>Volver a mis screenings</button></> : <>
      <p className="eyebrow">Tu espacio de trabajo</p><h1 id="workspace-title">Tus screenings</h1><p className="description">Hola, {session.user.displayName}. Prepará las preguntas y criterios para cada puesto.</p>
      <button disabled={busy} onClick={create}>Crear screening</button>
      {rows.length ? <ul className="screening-list">{rows.map((row) => <li key={row.id}><div><h2><a href={hash(row.id)} onClick={(event) => { event.preventDefault(); go(row.id); }}>{row.title || 'Sin título'}</a></h2><p>{row.area || 'Área pendiente'}</p></div><span className={`badge screening-${row.status}`}>{row.status === 'draft' ? 'Borrador' : row.status === 'published' ? 'Publicado' : 'Cerrado'}</span></li>)}</ul> : <p className="empty">Todavía no tenés screenings. Creá el primero para comenzar.</p>}
      {rows.length === 100 && <p>Se muestran los primeros 100 screenings.</p>}
    </>}
  </section>;
}
