import { h2, p, tip, ul, type Article } from "./blocks";

export const djFriendlyIntrosAndOutros: Article = {
  excerpt:
    "If you produce your own music, make it easy for DJs (including you) to play it. Here's how to structure intros and outros that mix smoothly on any setup.",
  body: [
    p(
      "A great track that's hard to mix often gets skipped. Whether you're making originals, remixes or edits, building DJ-friendly intros and outros is one of the simplest ways to get your music played, both by other DJs and in your own sets.",
    ),
    h2("Why DJs need space"),
    p(
      "When a DJ brings your track in, they need a section to beatmatch and blend while the previous track is still playing. If your song opens with a full bassline, chords and vocals on the first beat, there's nothing to blend, just a clash. The same goes for the ending: an abrupt stop leaves no room to mix out.",
    ),
    h2("Building the intro"),
    ul(
      "**Start on the downbeat.** Put the first kick right at the start of the file with no silence before it, so DJ software sets the beat grid correctly and cue points are instant.",
      "**Keep it rhythmic.** 16 or 32 bars of drums and percussion is standard, and enough for a comfortable blend.",
      "**Add elements gradually.** Introduce hi-hats, percussion and subtle textures every 8 bars, but hold the bassline and main hook back until the intro ends.",
      "**Keep a steady tempo.** Avoid tempo changes or loose, swung drums in the intro.",
    ),
    h2("Building the outro"),
    ul(
      "**Mirror the intro.** Strip the track back to drums and percussion for the last 16 to 32 bars.",
      "**Remove the bass and vocals first,** so the next track can take over the low end cleanly.",
      "**Avoid long reverb tails and fade-outs** over the final bars. A clean, rhythmic ending is much easier to mix out of.",
    ),
    tip(
      "Think in phrases",
      "Build the whole track in 8-bar blocks, with major changes on the first beat of a 16- or 32-bar phrase. DJs mix phrase to phrase, and a predictable structure makes your track feel right in a mix.",
    ),
    h2("Make an extended mix and a radio edit"),
    p(
      "Many producers release two versions: an **extended mix** with full DJ intros and outros, and a shorter **radio edit** for streaming playlists. If you only make one version, make it the extended mix.",
    ),
    h2("Export like a pro"),
    ul(
      "Export at a steady tempo, with no fades at the start or end.",
      "Use a lossless format (WAV or AIFF), at 24-bit where possible.",
      "Name files clearly and tag the BPM and key so DJs can file them fast.",
    ),
    p(
      "For a hands-on walkthrough of rearranging a track, see our guide to [making your first DJ edit in Ableton Live](/blog/make-your-first-edit-in-ableton). Get these details right and your music will slide into sets effortlessly, which is exactly how it ends up played in clubs.",
    ),
  ],
};
