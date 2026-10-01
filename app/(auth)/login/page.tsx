import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Ultimate Deejays to pick up your DJ courses right where you left off.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthShell
      tagline="Welcome back!"
      subline="Your decks are warmed up. Pick up your mix right where you left off."
      title="Log in to your account"
      description="Enter your email and password to keep learning."
    >
      <LoginForm />
    </AuthShell>
  );
}
