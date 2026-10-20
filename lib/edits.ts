/*
 * Template edits (migration 016). A store template can offer edits: the
 * team sets up its request form in Studio → Store, members fill it in from
 * the template's page, and the team delivers the edited files to the
 * member's account (Account → My edits). The team lets them know itself, on
 * WhatsApp or by SMS, from the number on the request.
 */

// ── The request form ───────────────────────────────────────────────────────

import type { PlanSlug } from "./plan-tiers";

export type EditFieldType = "text" | "textarea" | "url" | "color" | "select" | "file";

export type EditField = {
  /** Stable key for the answer, e.g. "name" */
  id: string;
  label: string;
  type: EditFieldType;
  required: boolean;
  placeholder: string;
  /** A short line under the field */
  help: string;
  /** Choices, for "select" */
  options: string[];
};

export const editFieldTypes: { type: EditFieldType; name: string }[] = [
  { type: "text", name: "Short text" },
  { type: "textarea", name: "Long text" },
  { type: "url", name: "Link" },
  { type: "color", name: "Colour" },
  { type: "select", name: "Choice" },
  { type: "file", name: "File upload" },
];

export const MAX_FIELDS = 30;

const field = (f: Partial<EditField> & Pick<EditField, "id" | "label" | "type">): EditField => ({ required: false, placeholder: "", help: "", options: [], ...f });

/* Ready-made forms the studio can start from. */
export const editFormPresets: { key: string; name: string; hint: string; fields: EditField[] }[] = [
  {
    key: "lower-third",
    name: "Lower third",
    hint: "Name, second line, social handles and a colour",
    fields: [
      field({ id: "name", label: "Name on screen", type: "text", required: true, placeholder: "e.g. DJ Kaytee" }),
      field({ id: "title", label: "Second line", type: "text", placeholder: "e.g. Resident DJ · Saturday sessions" }),
      field({ id: "facebook", label: "Facebook", type: "text", placeholder: "Page name or link" }),
      field({ id: "instagram", label: "Instagram", type: "text", placeholder: "@yourname" }),
      field({ id: "tiktok", label: "TikTok", type: "text", placeholder: "@yourname" }),
      field({ id: "youtube", label: "YouTube", type: "text", placeholder: "Channel name or link" }),
      field({ id: "x", label: "X (Twitter)", type: "text", placeholder: "@yourname" }),
      field({ id: "color", label: "Brand colour", type: "color", help: "We'll match the accent to it." }),
    ],
  },
  {
    key: "basic",
    name: "Basic",
    hint: "The text to show, a colour and a logo",
    fields: [
      field({ id: "text", label: "Text to show", type: "textarea", required: true, placeholder: "The words you want on it, one line per line on screen" }),
      field({ id: "color", label: "Main colour", type: "color" }),
      field({ id: "logo", label: "Your logo", type: "file", help: "A PNG with a transparent background works best." }),
    ],
  },
];

/** "Brand colour" → "brand-colour", made unique among `taken`. */
export function fieldId(label: string, taken: string[]) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "field";
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

/** The form as saved on a template; anything malformed is dropped. */
export function parseEditForm(value: unknown): EditField[] {
  if (!Array.isArray(value)) return [];
  const types = new Set(editFieldTypes.map((t) => t.type));
  return value
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .filter((f) => typeof f.id === "string" && typeof f.label === "string" && types.has(f.type as EditFieldType))
    .map((f) =>
      field({
        id: String(f.id),
        label: String(f.label),
        type: f.type as EditFieldType,
        required: f.required === true,
        placeholder: typeof f.placeholder === "string" ? f.placeholder : "",
        help: typeof f.help === "string" ? f.help : "",
        options: Array.isArray(f.options) ? f.options.filter((o): o is string => typeof o === "string") : [],
      }),
    );
}

// ── Answers ────────────────────────────────────────────────────────────────

/** One answer as saved on the request. For files, `value` is the path in the edits bucket and `name` the file's name. */
export type EditAnswer = { id: string; label: string; type: EditFieldType; value: string; name?: string };

export const FILE_LIMIT_BYTES = 10 * 1024 * 1024;
export const FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf", "application/zip"];

const COLOR = /^#[0-9a-f]{6}$/i;
const URL_LIKE = /^https?:\/\/\S+\.\S+/i;

/**
 * Checks the answers against the form: required fields filled, links,
 * colours and choices valid, and uploads in the member's own folder. Returns
 * the answers to save (empty optional ones left out) or the problems by field.
 */
