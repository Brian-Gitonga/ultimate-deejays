import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudioShell } from "@/components/studio-shell";
import { instructors } from "@/lib/content";

// The instructor studio is private: never index it.
export const metadata: Metadata = {
  title: { template: "%s | Studio | Ultimate Deejays", default: "Instructor Studio" },
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  // TODO: load the signed-in instructor from the session and redirect("/login") if there isn't one.
  const instructor = instructors.find((i) => i.slug === "marcus-reid")!;
  return (
    <StudioShell instructor={{ name: instructor.name, image: instructor.image, specialty: instructor.specialty }}>
      {children}
    </StudioShell>
  );
}
