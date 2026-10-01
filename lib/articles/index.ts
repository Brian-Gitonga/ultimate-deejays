import { amapianoTransitions } from "./amapiano-transitions";
import type { Article, Block } from "./blocks";
import { choosingYourFirstDjController } from "./choosing-your-first-dj-controller";
import { crateDigging } from "./crate-digging";
import { djFriendlyIntrosAndOutros } from "./dj-friendly-intros-and-outros";
import { djPressKit } from "./dj-press-kit";
import { eqMixing101 } from "./eq-mixing-101";
import { harmonicMixingCamelotWheel } from "./harmonic-mixing-camelot-wheel";
import { homeDjStudioOnABudget } from "./home-dj-studio-on-a-budget";
import { howAmapianoWentGlobal } from "./how-amapiano-went-global";
import { howToBeatmatchByEar } from "./how-to-beatmatch-by-ear";
import { landYourFirstClubBooking } from "./land-your-first-club-booking";
import { makeYourFirstEditInAbleton } from "./make-your-first-edit-in-ableton";
import { practiceIn20MinutesADay } from "./practice-in-20-minutes-a-day";
import { protectYourHearing } from "./protect-your-hearing";
import { seratoVsRekordbox } from "./serato-vs-rekordbox";
import { weddingDjChecklist } from "./wedding-dj-checklist";

export type { Article, Block } from "./blocks";

/* Server-only: article bodies are large, so browser code should never import this. */
export const articles = {
  "how-to-beatmatch-by-ear": howToBeatmatchByEar,
  "serato-vs-rekordbox": seratoVsRekordbox,
  "amapiano-transitions": amapianoTransitions,
  "land-your-first-club-booking": landYourFirstClubBooking,
  "eq-mixing-101": eqMixing101,
  "home-dj-studio-on-a-budget": homeDjStudioOnABudget,
  "practice-in-20-minutes-a-day": practiceIn20MinutesADay,
  "make-your-first-edit-in-ableton": makeYourFirstEditInAbleton,
  "how-amapiano-went-global": howAmapianoWentGlobal,
  "dj-press-kit": djPressKit,
  "harmonic-mixing-camelot-wheel": harmonicMixingCamelotWheel,
  "choosing-your-first-dj-controller": choosingYourFirstDjController,
  "wedding-dj-checklist": weddingDjChecklist,
  "crate-digging": crateDigging,
  "dj-friendly-intros-and-outros": djFriendlyIntrosAndOutros,
  "protect-your-hearing": protectYourHearing,
} satisfies Record<string, Article>;

export type ArticleSlug = keyof typeof articles;

// Drops the inline marks: "**bold**" -> "bold", "[text](/url)" -> "text".
export const plainText = (text: string) => text.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const blockText = (block: Block) =>
  "items" in block ? block.items.join(" ") : `${"title" in block ? `${block.title} ` : ""}${block.text}`;

const WORDS_PER_MINUTE = 225;

export function readingMinutes(article: Article) {
  const words = article.body.reduce((total, block) => total + plainText(blockText(block)).split(/\s+/).length, 0);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Section headings, for the "On this page" list */
export const tableOfContents = (article: Article) =>
  article.body.flatMap((block) => (block.type === "h2" ? [{ id: headingId(block.text), text: block.text }] : []));
