import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { requireViewer } from "@/lib/dal";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await requireViewer();
  return <ProfileForm profile={viewer.profile} />;
}
