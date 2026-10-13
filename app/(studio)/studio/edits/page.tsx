import type { Metadata } from "next";
import { EditRequestManager } from "@/components/studio/edit-request-manager";
import { Panel, StudioPageHeader } from "@/components/studio/ui";
import { getStudioEditRequests } from "@/lib/db/studio/edits";
import { isSmsConfigured } from "@/lib/sms";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit requests" };

export default async function StudioEditsPage({ searchParams }: PageProps<"/studio/edits">) {
  const [{ request }, requests] = await Promise.all([searchParams, getStudioEditRequests(await createClient())]);
  const initialId = Array.isArray(request) ? request[0] : request;

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Edit requests" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Edit requests" }]} />
        {requests === null ? (
          <Panel title="Edit requests need migration 016" description="Run it once in the Supabase SQL editor, then refresh.">
            <p className="text-sm text-muted-foreground">
              <code className="text-xs">supabase/migrations/20261012090000_edits_allowances.sql</code> adds edit requests, the request forms on templates, plan allowances and the private
              edits bucket. Then check it with <code className="text-xs">supabase/diagnostics/00_health_check.sql</code>.
            </p>
          </Panel>
        ) : (
          <EditRequestManager seed={requests} smsReady={isSmsConfigured()} initialId={initialId} />
        )}
      </div>
    </main>
  );
}
