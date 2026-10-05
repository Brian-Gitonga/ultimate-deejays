import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { NewPasswordForm } from "@/components/password-reset-forms";
import { getViewer } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

/* Opened from the reset email (via /auth/callback, which signs them in for this). */
export default async function ResetPasswordPage() {
  const viewer = await getViewer();
  return (
    <AuthShell
      tagline="Almost there"
      subline="Pick a new password and you're back in."
      title="Choose a new password"
      description={viewer ? `For ${viewer.email}. You'll stay logged in on this device.` : "This reset link has expired or was already used."}
    >
      {viewer ? (
        <NewPasswordForm />
      ) : (
        <Link
          href="/forgot-password"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#18181b] text-[0.9375rem] font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
        >
          Send a new link
        </Link>
      )}
    </AuthShell>
  );
}
