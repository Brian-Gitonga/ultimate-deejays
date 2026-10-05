import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Ultimate Deejays to pick up your DJ courses right where you left off.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

const errorMessages: Record<string, string> = {
  link: "That link has expired, was already used, or was opened in a different browser. If you just confirmed your email, log in below.",
  suspended: "This account is suspended. If you think that's a mistake, contact support.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const next = safeNextPath(one(params.next));
  const error = errorMessages[one(params.error) ?? ""];

  return (
    <AuthShell
      tagline="Welcome back!"
      subline="Your decks are warmed up. Pick up your mix right where you left off."
      title="Log in to your account"
      description="Enter your email and password to keep learning."
    >
      <LoginForm next={next} initialError={error} />
    </AuthShell>
  );
}
