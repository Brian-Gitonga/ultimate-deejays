import { h2, ol, p, tip, ul, type Article } from "./blocks";

export const practiceIn20MinutesADay: Article = {
  excerpt:
    "Short on time? Twenty minutes of focused practice beats a two-hour jam with no plan. Here's the routine our instructors give students with busy lives.",
  body: [
    p(
      "Most people think they need hours to get better at DJing. In reality, the students who improve fastest aren't the ones with the most free time. They're the ones who practice with a plan. Twenty focused minutes, five days a week, adds up to more than seven hours of deliberate practice a month.",
    ),
    h2("The 20-minute session"),
    ol(
      "**Warm up (2 minutes).** Play one track, check your headphone and speaker levels, and start your recording.",
      "**Focused drill (10 minutes).** Work on one skill only: bass swaps, beatmatching by ear, a scratch pattern or a specific transition.",
      "**Record a blend (5 minutes).** Mix two tracks from start to finish as if a crowd were listening.",
      "**Review (3 minutes).** Listen back and write one sentence about what to fix tomorrow.",
    ),
    h2("Rotate a weekly theme"),
    p("Give each week a focus so your skills build in layers:"),
    ul(
      "**Week 1:** beatmatching and phrasing. Our guide to [beatmatching by ear](/blog/how-to-beatmatch-by-ear) is a good place to start.",
      "**Week 2:** EQ and the bass swap, covered in [EQ Mixing 101](/blog/eq-mixing-101).",
      "**Week 3:** track selection and energy, building a mini set of five tracks.",
      "**Week 4:** creative transitions with loops, echo outs and filters.",
    ),
    tip(
      "Keep a practice log",
      "A notes app is enough: the date, the drill and one sentence of feedback. After a month you'll spot patterns in your mistakes, and have proof of how far you've come.",
    ),
    h2("Why short sessions work"),
    p(
      "Motor skills settle in between sessions, especially after a night's sleep, which is why a little practice every day beats one marathon weekend. Short sessions also keep your focus sharp: after 20 minutes of concentrated listening, most people start coasting anyway.",
    ),
    h2("Make it easy to start"),
    ul(
      "**Leave your setup ready to go.** If you have to plug in cables first, you'll skip days.",
      "**Prepare a practice playlist** of 20 to 30 tracks you know well, so you're not wasting time digging.",
      "**Practice at the same time each day.** Habit beats motivation.",
    ),
    h2("When you have more time"),
    p(
      "On days with an extra hour, record a full 30 to 45 minute set and treat it like a real gig, with a planned opening, build and ending. Then go back to your 20-minute routine to fix the weak spots you hear.",
    ),
    p("Consistency is the secret. Twenty minutes today is worth more than two hours someday."),
  ],
};
