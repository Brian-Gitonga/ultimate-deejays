import type { Metadata } from "next";
import { LinkManager } from "@/components/affiliate/link-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { linkDestinations } from "@/lib/affiliate-portal";
import { requireAffiliate } from "@/lib/dal";
import { getAffiliatePortal } from "@/lib/db/affiliate-portal";
import { getPublishedCourses } from "@/lib/db/courses";

export const metadata: Metadata = { title: "Links & code" };

export default async function AffiliateLinksPage() {
  const viewer = await requireAffiliate();
  const [{ affiliate, links, program }, courses] = await Promise.all([getAffiliatePortal(viewer), getPublishedCourses()]);
  const destinations = [
    ...linkDestinations,
    ...courses.map((c) => ({ path: `/courses/${c.slug}`, label: `Course: ${c.title}${c.access === "warm-up" ? " (free)" : ""}` })),
  ];
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Links & code" crumbs={[{ label: "Dashboard", href: "/affiliate" }, { label: "Links & code" }]} />
        <LinkManager
          code={affiliate.code}
          seed={links}
          destinations={destinations}
          cookieDays={program.cookieDays}
          customerDiscount={affiliate.customerDiscount}
          today={new Date().toISOString().slice(0, 10)}
        />
      </div>
    </main>
  );
}
