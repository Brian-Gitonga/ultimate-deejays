import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/*
 * Signs the current session out and shows the log-in page with a reason.
 * Used when a suspended account is found still signed in (lib/dal.ts).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const login = new URL("/login", request.nextUrl.origin);
  const reason = request.nextUrl.searchParams.get("reason");
  if (reason === "suspended") login.searchParams.set("error", "suspended");
  return NextResponse.redirect(login);
}
