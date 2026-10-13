import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StoreResourceView } from "@/components/store/resource-view";
import { getEditSetup } from "@/lib/db/edits";
import { getStoreResource, getStoreResources } from "@/lib/db/store";
import { getUpgradeContext } from "@/lib/db/upgrade";
import { siteName } from "@/lib/site";
import { resourcePath } from "@/lib/store";

// Published resources are built ahead of time; new ones render on first visit.
// Lower thirds have their page under /lower-thirds instead.
export async function generateStaticParams() {
  return (await getStoreResources()).filter((r) => !r.lowerThird).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/store/[slug]">): Promise<Metadata> {
  const resource = await getStoreResource((await params).slug);
  if (!resource || resource.lowerThird) return {};
  const description = (resource.description || `${resource.title}: a free download from ${siteName}.`).slice(0, 160);
  return {
    title: resource.title,
    description,
    alternates: { canonical: `/store/${resource.slug}` },
    openGraph: {
      type: "website",
      title: resource.title,
      description,
      url: `/store/${resource.slug}`,
      siteName,
      ...(resource.thumbnail && { images: [{ url: resource.thumbnail, width: 1280, height: 720, alt: resource.title }] }),
    },
  };
}

export default async function StoreResourcePage({ params }: PageProps<"/store/[slug]">) {
  const { slug } = await params;
  const [resource, all, edits, upgrade] = await Promise.all([getStoreResource(slug), getStoreResources(), getEditSetup(slug), getUpgradeContext()]);
  if (!resource) notFound();
  if (resource.lowerThird) redirect(resourcePath(resource.slug, true));
  return <StoreResourceView resource={resource} all={all} now={new Date().getTime()} edits={edits} upgrade={upgrade} />;
}
