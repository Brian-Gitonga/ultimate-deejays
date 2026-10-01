import Image from "next/image";
import Link from "next/link";
import { FaqAccordion, type FaqItem } from "./faq-accordion";
import { SectionHeading } from "./section-heading";

const faqs: FaqItem[] = [
  {
    question: "Do I need any DJ experience to join?",
    answer:
      "Not at all. Our beginner path starts from the very basics (how a mixer works, counting beats and phrasing) and builds step by step to your first full mix. Already play out? Jump straight into the intermediate and advanced courses.",
  },
  {
    question: "Do I need my own DJ equipment to start?",
    answer:
      "No. You can start with free DJ software on your laptop, and many students learn on an entry-level controller. Every course lists exactly what gear it uses, with budget-friendly options before you buy anything.",
  },
  {
    question: "How long do I have access to the course materials?",
    answer:
      "Lifetime access. Once you enroll you can rewatch every lesson, download the practice tracks and cue sheets, and get every future update to that course at no extra cost.",
  },
  {
    question: "Will I get a certificate after completing a course?",
    answer:
      "Yes. Each course ends with a practical assessment where you upload a recorded mix. Pass it and you get a shareable certificate for your DJ press kit or LinkedIn profile.",
  },
  {
    question: "Can I get feedback on my mixes?",
    answer:
      "Yes. Upload practice mixes to your course and instructors reply with timestamped notes on your transitions, EQ and track selection. You can also join live Q&A sessions and our student community.",
  },
  {
    question: "What if I'm not satisfied with a course?",
    answer:
      "Every course comes with a 30-day money-back guarantee. If it isn't right for you, contact support within 30 days of purchase for a full refund.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative isolate py-16 lg:py-24">
      <div aria-hidden="true" className="glow-faq fade-y absolute inset-0 -z-10" />
      <div className="site-container grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <SectionHeading
            id="faq-title"
            align="left"
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            description="Everything you need to know before your first lesson. Can't find your answer? Our team is one message away."
          />
          <FaqVisual />
        </div>

        <div className="reveal lg:pt-2">
          <FaqAccordion items={faqs} />
        </div>
      </div>
    </section>
  );
}

function FaqVisual() {
  return (
    <div className="reveal relative mx-auto mt-10 aspect-square w-full max-w-[26.25rem] lg:mx-0 lg:ml-6">
      {/* Scalloped mint cloud behind the photo, echoing the reference illustration */}
      <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 size-full overflow-visible text-[#b6dcd4] dark:text-brand/25">
        <g fill="currentColor">
          <circle cx="100" cy="102" r="74" />
          <circle cx="62" cy="44" r="34" />
          <circle cx="116" cy="30" r="28" />
          <circle cx="160" cy="58" r="32" />
          <circle cx="178" cy="112" r="22" />
          <circle cx="156" cy="160" r="32" />
          <circle cx="100" cy="174" r="25" />
          <circle cx="44" cy="160" r="30" />
          <circle cx="22" cy="100" r="22" />
        </g>
      </svg>

      <div className="blob-mask absolute inset-[11%]">
        <Image
          src="/images/faq-dj.jpg"
          alt="Smiling DJ wearing headphones behind the decks"
          fill
          sizes="(min-width: 1024px) 380px, 80vw"
          className="object-cover"
        />
      </div>

      {/* Floating question badges */}
      <span
        aria-hidden="true"
        className="absolute top-[6%] left-[2%] flex size-14 -rotate-12 items-center justify-center rounded-2xl bg-brand text-3xl font-bold text-white shadow-[0_12px_30px_-8px_rgb(0_167_111/0.6)]"
      >
        ?
      </span>
      <span
        aria-hidden="true"
        className="absolute top-[26%] right-[-2%] flex size-11 rotate-12 items-center justify-center rounded-xl bg-accent-yellow text-2xl font-bold text-neutral-900 shadow-[0_12px_30px_-8px_rgb(248_197_37/0.7)]"
      >
        ?
      </span>
      <span aria-hidden="true" className="absolute right-[3%] bottom-[14%] size-5 rounded-full bg-accent-blue" />

      <div className="absolute bottom-[3%] left-[-2%] flex items-center gap-3 rounded-2xl border-2 border-glass-border bg-glass px-4 py-3 shadow-[0_8px_30px_rgb(0_0_0/0.1)] backdrop-blur-md sm:left-[-6%]">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2.5 rounded-full bg-brand" />
        </span>
        <div className="text-sm leading-tight">
          <p className="font-semibold text-foreground">Still have questions?</p>
          <Link href="/contact" className="text-brand hover:underline">
            Chat with a DJ coach
          </Link>
        </div>
      </div>
    </div>
  );
}
