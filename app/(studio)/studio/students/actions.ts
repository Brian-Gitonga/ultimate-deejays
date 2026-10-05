"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { getStudent } from "@/lib/db/studio/students";
import type { Student } from "@/lib/students";
import { adminAction, must, StudioError } from "@/lib/studio-action";
import { createAdminClient } from "@/lib/supabase/admin";

const changeSchema = z.object({
  plan: z.enum(["warm-up", "resident", "headliner"]),
  status: z.enum(["active", "suspended"]),
});

/**
 * Saves what the studio can change about a student: their plan (a gift or a
 * correction; payments don't change) and whether they're suspended (suspended
 * students can't log in).
 */
export async function saveStudent(student: Student): Promise<ActionResult<Student>> {
  return adminAction("update the student", async ({ supabase }) => {
    const parsed = changeSchema.safeParse(student);
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    must(await supabase.from("profiles").update(parsed.data).eq("id", student.id).eq("role", "user").select("id").single());
    const saved = await getStudent(student.id, supabase);
    if (!saved) throw new StudioError("Student not found.");
    return saved;
  });
}

/** Permanently deletes the student's login and everything linked to it (profile, progress, reviews, mixes). */
export async function deleteStudent(id: string): Promise<ActionResult> {
  return adminAction("delete the account", async ({ supabase, admin }) => {
    if (id === admin.id) throw new StudioError("You can't delete your own account from here.");
    const target = must(await supabase.from("profiles").select("role").eq("id", id).maybeSingle());
    if (!target) throw new StudioError("Student not found.");
    if (target.role !== "user") throw new StudioError("Admins can't be deleted from the studio. Remove their admin role first (scripts/make-admin.sql).");

    // Logins live in Supabase Auth, which only the secret key can change.
    const { error } = await createAdminClient().auth.admin.deleteUser(id);
    if (error) throw new StudioError(`Couldn't delete the login: ${error.message}. Check SUPABASE_SECRET_KEY in .env.local.`);
    return null;
  });
}
