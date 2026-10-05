import Image from "next/image";

/*
 * The software the courses teach, under the hero. Logos live in
 * /public/brands/software (backgrounds removed); the ones with black or white
 * lettering have a second version for dark mode. Each sits centred in an
 * equal grid cell at the same height, so the row lines up at every width.
 */

type Logo = {
  name: string;
  src: string;
  /** Version for dark mode, when the lettering would disappear */
  dark?: string;
  width: number;
  height: number;
  /** Icon-only logos get their name written beside them */
  label?: string;
};

const logos: Logo[] = [
  { name: "VirtualDJ", src: "/brands/software/virtual-dj.png", width: 540, height: 128 },
  { name: "Serato DJ Pro", src: "/brands/software/serato-dj-pro.png", dark: "/brands/software/serato-dj-pro-dark.png", width: 869, height: 152 },
  { name: "Acid Pro", src: "/brands/software/acid-pro.png", dark: "/brands/software/acid-pro-dark.png", width: 568, height: 160 },
  { name: "Vegas Pro", src: "/brands/software/vegas-pro.png", dark: "/brands/software/vegas-pro-dark.png", width: 776, height: 155 },
  { name: "Adobe Premiere Pro", src: "/brands/software/premiere-pro.png", width: 164, height: 160, label: "Premiere Pro" },
  { name: "Adobe After Effects", src: "/brands/software/after-effects.png", width: 164, height: 160, label: "After Effects" },
];

export function TrustedBy() {
  return (
    <section aria-labelledby="software-title" className="site-container pb-16">
      <p id="software-title" className="text-center text-base text-muted-foreground sm:text-[1.0625rem]">
        Hands-on lessons in the software working DJs and creators use every day
      </p>
      <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-8">
        {logos.map((logo) => (
          <li key={logo.name} className="flex h-12 items-center justify-center" title={logo.name}>
            <span className="flex items-center gap-2.5">
              <Image
                src={logo.src}
                alt={logo.label ? "" : logo.name}
                width={logo.width}
                height={logo.height}
                className={`h-8 w-auto sm:h-9 ${logo.label ? "" : "max-w-[10.5rem]"} object-contain ${logo.dark ? "dark:hidden" : ""}`}
              />
              {logo.dark && (
                <Image src={logo.dark} alt={logo.name} width={logo.width} height={logo.height} className="hidden h-8 w-auto max-w-[10.5rem] object-contain sm:h-9 dark:block" />
              )}
              {logo.label && <span className="text-[0.9375rem] font-semibold whitespace-nowrap text-foreground sm:text-base">{logo.label}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
