import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StoreResourceView } from "@/components/store/resource-view";
import { getEditSetup } from "@/lib/db/edits";
import { getLowerThirds, getStoreResource } from "@/lib/db/store";
import { getUpgradeContext } from "@/lib/db/upgrade";
import { siteName } from "@/lib/site";
import { resourcePath } from "@/lib/store";

// Published lower thirds are built ahead of time; new ones render on first visit.
export async function generateStaticParams() {
  return (await getLowerThirds()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/lower-thirds/[slug]">): Promise<Metadata> {
  const resource = await getStoreResource((await params).slug);
  if (!resource?.lowerThird) return {};
  const description = (resource.description || `${resource.title}: a lower third for your DJ sets and streams from ${siteName}.`).slice(0, 160);
  return {
    title: `${resource.title} (lower third)`,
    description,
    alternates: { canonical: resourcePath(resource.slug, true) },
    openGraph: {
      type: "website",
      title: resource.title,
      description,
      url: resourcePath(resource.slug, true),
      siteName,
      ...(resource.thumbnail && { images: [{ url: resource.thumbnail, width: 1280, height: 720, alt: resource.title }] }),
    },
  };
}

export default async function LowerThirdPage({ params }: PageProps<"/lower-thirds/[slug]">) {
  const { slug } = await params;
  const [resource, all, edits, upgrade] = await Promise.all([getStoreResource(slug), getLowerThirds(), getEditSetup(slug), getUpgradeContext()]);
  if (!resource) notFound();
  // Switched off in the studio: it's a regular store download again.
  if (!resource.lowerThird) redirect(resourcePath(resource.slug, false));
  return <StoreResourceView resource={resource} all={all} now={new Date().getTime()} edits={edits} upgrade={upgrade} />;
}
