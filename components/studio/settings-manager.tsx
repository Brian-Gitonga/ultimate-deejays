"use client";

import Link from "next/link";
import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { postCategories } from "@/lib/post-categories";
import { defaultSettings, settingsSeed, type PlanSettings, type SiteSettings } from "@/lib/site-settings";
import { useCollection } from "@/lib/studio-store";
import {
  ArrowUpRightIcon,
  BellIcon,
  CheckIcon,
  HandshakeIcon,
  InstagramIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  TagIcon,
  TiktokIcon,
  WalletIcon,
  XIcon,
  YoutubeIcon,
} from "../icons";
import { ListEditor } from "./list-editor";
import { useToast } from "./manage-table";
import { Field, Input, Panel, Select, Switch, Textarea, primaryButton, secondaryButton } from "./ui";

export type SectionKey = "general" | "pricing" | "blog" | "payments" | "affiliates" | "notifications";
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const sections: { key: SectionKey; label: string; hint: string; icon: Icon }[] = [
  { key: "general", label: "General", hint: "Name, contact and socials", icon: SettingsIcon },
  { key: "pricing", label: "Pricing page", hint: "Plans and prices students see", icon: TagIcon },
  { key: "blog", label: "Blog", hint: "How the blog looks and works", icon: PencilIcon },
  { key: "payments", label: "Payments & payouts", hint: "Checkout, refunds and payouts", icon: WalletIcon },
  { key: "affiliates", label: "Affiliate program", hint: "Commission and rules", icon: HandshakeIcon },
  { key: "notifications", label: "Notifications", hint: "Emails sent to you", icon: BellIcon },
];


const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Fill in any field added after a settings record was saved.
function withDefaults(s?: Partial<SiteSettings>): SiteSettings {
  const d = defaultSettings;
  if (!s) return d;
  return {
    ...d,
    ...s,
    general: { ...d.general, ...s.general, socials: { ...d.general.socials, ...s.general?.socials } },
    plans: s.plans?.length ? s.plans : d.plans,
    pricing: { ...d.pricing, ...s.pricing },
    blog: { ...d.blog, ...s.blog },
    payments: { ...d.payments, ...s.payments },
    affiliates: { ...d.affiliates, ...s.affiliates },
    notifications: { ...d.notifications, ...s.notifications },
  };
}

function validate(s: SiteSettings) {
  const e: Record<string, string> = {};
  if (!s.general.siteName.trim()) e["general.siteName"] = "Enter the site name";
  if (!emailOk(s.general.supportEmail)) e["general.supportEmail"] = "Enter a valid email address";
  s.plans.forEach((p) => {
    if (!p.name.trim()) e[`plan.${p.slug}.name`] = "Give the plan a name";
    if (!(p.price >= 0)) e[`plan.${p.slug}.price`] = "Price can't be negative";
    if (!p.cta.trim()) e[`plan.${p.slug}.cta`] = "Add the button text";
    if (!p.highlights.some((h) => h.trim())) e[`plan.${p.slug}.highlights`] = "Add at least one feature";
  });
  if (!s.pricing.heading.trim()) e["pricing.heading"] = "Add a headline";
  if (s.affiliates.defaultCommission < 1 || s.affiliates.defaultCommission > 90) e["affiliates.defaultCommission"] = "Use a value from 1% to 90%";
  if (s.affiliates.cookieDays < 1 || s.affiliates.cookieDays > 365) e["affiliates.cookieDays"] = "Use 1 to 365 days";
  if (!s.payments.card && !s.payments.paypal) e["payments.methods"] = "Keep at least one way to pay";
  if (!emailOk(s.notifications.email)) e["notifications.email"] = "Enter a valid email address";
  return e;
}

const sectionOf = (key: string): SectionKey => (key.startsWith("plan.") ? "pricing" : (key.split(".")[0] as SectionKey));