export function checkAnswers(
  form: EditField[],
  values: Record<string, { value: string; name?: string }>,
  userId: string,
): { ok: true; answers: EditAnswer[] } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const answers: EditAnswer[] = [];
  for (const f of form) {
    const raw = values[f.id] ?? { value: "" };
    const value = raw.value.trim();
    if (!value) {
      if (f.required) errors[f.id] = f.type === "file" ? "Attach a file." : f.type === "select" ? "Pick one." : "Fill this in.";
      continue;
    }
    const max = f.type === "textarea" ? 2000 : 300;
    if (value.length > max) errors[f.id] = `Keep it under ${max.toLocaleString("en-US")} characters.`;
    else if (f.type === "url" && !URL_LIKE.test(value)) errors[f.id] = "Paste the full link, starting with https://.";
    else if (f.type === "color" && !COLOR.test(value)) errors[f.id] = "Pick a colour.";
    else if (f.type === "select" && !f.options.includes(value)) errors[f.id] = "Pick one of the choices.";
    else if (f.type === "file" && !value.startsWith(`uploads/${userId}/`)) errors[f.id] = "Upload the file again.";
    if (errors[f.id]) continue;
    answers.push({ id: f.id, label: f.label, type: f.type, value, ...(f.type === "file" && raw.name ? { name: raw.name.slice(0, 200) } : {}) });
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers };
}

/** The answers as saved on a request (malformed ones dropped). */
export function parseAnswers(value: unknown): EditAnswer[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object" && typeof a.id === "string" && typeof a.value === "string")
    .map((a) => ({
      id: String(a.id),
      label: typeof a.label === "string" ? a.label : String(a.id),
      type: (editFieldTypes.some((t) => t.type === a.type) ? a.type : "text") as EditFieldType,
      value: String(a.value),
      ...(typeof a.name === "string" ? { name: a.name } : {}),
    }));
}

// ── Requests ───────────────────────────────────────────────────────────────

export type EditStatus = "submitted" | "in_progress" | "needs_info" | "delivered" | "declined" | "cancelled";

/** What the member sees. */
export const memberStatusLabel: Record<EditStatus, string> = {
  submitted: "Waiting for the team",
  in_progress: "Being edited",
  needs_info: "Question for you",
  delivered: "Ready",
  declined: "Declined",
  cancelled: "Cancelled",
};

/** What the team sees. */
export const studioStatusLabel: Record<EditStatus, string> = {
  submitted: "New",
  in_progress: "In progress",
  needs_info: "Waiting for member",
  delivered: "Delivered",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const openStatuses: EditStatus[] = ["submitted", "in_progress", "needs_info"];

export type EditFile = {
  id: string;
  name: string;
  /** storage = in the private edits bucket; link = hosted elsewhere */
  kind: "storage" | "link";
  path: string;
  url: string;
  size: number;
  mime: string;
};

export function parseFiles(value: unknown): EditFile[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object" && typeof f.id === "string" && typeof f.name === "string")
    .map((f) => ({
      id: String(f.id),
      name: String(f.name),
      kind: f.kind === "link" ? "link" : "storage",
      path: typeof f.path === "string" ? f.path : "",
      url: typeof f.url === "string" ? f.url : "",
      size: typeof f.size === "number" ? f.size : 0,
      mime: typeof f.mime === "string" ? f.mime : "",
    }));
}

export type EditMessage = { id: string; author: "member" | "team"; body: string; createdAt: string };

export type EditRequest = {
  id: string;
  number: number;
  resource: { id: string | null; slug: string; title: string; thumbnail: string; lowerThird: boolean };
  answers: EditAnswer[];
  notes: string;
  phone: string;
  textMe: boolean;
  status: EditStatus;
  files: EditFile[];
  deliveredAt: string | null;
  seenAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: EditMessage[];
};

export type StudioEditRequest = EditRequest & {
  member: { id: string; name: string; email: string; plan: PlanSlug };
  adminNotes: string;
  isDemo: boolean;
};

/** Where things go in the edits bucket. */
const safe = (name: string) => name.replace(/[^\w.-]+/g, "-").replace(/^-+/, "").slice(-120) || "file";
export const uploadPathFor = (userId: string, fileName: string) => `uploads/${userId}/${crypto.randomUUID().slice(0, 8)}-${safe(fileName)}`;
export const deliveredPathFor = (requestId: string, fileName: string) => `delivered/${requestId}/${crypto.randomUUID().slice(0, 8)}-${safe(fileName)}`;

/** Link to a file of a request (an upload or a delivered file), signed after checking who's asking. */
export const editFileHref = (requestId: string, path: string) => `/api/edits/file?${new URLSearchParams({ request: requestId, path })}`;

/**
 * What the team sends a member about their request, by WhatsApp or SMS from
 * the studio: ready, a question, or just a hello while it's in the works.
 */
export function memberMessage(r: Pick<EditRequest, "id" | "status" | "resource">, firstName: string, siteUrl: string, siteName: string) {
  const hi = firstName ? `Hi ${firstName}` : "Hi";
  const title = r.resource.title || "your template";
  const link = `${siteUrl}/account/edits/${r.id}`;
  if (r.status === "delivered") return `${hi}, your edit of "${title}" is ready. Download it from your ${siteName} account: ${link}`;
  if (r.status === "needs_info") return `${hi}, we have a quick question about your edit of "${title}". You can answer here: ${link}`;
  return `${hi}, this is ${siteName} about your edit of "${title}". `;
}

/** wa.me and sms: want the number without spaces; wa.me also without the +. */
export const whatsappHref = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
export const smsHref = (phone: string, text: string) => `sms:${phone}?body=${encodeURIComponent(text)}`;
