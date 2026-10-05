import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreResourceView } from "@/components/store/resource-view";
import { getStoreResource, getStoreResources } from "@/lib/db/store";
import { siteName } from "@/lib/site";

// Published resources are built ahead of time; new ones render on first visit.
export async function generateStaticParams() {
  return (await getStoreResources()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/store/[slug]">): Promise<Metadata> {
  const resource = await getStoreResource((await params).slug);
  if (!resource) return {};
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
  const [resource, all] = await Promise.all([getStoreResource(slug), getStoreResources()]);
  if (!resource) notFound();
  return <StoreResourceView resource={resource} all={all} now={new Date().getTime()} />;
}