export function SettingsManager({ initialSection, posts }: { initialSection: SectionKey; posts: { slug: string; title: string }[] }) {
  const { items, save } = useCollection("settings", settingsSeed);
  const saved = withDefaults(items[0]);
  const savedJson = JSON.stringify(saved);
  const [seen, setSeen] = useState(savedJson);
  const [draft, setDraft] = useState<SiteSettings>(saved);
  const [section, setSection] = useState<SectionKey>(initialSection);
  const [showErrors, setShowErrors] = useState(false);
  const { show, toast } = useToast();

  // Pick up the stored record once it loads, and the new baseline after a save.
  if (seen !== savedJson) {
    setSeen(savedJson);
    setDraft(saved);
  }

  const dirty = JSON.stringify({ ...draft, updatedAt: saved.updatedAt }) !== savedJson;
  const errors = validate(draft);
  const errorCount = Object.keys(errors).length;
  const err = (key: string) => (showErrors ? errors[key] : undefined);

  function patch<K extends Exclude<keyof SiteSettings, "id" | "plans" | "updatedAt">>(key: K, value: Partial<SiteSettings[K]>) {
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...value } }));
  }

  function patchPlan(slug: PlanSettings["slug"], value: Partial<PlanSettings>) {
    setDraft((d) => ({ ...d, plans: d.plans.map((p) => (p.slug === slug ? { ...p, ...value } : p)) }));
  }

  function choose(key: SectionKey) {
    setSection(key);
    window.history.replaceState(null, "", `?section=${key}`);
  }

  function onSave() {
    if (errorCount) {
      setShowErrors(true);
      const first = sectionOf(Object.keys(errors)[0]);
      if (first !== section) choose(first);
      show(`Fix ${errorCount} ${errorCount === 1 ? "field" : "fields"} before saving`);
      return;
    }
    save({ ...draft, updatedAt: new Date().toISOString() });
    setShowErrors(false);
    show("Settings saved");
  }

  const sectionErrors = (key: SectionKey) => showErrors && Object.keys(errors).some((k) => sectionOf(k) === key);
  const current = sections.find((s) => s.key === section)!;
  const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: draft.general.currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col lg:gap-1" data-lenis-prevent-horizontal>
          {sections.map((s) => {
            const active = s.key === section;
            return (
              <li key={s.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => choose(s.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition lg:py-2.5 ${
                    active ? "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <s.icon className={`size-[1.125rem] shrink-0 ${active ? "text-brand" : ""}`} />
                  <span className="min-w-0 whitespace-nowrap lg:whitespace-normal">
                    {s.label}
                    <span className="hidden text-xs font-normal text-muted-foreground lg:block">{s.hint}</span>
                  </span>
                  {sectionErrors(s.key) && <span className="ml-auto size-2 shrink-0 rounded-full bg-red-500" aria-label="Has errors" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{current.label}</h2>
          <p className="text-sm text-muted-foreground">{current.hint}</p>
        </div>

        {section === "general" && (
          <>
            <Panel title="Site details" description="Shown in the header, footer, emails and search results.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Site name" htmlFor="site-name" required error={err("general.siteName")}>
                  <Input id="site-name" value={draft.general.siteName} onChange={(e) => patch("general", { siteName: e.target.value })} aria-invalid={!!err("general.siteName")} />
                </Field>
                <Field label="Currency" htmlFor="site-currency" hint="Used for prices across the site.">
                  <Select id="site-currency" value={draft.general.currency} onChange={(e) => patch("general", { currency: e.target.value as SiteSettings["general"]["currency"] })}>
                    {[
                      ["USD", "US dollar ($)"],
                      ["EUR", "Euro (€)"],
                      ["GBP", "British pound (£)"],
                      ["KES", "Kenyan shilling (KSh)"],
                      ["NGN", "Nigerian naira (₦)"],
                      ["ZAR", "South African rand (R)"],
                    ].map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Tagline" htmlFor="site-tagline" hint={`${draft.general.tagline.length}/120 · Used as the default page description.`}>
                    <Input id="site-tagline" maxLength={120} value={draft.general.tagline} onChange={(e) => patch("general", { tagline: e.target.value })} />
                  </Field>
                </div>
              </div>
            </Panel>

            <Panel title="Contact" description="How students reach you. Shown on the contact page and in the footer.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Support email" htmlFor="site-email" required error={err("general.supportEmail")}>
                  <Input id="site-email" type="email" value={draft.general.supportEmail} onChange={(e) => patch("general", { supportEmail: e.target.value })} aria-invalid={!!err("general.supportEmail")} />
                </Field>
                <Field label="Phone" htmlFor="site-phone">
                  <Input id="site-phone" type="tel" value={draft.general.phone} onChange={(e) => patch("general", { phone: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Studio address" htmlFor="site-address">
                    <Input id="site-address" value={draft.general.address} onChange={(e) => patch("general", { address: e.target.value })} />
                  </Field>
                </div>
              </div>
            </Panel>

            <Panel title="Social links" description="Leave a field empty to hide that icon.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {(
                  [
                    ["instagram", "Instagram", InstagramIcon],
                    ["tiktok", "TikTok", TiktokIcon],
                    ["youtube", "YouTube", YoutubeIcon],
                    ["x", "X", XIcon],
                  ] as const
                ).map(([key, label, SocialIcon]) => (
                  <Field key={key} label={label} htmlFor={`social-${key}`}>
                    <Affix prefix={<SocialIcon className="size-4" />}>
                      <Input id={`social-${key}`} type="url" placeholder="https://" value={draft.general.socials[key]} onChange={(e) => patch("general", { socials: { ...draft.general.socials, [key]: e.target.value } })} className="pl-10" />
                    </Affix>
                  </Field>
                ))}
              </div>
            </Panel>
          </>
        )}

        {section === "pricing" && (
          <>
            <Panel
              title="Pricing page"
              description="The headline and promises above the plans on /pricing."
              actions={
                <Link href="/pricing" target="_blank" className={`${secondaryButton} h-9 shrink-0`}>
                  View page <ArrowUpRightIcon className="size-4" />
                </Link>
              }
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Headline" htmlFor="pricing-heading" required error={err("pricing.heading")}>
                    <Input id="pricing-heading" maxLength={70} value={draft.pricing.heading} onChange={(e) => patch("pricing", { heading: e.target.value })} aria-invalid={!!err("pricing.heading")} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Intro" htmlFor="pricing-intro" hint={`${draft.pricing.intro.length}/200`}>
                    <Textarea id="pricing-intro" rows={2} maxLength={200} value={draft.pricing.intro} onChange={(e) => patch("pricing", { intro: e.target.value })} />
                  </Field>
                </div>
                <Field label="Money-back guarantee" htmlFor="pricing-guarantee" hint="Set to 0 to hide the guarantee.">
                  <Affix suffix="days">
                    <Input id="pricing-guarantee" type="number" min={0} max={90} value={draft.pricing.guaranteeDays} onChange={(e) => patch("pricing", { guaranteeDays: Number(e.target.value) })} className="pr-14" />
                  </Affix>
                </Field>
              </div>
              <div className="mt-6 space-y-5 border-t border-border pt-5">
                <Switch id="pricing-compare" label="Show the comparison table" hint="Feature-by-feature table under the plans." checked={draft.pricing.showComparison} onChange={(on) => patch("pricing", { showComparison: on })} />
                <Switch id="pricing-upgrade" label="Upgrade credit" hint="Students who upgrade only pay the difference between plans." checked={draft.pricing.upgradeCredit} onChange={(on) => patch("pricing", { upgradeCredit: on })} />
              </div>
            </Panel>

            <div className="space-y-6">
              {draft.plans.map((p) => (
                <Panel
                  key={p.slug}
                  title={p.name || "Untitled plan"}
                  description={p.price ? `${money(p.price)} one-time` : "Free plan"}
                  actions={
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="radio"
                        name="featured-plan"
                        checked={p.featured}
                        onChange={() => setDraft((d) => ({ ...d, plans: d.plans.map((x) => ({ ...x, featured: x.slug === p.slug })) }))}
                        className="size-4 accent-[var(--brand)]"
                      />
                      Most popular
                    </label>
                  }
                >
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-8">
                    <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Name" htmlFor={`plan-${p.slug}-name`} required error={err(`plan.${p.slug}.name`)}>
                        <Input id={`plan-${p.slug}-name`} maxLength={24} value={p.name} onChange={(e) => patchPlan(p.slug, { name: e.target.value })} aria-invalid={!!err(`plan.${p.slug}.name`)} />
                      </Field>
                      <Field label="Price" htmlFor={`plan-${p.slug}-price`} hint="0 = free" error={err(`plan.${p.slug}.price`)}>
                        <Affix prefix={<span className="text-sm">{money(0).replace(/[\d.,\s]/g, "")}</span>}>
                          <Input id={`plan-${p.slug}-price`} type="number" min={0} step="1" value={p.price} onChange={(e) => patchPlan(p.slug, { price: e.target.value === "" ? 0 : Number(e.target.value) })} className="pl-10" />
                        </Affix>
                      </Field>
                    </div>
                    <Field label="Tagline" htmlFor={`plan-${p.slug}-tagline`}>
                      <Textarea id={`plan-${p.slug}-tagline`} rows={2} maxLength={90} value={p.tagline} onChange={(e) => patchPlan(p.slug, { tagline: e.target.value })} />
                    </Field>
                    <Field label="Button text" htmlFor={`plan-${p.slug}-cta`} required error={err(`plan.${p.slug}.cta`)}>
                      <Input id={`plan-${p.slug}-cta`} maxLength={28} value={p.cta} onChange={(e) => patchPlan(p.slug, { cta: e.target.value })} aria-invalid={!!err(`plan.${p.slug}.cta`)} />
                    </Field>
                    </div>
                    <Field label="What's included" htmlFor={`plan-${p.slug}-highlights`} error={err(`plan.${p.slug}.highlights`)} hint="One feature per line, shown with a check mark.">
                      <ListEditor id={`plan-${p.slug}-highlights`} items={p.highlights} onChange={(highlights) => patchPlan(p.slug, { highlights })} min={3} max={10} maxLength={60} placeholders={["e.g. All Beginner courses", "e.g. Mix feedback on 2 recordings", "e.g. Certificates of completion"]} />
                    </Field>
                  </div>
                </Panel>
              ))}
            </div>

            <Panel
              title="Preview"
              description="How the plans look to students."
              actions={
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, plans: defaultSettings.plans, pricing: defaultSettings.pricing }))}
                  className={`${secondaryButton} h-9 shrink-0`}
                >
                  Restore defaults
                </button>
              }
            >
              <div className="rounded-2xl bg-cream p-4 sm:p-6">
                <div className="mx-auto max-w-xl text-center">
                  <p className="text-xl font-bold tracking-tight text-balance text-foreground sm:text-2xl">{draft.pricing.heading || "Your headline"}</p>
                  <p className="mt-2 text-sm text-pretty text-muted-foreground">{draft.pricing.intro}</p>
                </div>
                <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {draft.plans.map((p) => (
                    <li key={p.slug}>
                      <PlanPreview plan={p} price={p.price ? money(p.price) : money(0)} />
                    </li>
                  ))}
                </ul>
                {draft.pricing.guaranteeDays > 0 && (
                  <p className="mt-5 text-center text-xs text-muted-foreground">
                    All paid plans include a <span className="font-semibold text-foreground">{draft.pricing.guaranteeDays}-day money-back guarantee</span>.
                  </p>
                )}
              </div>
            </Panel>
          </>
        )}

        {section === "blog" && (
          <>
            <Panel title="Your posts" description="Write new articles and update existing ones.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { href: "/studio/blog", label: "Manage posts", text: "Edit, schedule or unpublish", icon: PencilIcon },
                  { href: "/studio/blog/new", label: "Write a post", text: "Start a new article", icon: PlusIcon },
                  { href: "/blog", label: "View blog", text: "See it as readers do", icon: ArrowUpRightIcon, external: true },
                ].map((l) => (
                  <Link key={l.href} href={l.href} target={l.external ? "_blank" : undefined} className="group flex items-center gap-3 rounded-xl border border-border p-4 transition hover:border-brand/40 hover:bg-brand/[0.04]">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <l.icon className="size-[1.125rem]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground group-hover:text-brand">{l.label}</span>
                      <span className="block text-xs text-muted-foreground">{l.text}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="Blog page" description="The /blog listing.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Listing heading" htmlFor="blog-heading">
                  <Input id="blog-heading" maxLength={40} value={draft.blog.heading} onChange={(e) => patch("blog", { heading: e.target.value })} />
                </Field>
                <Field label="Posts per page" htmlFor="blog-per-page">
                  <Select id="blog-per-page" value={draft.blog.postsPerPage} onChange={(e) => patch("blog", { postsPerPage: Number(e.target.value) })}>
                    {[6, 9, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>
                        {n} posts
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Pinned post" htmlFor="blog-featured" hint="Shown first on the blog page.">
                  <Select id="blog-featured" value={draft.blog.featuredPost} onChange={(e) => patch("blog", { featuredPost: e.target.value })}>
                    <option value="">None, newest first</option>
                    {posts.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.title}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Default category for new posts" htmlFor="blog-category">
                  <Select id="blog-category" value={draft.blog.defaultCategory} onChange={(e) => patch("blog", { defaultCategory: e.target.value })}>
                    {postCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Latest posts on the home page" htmlFor="blog-home">
                  <Select id="blog-home" value={draft.blog.homeLatest} onChange={(e) => patch("blog", { homeLatest: Number(e.target.value) })}>
                    <option value={0}>Hide the section</option>
                    {[3, 4, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} posts
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Panel>

            <Panel title="Article page" description="What readers see around each post.">
              <div className="space-y-5">
                <Switch id="blog-author" label="Author box" hint="Photo, name and bio under the article." checked={draft.blog.showAuthorBox} onChange={(on) => patch("blog", { showAuthorBox: on })} />
                <Switch id="blog-related" label="Related posts" hint="Three posts from the same category at the end." checked={draft.blog.showRelated} onChange={(on) => patch("blog", { showRelated: on })} />
                <Switch id="blog-newsletter" label="Newsletter sign-up" hint="Invite readers to join the mailing list." checked={draft.blog.showNewsletter} onChange={(on) => patch("blog", { showNewsletter: on })} />
                <Switch id="blog-progress" label="Reading progress bar" hint="A thin bar at the top that fills as people read." checked={draft.blog.showReadingProgress} onChange={(on) => patch("blog", { showReadingProgress: on })} />
                <Switch id="blog-share" label="Share buttons" hint="Copy link, X, Facebook and LinkedIn." checked={draft.blog.showShare} onChange={(on) => patch("blog", { showShare: on })} />
              </div>
            </Panel>
          </>
        )}

        {section === "payments" && (
          <>
            <Panel title="Checkout" description="How students pay for a plan.">
              <div className="space-y-5">
                <Switch id="pay-card" label="Cards" hint="Visa, Mastercard and Amex. Fee: 2.9% + $0.30." checked={draft.payments.card} onChange={(on) => patch("payments", { card: on })} />
                <Switch id="pay-paypal" label="PayPal" hint="Fee: 3.49% + $0.49." checked={draft.payments.paypal} onChange={(on) => patch("payments", { paypal: on })} />
                {err("payments.methods") && <p className="text-sm text-red-600 dark:text-red-400">{err("payments.methods")}</p>}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-5 border-t border-border pt-5 sm:grid-cols-2">
                <Field label="Refund window" htmlFor="pay-refund" hint="Students can request a refund within this time.">
                  <Affix suffix="days">
                    <Input id="pay-refund" type="number" min={0} max={90} value={draft.payments.refundWindow} onChange={(e) => patch("payments", { refundWindow: Number(e.target.value) })} className="pr-14" />
                  </Affix>
                </Field>
              </div>
            </Panel>

            <Panel title="Payouts" description="When and where your earnings are sent.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Schedule" htmlFor="pay-schedule">
                  <Select id="pay-schedule" value={draft.payments.schedule} onChange={(e) => patch("payments", { schedule: e.target.value as SiteSettings["payments"]["schedule"] })}>
                    <option value="weekly">Weekly, every Friday</option>
                    <option value="monthly">Monthly, last day of the month</option>
                    <option value="manual">Only when I request one</option>
                  </Select>
                </Field>
                <Field label="Minimum payout" htmlFor="pay-minimum" hint="Smaller balances roll over to the next payout.">
                  <Affix prefix={<span className="text-sm">$</span>}>
                    <Input id="pay-minimum" type="number" min={0} value={draft.payments.minimum} onChange={(e) => patch("payments", { minimum: Number(e.target.value) })} className="pl-8" />
                  </Affix>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Send payouts to" htmlFor="pay-destination">
                    <Select id="pay-destination" value={draft.payments.destination} onChange={(e) => patch("payments", { destination: e.target.value })}>
                      <option>Bank •••• 4821</option>
                      <option>PayPal · studio@ultimatedeejays.com</option>
                    </Select>
                  </Field>
                </div>
              </div>
            </Panel>
          </>
        )}

        {section === "affiliates" && (
          <>
            <Panel
              title="Program"
              description="People who promote your courses and earn a share of each sale."
              actions={
                <Link href="/studio/affiliates" className={`${secondaryButton} h-9 shrink-0`}>
                  Manage affiliates
                </Link>
              }
            >
              <div className="space-y-5">
                <Switch id="aff-enabled" label="Accept new affiliates" hint="Shows the “Become an affiliate” form on the site." checked={draft.affiliates.enabled} onChange={(on) => patch("affiliates", { enabled: on })} />
                <Switch id="aff-auto" label="Approve applications automatically" hint="Off: you review every application first." checked={draft.affiliates.autoApprove} onChange={(on) => patch("affiliates", { autoApprove: on })} />
              </div>
              <div className="mt-6 grid grid-cols-1 gap-5 border-t border-border pt-5 sm:grid-cols-3">
                <Field label="Default commission" htmlFor="aff-commission" hint="You can change it per affiliate." error={err("affiliates.defaultCommission")}>
                  <Affix suffix="%">
                    <Input id="aff-commission" type="number" min={1} max={90} value={draft.affiliates.defaultCommission} onChange={(e) => patch("affiliates", { defaultCommission: Number(e.target.value) })} className="pr-9" aria-invalid={!!err("affiliates.defaultCommission")} />
                  </Affix>
                </Field>
                <Field label="Referral cookie" htmlFor="aff-cookie" hint="How long a click counts." error={err("affiliates.cookieDays")}>
                  <Affix suffix="days">
                    <Input id="aff-cookie" type="number" min={1} max={365} value={draft.affiliates.cookieDays} onChange={(e) => patch("affiliates", { cookieDays: Number(e.target.value) })} className="pr-14" aria-invalid={!!err("affiliates.cookieDays")} />
                  </Affix>
                </Field>
                <Field label="Minimum payout" htmlFor="aff-min" hint="Smaller balances roll over.">
                  <Affix prefix={<span className="text-sm">$</span>}>
                    <Input id="aff-min" type="number" min={0} value={draft.affiliates.minPayout} onChange={(e) => patch("affiliates", { minPayout: Number(e.target.value) })} className="pl-8" />
                  </Affix>
                </Field>
              </div>
              <p className="mt-5 rounded-xl bg-brand/[0.07] px-4 py-3 text-sm text-foreground">
                At {draft.affiliates.defaultCommission || 0}%, an affiliate earns{" "}
                <span className="font-semibold">{money(((draft.plans.find((p) => p.featured) ?? draft.plans[1]).price * (draft.affiliates.defaultCommission || 0)) / 100)}</span> for every{" "}
                {(draft.plans.find((p) => p.featured) ?? draft.plans[1]).name} plan they refer.
              </p>
            </Panel>

            <Panel title="Program terms" description="Shown on the application form. Affiliates agree to these when they apply.">
              <Field label="Terms" htmlFor="aff-terms" hint={`${draft.affiliates.terms.length}/600`}>
                <Textarea id="aff-terms" rows={5} maxLength={600} value={draft.affiliates.terms} onChange={(e) => patch("affiliates", { terms: e.target.value })} />
              </Field>
            </Panel>
          </>
        )}

        {section === "notifications" && (
          <Panel title="Email me when…" description="Notifications go to one address.">
            <div className="max-w-md">
              <Field label="Send to" htmlFor="notify-email" error={err("notifications.email")}>
                <Input id="notify-email" type="email" value={draft.notifications.email} onChange={(e) => patch("notifications", { email: e.target.value })} aria-invalid={!!err("notifications.email")} />
              </Field>
            </div>
            <div className="mt-6 space-y-5 border-t border-border pt-5">
              <Switch id="n-sale" label="A student buys a plan" checked={draft.notifications.newSale} onChange={(on) => patch("notifications", { newSale: on })} />
              <Switch id="n-refund" label="A payment is refunded" checked={draft.notifications.refund} onChange={(on) => patch("notifications", { refund: on })} />
              <Switch id="n-student" label="Someone joins on the free plan" checked={draft.notifications.newStudent} onChange={(on) => patch("notifications", { newStudent: on })} />
              <Switch id="n-affiliate" label="Someone applies to be an affiliate" checked={draft.notifications.affiliateApplication} onChange={(on) => patch("notifications", { affiliateApplication: on })} />
              <Switch id="n-payout" label="A payout is sent" checked={draft.notifications.payoutSent} onChange={(on) => patch("notifications", { payoutSent: on })} />
              <Switch id="n-weekly" label="Weekly summary" hint="Sales, new students and top courses every Monday." checked={draft.notifications.weeklyReport} onChange={(on) => patch("notifications", { weeklyReport: on })} />
            </div>
          </Panel>
        )}

        <div className={`sticky bottom-4 z-20 transition duration-200 ${dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`} aria-hidden={!dirty}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 pl-5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.35)] backdrop-blur">
            <p className="text-sm text-foreground">{showErrors && errorCount ? `${errorCount} ${errorCount === 1 ? "field needs" : "fields need"} attention` : "You have unsaved changes"}</p>
            <div className="flex gap-2">
              <button type="button" tabIndex={dirty ? 0 : -1} onClick={() => { setDraft(saved); setShowErrors(false); }} className={`${secondaryButton} h-9`}>
                Discard
              </button>
              <button type="button" tabIndex={dirty ? 0 : -1} onClick={onSave} className={`${primaryButton} h-9`}>
                <CheckIcon className="size-4" /> Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}

function Affix({ prefix, suffix, children }: { prefix?: ReactNode; suffix?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">{prefix}</span>}
      {children}
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function PlanPreview({ plan, price }: { plan: PlanSettings; price: string }) {
  const f = plan.featured;
  return (
    <div className={`relative flex h-full flex-col rounded-2xl p-5 ${f ? "bg-brand-deep text-white" : "border border-black/[0.06] bg-card dark:border-white/10"}`}>
      {f && <span className="absolute top-4 right-4 rounded-full bg-accent-yellow px-2.5 py-0.5 text-[0.6875rem] font-semibold text-neutral-900">Most popular</span>}
      <p className={`pr-20 font-semibold ${f ? "text-white" : "text-foreground"}`}>{plan.name || "Untitled"}</p>
      <p className={`mt-1 text-xs ${f ? "text-white/80" : "text-muted-foreground"}`}>{plan.tagline}</p>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold tracking-tight ${f ? "text-white" : "text-foreground"}`}>{price}</span>
        <span className={`text-xs ${f ? "text-white/75" : "text-muted-foreground"}`}>{plan.price === 0 ? "forever" : "one-time"}</span>
      </p>
      <span className={`mt-4 inline-flex h-9 items-center justify-center rounded-lg text-sm font-semibold ${f ? "bg-white text-neutral-900" : "bg-[#18181b] text-white dark:bg-foreground dark:text-background"}`}>{plan.cta || "Button"}</span>
      <ul className={`mt-4 space-y-2 border-t pt-4 text-xs ${f ? "border-white/15" : "border-border"}`}>
        {plan.highlights.filter((h) => h.trim()).map((h, i) => (
          <li key={i} className="flex gap-2">
            <CheckIcon className={`mt-0.5 size-3.5 shrink-0 ${f ? "text-white" : "text-brand"}`} strokeWidth={3} />
            <span className={f ? "text-white/90" : "text-foreground/85"}>{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
