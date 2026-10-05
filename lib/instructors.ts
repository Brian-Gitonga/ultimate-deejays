/* Instructors as Studio → Instructors edits them. Stored in the instructors table. */

export type StudioInstructor = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio: string;
  image: string;
  email: string;
  /** Order on the home and About pages (lowest first) */
  position: number;
  showOnAbout: boolean;
  /** How many courses and posts list them (read-only) */
  courses: number;
  posts: number;
  updatedAt: string;
};
