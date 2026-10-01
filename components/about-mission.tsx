import Image from "next/image";

const photos = [
  { src: "/images/about/djs-sharing-decks.jpg", alt: "Two DJs mixing together on a shared controller" },
  { src: "/images/about/dj-crew-rooftop.jpg", alt: "A crew of DJs smiling behind the decks at a rooftop party" },
];

export function AboutMission() {
  return (
    <section aria-label="Our mission and values" className="site-container py-16 lg:py-24">
      <div className="grid grid-cols-2 items-center gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr_1.45fr] lg:gap-8">
        {photos.map((photo) => (
          <div key={photo.src} className="reveal relative aspect-[331/355] overflow-hidden rounded-2xl bg-muted">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1280px) 330px, (min-width: 1024px) 27vw, 48vw"
              className="object-cover"
            />
          </div>
        ))}

        <div className="reveal col-span-2 mt-6 lg:col-span-1 lg:mt-0 lg:pl-4">
          <h2 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
            Our Mission
          </h2>
          <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground sm:text-[1.0625rem]">
            To put world-class DJ training within reach of anyone who loves music. We take the skills working DJs spent
            years learning by trial and error (beatmatching, phrasing, EQ, reading a room) and turn them into clear,
            step-by-step lessons you can practice anywhere, on whatever gear you own.
          </p>

          <h2 className="mt-8 text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
            Our Values
          </h2>
          <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground sm:text-[1.0625rem]">
            Music comes first, so every lesson is built around real sets, real gear and real crowds, never theory for its
            own sake. We celebrate every sound, from Amapiano to techno to a packed wedding floor. We give honest feedback
            that moves you forward, and we keep our community a place where first-timers feel as welcome as headliners.
          </p>
        </div>
      </div>
    </section>
  );
}
