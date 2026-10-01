import { h2, h3, p, tip, ul, type Article } from "./blocks";

export const crateDigging: Article = {
  excerpt:
    "Your music selection is your signature. Here's where working DJs find tracks nobody else is playing, and how they organize them so the right song is always ready.",
  body: [
    p(
      "Two DJs with identical technical skills can sound completely different because of what they play. Great selection is what turns a technically good set into a memorable one, and it comes from one habit: digging for music regularly.",
    ),
    h2("Where to dig"),
    h3("Record stores"),
    p(
      "Independent record stores are still one of the best places to discover music. Tell the staff what you play and what you love. Their recommendations can open up entire genres.",
    ),
    h3("Online stores and Bandcamp"),
    p(
      "Digital stores built for DJs let you browse by genre, label and chart. Bandcamp is fantastic for independent artists and labels, and buying there often puts more money directly into the creators' pockets.",
    ),
    h3("Labels and artists"),
    p(
      "When you find a track you love, look up the label and the producer. Explore their back catalogs and the artists they support. One great release usually leads to ten more.",
    ),
    h3("DJ mixes and radio"),
    p(
      "Listen to mixes and radio shows from DJs you respect. Tracklist sites and a music recognition app will help you identify the gems. Notice not just the tracks, but how they're sequenced.",
    ),
    h3("Record pools"),
    p(
      "For open-format, mobile and wedding DJs, record pools provide licensed clean versions, intros and edits of popular songs. They're a huge time-saver.",
    ),
    tip(
      "Dig with intention",
      "Set aside a regular slot each week with a clear goal, like \"three new warm-up tracks\" or \"two vocal house records for Saturday\". Aimless scrolling can eat hours.",
    ),
    h2("Buy quality files"),
    p(
      "Use lossless files (WAV or AIFF) or high-quality 320 kbps MP3s. Low-quality rips sound noticeably worse on big sound systems, and buying your music supports the artists who make your sets possible.",
    ),
    h2("Organize as you go"),
    ul(
      "**Listen to every track in full** before it goes into a gig playlist.",
      "**Sort by role, not just genre:** warm-up, build, peak time, closing and secret weapons.",
      "**Tag energy and key** so you can find compatible tracks fast. Our [Camelot wheel guide](/blog/harmonic-mixing-camelot-wheel) explains key notation.",
      "**Set cue points** on the first downbeat, the drop and the outro while the track is fresh in your mind.",
    ),
    h2("Keep your crate alive"),
    p(
      "Revisit older music too. A track from ten years ago that nobody has heard in a while can be the biggest moment of your night. Digging isn't just about finding what's new. It's about finding what's right.",
    ),
  ],
};
