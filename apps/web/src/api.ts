export type Session = { user: { id: string; email: string; displayName: string }; csrfToken: string; expiresAt: string };
export class ApiError extends Error {
  constructor(message: string, public status: number, public issues: string[] = []) { super(message); }
}
export async function api<T>(path: string, session: Session, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`/api${path}`, { method, cache: 'no-store', signal: controller.signal,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(method === 'GET' ? {} : { 'X-CSRF-Token': session.csrfToken }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(typeof data?.message === 'string' ? data.message : 'No pudimos completar la solicitud.', response.status,
      Array.isArray(data?.issues) ? data.issues.filter((item: unknown) => typeof item === 'string') : []);
    if (data === null) throw new ApiError('No pudimos confirmar la respuesta.', 0);
    return data as T;
  } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError('No pudimos conectar. Volvé a intentar.', 0); }
  finally { window.clearTimeout(timeout); }
}
