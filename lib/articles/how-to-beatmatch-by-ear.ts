import { h2, ol, p, tip, ul, type Article } from "./blocks";

export const howToBeatmatchByEar: Article = {
  excerpt:
    "Sync is handy, but beatmatching by ear is the skill that makes you trust your own set. Here's the step-by-step method our students use to lock two tracks together without looking at the screen.",
  body: [
    p(
      "Sync buttons are brilliant, and plenty of great DJs use them. But learning to beatmatch by ear teaches you what's actually happening between two tracks, and that's exactly what saves you when a beat grid is wrong, a track drifts, or you're playing on unfamiliar gear. The good news: it's a skill, not a talent. With the right method and 15 focused minutes a day, most of our students can hold a clean blend within a few weeks.",
    ),
    h2("Set yourself up to succeed"),
    ul(
      "**Pick two tracks with steady, simple kick drums.** House or techno between 120 and 126 BPM is ideal. Avoid live drums, swing and tempo changes for now.",
      "**Hide the BPM display and waveforms** if your software allows it, or cover them with a sticky note. If your eyes can see the answer, your ears won't do the work.",
      "**Turn Sync and Quantize off.**",
      "**Keep the volume sensible.** Beatmatching is about detail, not loudness. You'll hear the kicks more clearly at a comfortable level.",
    ),
    h2("Step 1: Find the one"),
    p(
      "Let track A play through the speakers. In your headphones, find the first beat of a bar in track B, known as the **downbeat** or \"the one\". In most dance music it's the first kick after a clear change: the start of a phrase, or the moment the bass or hi-hats come in. Set a cue point exactly on that kick.",
    ),
    tip(
      "Count out loud",
      "Count along with the music: \"one, two, three, four.\" The one usually feels heavier. If you're unsure, wait for a big change in the track. Those almost always land on a one.",
    ),
    h2("Step 2: Start the new track on the one"),
    p(
      "Count the bars of track A. On its next downbeat, release track B from your cue point. The kicks won't line up perfectly yet, and that's expected. What you're listening for is which track is **faster**.",
    ),
    h2("Step 3: Match the tempo with the pitch fader"),
    p("Listen to both kicks together in your headphones. If they drift apart, one track is faster. Here's how to tell which:"),
    ul(
      "If the **incoming track's kick lands first** (you'll hear a galloping double kick), the incoming track is ahead. Slow it down slightly.",
      "If the **playing track's kick lands first**, the incoming track is behind. Speed it up slightly.",
    ),
    p(
      "Move the pitch fader in small steps, not big jumps, and give each change a few bars before you judge it. You're done when the kicks stay locked together for 16 bars or more.",
    ),
    h2("Step 4: Nudge, don't wrestle"),
    p(
      "Even with matched tempos, the beats can sit slightly out of phase. Use the outer edge of the jog wheel (or the platter edge on turntables) to nudge the incoming track forward or back with short, gentle touches. If you find yourself nudging constantly, the tempo still isn't matched, so go back to the pitch fader.",
    ),
    h2("Step 5: Bring it into the mix"),
    p(
      "Once the kicks sit together in your headphones, start bringing track B in on the next phrase. Keep its bass cut at first (our [EQ Mixing 101 guide](/blog/eq-mixing-101) explains why), and keep listening. Tracks can drift over a long blend, so small pitch corrections mid-mix are completely normal.",
    ),
    h2("Common mistakes to avoid"),
    ul(
      "**Starting the new track at a random point.** Always release it on a one, or you'll be fixing tempo and phrasing at the same time.",
      "**Making big pitch adjustments.** Large jumps overshoot. Think tiny moves and patience.",
      "**Wearing both sides of the headphones.** Try one ear on the headphones and one on the speakers, so you hear both tracks the way the crowd does.",
      "**Practicing with too many tracks.** Use the same two tracks for a week. Familiarity lets you focus on the skill.",
    ),
    h2("A simple practice routine"),
    ol(
      "Mix the same two tracks back and forth for 10 minutes.",
      "Swap one of them for a track at a slightly different tempo, for example 122 into 125 BPM.",
      "Record a two-track blend and listen back the next day. Your ears catch more when your hands aren't busy.",
    ),
    p(
      "Stick with it. The first few days can feel impossible. Then one day you'll hear the gallop before you've even thought about it, and that's the moment beatmatching becomes yours.",
    ),
  ],
};
