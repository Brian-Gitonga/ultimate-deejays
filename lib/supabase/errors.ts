/*
 * Turns a Supabase error into a message for the person using the site. In
 * development the raw code and message are appended, so problems can be
 * matched against the supabase/diagnostics queries without digging in logs.
 */
export function withDetail(message: string, error: { code?: string; message?: string } | null | undefined) {
  if (!error || process.env.NODE_ENV === "production") return message;
  return `${message} [${error.code ?? "error"}: ${error.message ?? "no message"}]`;
}
