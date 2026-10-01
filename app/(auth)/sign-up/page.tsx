import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create your Ultimate Deejays account and start learning to DJ from working pros, at your own pace.",
  alternates: { canonical: "/sign-up" },
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <AuthShell
      tagline="Start mixing today"
      subline="Join 2,000+ DJs learning from working pros, at their own pace."
      title="Create your account"
      description="Start learning from working DJs. It only takes a minute."
    >
      <SignUpForm />
    </AuthShell>
  );
}
