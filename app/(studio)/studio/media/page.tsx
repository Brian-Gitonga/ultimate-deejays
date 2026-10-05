import type { Metadata } from "next";
import { MediaLibrary } from "@/components/studio/media-library";
import { StudioPageHeader } from "@/components/studio/ui";
import { listMedia } from "./actions";

export const metadata: Metadata = { title: "Media library" };

export default async function StudioMediaPage() {
  const result = await listMedia();
  if (!result.ok) throw new Error(`${result.error} Run supabase/diagnostics/00_health_check.sql.`);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Media library" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Media library" }]} />
        <MediaLibrary seed={result.record} />
      </div>
    </main>
  );
}
