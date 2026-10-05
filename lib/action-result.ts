/*
 * What every studio Server Action returns, so the browser can show the saved
 * record or a readable error. Shared by server and client code.
 */
export type ActionResult<T = null> = { ok: true; record: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
