import "server-only";
import { cache } from "react";
import type { Instructor } from "@/lib/content";
import { contentClient, orThrow } from "./content-client";
import { toInstructor } from "./mappers";

/** Instructors in their display order, for the home page, About page and course pages. */
export const getInstructors = cache(async (aboutOnly = false): Promise<Instructor[]> => {
  let query = contentClient("instructors").from("instructors").select("*").order("position").order("name");
  if (aboutOnly) query = query.eq("show_on_about", true);
  return orThrow(await query, "instructors").map(toInstructor);
});
