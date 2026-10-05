/* Mixes sent for feedback (mix_submissions): Studio → Mix feedback and /account/mixes. */

export type MixSubmission = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  plan: string;
  title: string;
  link: string;
  courseTitle: string | null;
  notes: string;
  status: "pending" | "reviewed";
  feedback: string;
  reviewedAt: string | null;
  isDemo: boolean;
  createdAt: string;
};

/** How many mixes each plan can send for feedback (null = unlimited). */
export const mixAllowance = { "warm-up": 0, resident: 2, headliner: null } as const;

/** "soundcloud.com/x" → "SoundCloud", for labels. */
export function mixHost(link: string) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    if (host.includes("soundcloud")) return "SoundCloud";
    if (host.includes("mixcloud")) return "Mixcloud";
    if (host.includes("youtu")) return "YouTube";
    if (host.includes("drive.google")) return "Google Drive";
    if (host.includes("dropbox")) return "Dropbox";
    return host;
  } catch {
    return "Link";
  }
}
