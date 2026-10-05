import type { Metadata } from "next";
import { ReviewManager } from "@/components/studio/review-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getStudioReviews } from "@/lib/db/studio/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default async function StudioReviewsPage() {
  const reviews = await getStudioReviews();
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Reviews" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Reviews" }]} />
        <ReviewManager seed={reviews} />
      </div>
    </main>
  );
}
