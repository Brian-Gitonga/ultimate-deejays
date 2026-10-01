import { h2, ol, p, tip, ul, type Article } from "./blocks";

export const harmonicMixingCamelotWheel: Article = {
  excerpt:
    "Some blends sound magical, others clash no matter how perfect the beatmatch. The difference is often musical key, and the Camelot wheel makes harmonic mixing simple.",
  body: [
    p(
      "You've matched the beats perfectly, the EQ is clean, and yet the blend sounds off. Sour, even. The likely culprit is **key**. Every track is written in a musical key, and some keys sound great together while others clash. Harmonic mixing means choosing combinations that work, and the Camelot wheel makes it easy even if you've never studied music theory.",
    ),
    h2("What is the Camelot wheel?"),
    p(
      "The Camelot wheel maps all 24 musical keys to simple codes: a number from 1 to 12 and a letter. **A** means a minor key and **B** means a major key. For example, A minor is 8A and C major is 8B. Popularized by the harmonic mixing tool Mixed In Key, this notation is now supported by most DJ software, which can analyze your tracks and display their keys this way.",
    ),
    h2("The three safe moves"),
    p("From any track, these moves almost always sound good:"),
    ul(
      "**Same code:** 8A to 8A. Both tracks share a key, so this is the smoothest possible blend.",
      "**One step around the wheel:** 8A to 7A or 9A. These are closely related keys that share most of their notes.",
      "**Switch the letter:** 8A to 8B. This is the relative major or minor: the same notes with a different mood, perfect for lifting or darkening the feel of your set.",
    ),
    tip(
      "The quick rule",
      "Stay on the same number, move one step up or down, or swap A and B. Master those three moves and you'll avoid most key clashes.",
    ),
    h2("Adding energy"),
    p(
      "Moving **one step clockwise**, for example 8A to 9A, tends to feel like a gentle lift. Some DJs also jump **two steps clockwise** for a deliberate energy boost, but it's riskier. Keep those blends short, and cut rather than overlap for long.",
    ),
    h2("Watch out for tempo changes"),
    p(
      "When you speed up or slow down a track without key lock (sometimes called master tempo), its pitch changes too. A tempo change of around 6% moves a track by roughly one semitone, which is enough to change its key completely. Turn key lock on for bigger tempo changes, though very large changes can add audible artifacts.",
    ),
    h2("Key isn't everything"),
    p(
      "Harmonic mixing is a tool, not a rule. Drum-led tracks with little melody often mix fine regardless of key, and a clash can be hidden for a few bars by cutting the mids (see [EQ Mixing 101](/blog/eq-mixing-101)). Energy, groove and track selection always come first. Key simply helps the magic moments happen more often.",
    ),
    h2("Try this today"),
    ol(
      "Analyze your practice playlist and set your software to display keys.",
      "Pick one track and find two others that are a safe move away.",
      "Blend each pair for 32 bars and listen to how the melodies sit together.",
    ),
    p("Once you hear the difference, you won't stop hearing it."),
  ],
};
