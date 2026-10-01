import type { Metadata } from "next";
import { AboutMission } from "@/components/about-mission";
import { AboutSuccess } from "@/components/about-success";
import { AboutTeam } from "@/components/about-team";
import { Newsletter } from "@/components/newsletter";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet the working DJs behind Ultimate Deejays: our mission, our values, and the instructors who teach you to mix, scratch, produce and play your first gigs.",
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      <PageHeader title="About Us" />
      <AboutMission />
      <AboutSuccess />
      <AboutTeam />
      <Newsletter />
    </main>
  );
}
