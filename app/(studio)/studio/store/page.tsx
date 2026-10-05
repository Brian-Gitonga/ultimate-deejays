import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";
import { StoreManager } from "@/components/studio/store-manager";
import { StudioPageHeader, secondaryButton } from "@/components/studio/ui";
import { getInstructorOptions } from "@/lib/db/studio/courses";
import { getStudioStore } from "@/lib/db/studio/store";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Store" };

export default async function StudioStorePage() {
  const supabase = await createClient();
  const [resources, instructors] = await Promise.all([getStudioStore(supabase), getInstructorOptions(supabase)]);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader
          title="Store"
          crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Store" }]}
          actions={
            <Link href="/store" target="_blank" className={secondaryButton}>
              View store <ArrowUpRightIcon className="size-4" />
            </Link>
          }
        />
        <StoreManager seed={resources} instructors={instructors} />
      </div>
    </main>
  );
}
