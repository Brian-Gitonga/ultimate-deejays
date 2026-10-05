"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/dal";
import { fieldErrors, profileInputSchema } from "@/lib/profile";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export type SaveProfileResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> };

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/*
 * Saves the signed-in person's profile. The form sends the fields as JSON in
 * "profile", plus "avatar" when they picked a new photo (already resized to a
 * small JPEG in the browser). RLS only lets people update their own row.
 */
export async function saveProfile(formData: FormData): Promise<SaveProfileResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Your session has ended. Log in again to save your profile." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("profile") ?? ""));
  } catch {
    return { ok: false, message: "Something went wrong sending your changes. Refresh the page and try again." };
  }
  const parsed = profileInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Some fields need another look.", fieldErrors: fieldErrors(parsed.error) };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const avatars = supabase.storage.from("avatars");

  // 1. Upload the new photo, if there is one, into avatars/<user id>/.
  let avatarUrl: string | undefined;
  let avatarPath: string | undefined;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (!AVATAR_TYPES.includes(avatar.type)) return { ok: false, message: "Choose a JPG, PNG or WebP photo." };
    if (avatar.size > AVATAR_MAX_BYTES) return { ok: false, message: "That photo is too large. Choose one under 2 MB." };

    // A new name each time, so browsers and the CDN never show a cached old photo.
    avatarPath = `${viewer.id}/${Date.now()}.jpg`;
    const { error } = await avatars.upload(avatarPath, avatar, { contentType: avatar.type, cacheControl: "31536000" });
    if (error) {
      console.error("[saveProfile] avatar upload failed:", error);
      return { ok: false, message: withDetail("We couldn't upload your photo. Please try again.", { code: "storage", message: error.message }) };
    }
    avatarUrl = avatars.getPublicUrl(avatarPath).data.publicUrl;
  }

  // 2. Save the fields. Role and email aren't in this list, and the database refuses them anyway.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      dj_name: input.djName,
      location: input.location,
      bio: input.bio,
      experience: input.experience,
      genres: input.genres,
      instagram: input.instagram,
      soundcloud: input.soundcloud,
      ...(avatarUrl && { avatar_url: avatarUrl }),
    })
    .eq("id", viewer.id)
    .select("id")
    .single();

  if (error) {
    console.error("[saveProfile] update failed:", error);
    if (avatarPath) await avatars.remove([avatarPath]);
    return { ok: false, message: withDetail("We couldn't save your profile. Please try again.", error) };
  }

  // 3. Tidy up: delete older photos so each person keeps one file. Best effort.
  if (avatarPath) {
    const { data: files } = await avatars.list(viewer.id);
    const stale = (files ?? []).map((f) => `${viewer.id}/${f.name}`).filter((path) => path !== avatarPath);
    if (stale.length) await avatars.remove(stale);
  }

  // The sidebar, header and every account page show the profile.
  revalidatePath("/account", "layout");
  return { ok: true };
}
