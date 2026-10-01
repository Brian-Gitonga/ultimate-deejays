import { h2, ol, p, tip, ul, type Article } from "./blocks";

export const eqMixing101: Article = {
  excerpt:
    "Muddy, messy transitions are almost always an EQ problem. Learn how to set your levels, swap basslines cleanly and use the mids and highs to make two tracks sound like one.",
  body: [
    p(
      "If your transitions sound busy or muddy even when the beats are perfectly matched, the problem usually isn't your beatmatching. It's your EQ. Two full tracks playing at once contain twice the bass, twice the vocals and twice the hi-hats. Your job is to make space so they sound like one piece of music.",
    ),
    h2("First, get your levels right"),
    p(
      "Before touching the EQ, set each channel's **gain** (sometimes called trim). Tracks are mastered at different loudness, so match them using the channel meters: aim for both channels peaking at a similar level, in the upper green or amber, never sitting in the red. Then keep both channel faders at the same position. Good gain staging makes every other EQ move predictable.",
    ),
    h2("How a three-band EQ works"),
    ul(
      "**Low:** kick drums and basslines, the weight of the track.",
      "**Mid:** vocals, synths, chords and snares, the character of the track.",
      "**High:** hi-hats, cymbals and air, the energy and sparkle.",
    ),
    p(
      "Most DJ mixers let you cut each band much further than you can boost it. That's a hint: **mixing is mostly about cutting, not boosting.**",
    ),
    h2("The bass swap: your most important move"),
    p("Two basslines playing together are the number one cause of muddy mixes. Here's the classic technique:"),
    ol(
      "Bring the incoming track in with its **low EQ fully cut**.",
      "Blend in its mids and highs as the mix builds.",
      "On a phrase change, **swap the lows**: cut the outgoing bass as you bring the incoming bass up, ideally in one motion that lands on the downbeat.",
    ),
    p(
      "Timing matters more than speed. A swap on the first beat of a new phrase sounds intentional. A swap in the middle of a bar sounds like a mistake.",
    ),
    tip(
      "Practice drill",
      "Blend two tracks and do nothing but bass swaps for ten minutes, swapping back and forth every 16 bars. Once it's automatic, your mixes will instantly sound cleaner.",
    ),
    h2("Taming the mids"),
    p(
      "When both tracks have vocals or busy synths, turn down the mids on the track that should sit in the background. It's also a smart way to hide a key clash for a few bars while you move to the next track.",
    ),
    h2("Using the highs for energy"),
    p(
      "Bringing in the incoming track's hi-hats slowly creates anticipation: the crowd feels something building before they can hear what it is. Cutting the highs on the outgoing track as you finish the blend lets it fade gently into the background.",
    ),
    h2("EQ versus filter"),
    p(
      "A filter sweeps away everything above or below a moving point, which is great for dramatic builds and exits. EQ is subtler and more precise. Use EQ for everyday blending, and save filters for moments you want the crowd to notice.",
    ),
    h2("Common EQ mistakes"),
    ul(
      "**Boosting to make a track louder.** Use the gain or fader instead. Boosting pushes you into distortion.",
      "**Leaving the EQs wherever the last blend left them.** Return to neutral once each transition is finished.",
      "**Mixing only with the channel faders.** Volume fades alone leave basslines and vocals fighting in the middle of the blend.",
      "**Judging your EQ in headphones only.** Check on speakers, ideally at the volume a crowd would hear.",
    ),
    p(
      "Get these basics right and your transitions will start to sound like one long, continuous piece of music, which is exactly the point. If you're still working on locking the beats together, start with our guide to [beatmatching by ear](/blog/how-to-beatmatch-by-ear).",
    ),
  ],
};
