import { h2, h3, p, tip, ul, type Article } from "./blocks";

export const protectYourHearing: Article = {
  excerpt:
    "Your ears are your most important piece of DJ gear, and hearing damage is permanent. Here's how loud is too loud, and the simple habits that protect your career.",
  body: [
    p(
      "You can replace a broken controller or a cracked laptop screen. Ears are different: noise-induced hearing loss and tinnitus (ringing in the ears) are permanent. The good news is that they're also largely preventable, and protecting your hearing won't make your sets any less exciting.",
    ),
    h2("How loud is too loud?"),
    p(
      "Sound is measured in decibels (dB) on a logarithmic scale: every 3 dB increase roughly doubles the sound energy. The US National Institute for Occupational Safety and Health (NIOSH) recommends limiting exposure to 85 dBA over an eight-hour day, and halving the safe time for every 3 dB above that:",
    ),
    ul(
      "**85 dBA:** about 8 hours",
      "**91 dBA:** about 2 hours",
      "**97 dBA:** about 30 minutes",
      "**100 dBA:** about 15 minutes",
    ),
    p(
      "Club dance floors and DJ booths can easily go past 100 dB, so a single long set without protection can take you well beyond those limits.",
    ),
    h2("Warning signs"),
    ul(
      "Ringing, buzzing or hissing in your ears after a gig.",
      "Sounds seeming muffled or dull the next morning.",
      "Struggling to follow conversations in noisy places.",
    ),
    p(
      "Temporary symptoms are a sign your ears were overexposed. Repeated overexposure can cause lasting damage.",
    ),
    h2("Habits that protect your ears"),
    h3("Wear earplugs designed for music"),
    p(
      "Musician's earplugs reduce volume evenly across frequencies, so music still sounds natural, just quieter. Custom-molded plugs from an audiologist are the gold standard for working DJs, but good universal-fit versions are a great start.",
    ),
    h3("Control your booth monitor"),
    p(
      "Many DJs push the booth monitor louder and louder as the night goes on. Set it at the start of your set to a level that's clear but comfortable, and resist the urge to creep it up.",
    ),
    h3("Be smart with headphones"),
    p(
      "Keep your headphone volume as low as you can while still cueing clearly. Cue with one ear and keep the other on the booth monitor, and take your headphones off between transitions.",
    ),
    h3("Give your ears a rest"),
    p(
      "During long events, take breaks away from the loudest areas, and allow some quiet recovery time after a loud night.",
    ),
    tip(
      "Get tested",
      "Book a baseline hearing test with an audiologist, then check in regularly so you can catch changes early. If you notice sudden hearing loss or ringing that doesn't go away, see a professional promptly.",
    ),
    p(
      "Protecting your hearing is how you make sure you'll still be enjoying music, and playing it, decades from now.",
    ),
  ],
};
