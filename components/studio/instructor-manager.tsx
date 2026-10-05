"use client";

import { useId, useState } from "react";
import { deleteInstructor, saveInstructor } from "@/app/(studio)/studio/instructors/actions";
import type { StudioInstructor } from "@/lib/instructors";
import { slugify, uid } from "@/lib/studio-courses";
import { useServerCollection } from "@/lib/studio-store";
import { PencilIcon, PlusIcon, TrashIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import { ThumbnailPicker } from "./course-fields";
import { Drawer } from "./drawer";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { Field, Input, Switch, Textarea, primaryButton } from "./ui";

const blank = (position: number): StudioInstructor => ({
  id: uid(),
  slug: "",
  name: "",
  specialty: "",
  bio: "",
  image: "",
  email: "",
  position,
  showOnAbout: true,
  courses: 0,
  posts: 0,
  updatedAt: new Date().toISOString(),
});

/*
 * Studio → Instructors: the people shown on course pages, blog posts, the home
 * page and the About page. Pick them in the course editor and blog editor.
 */
export function InstructorManager({ seed }: { seed: StudioInstructor[] }) {
  const { items, save, remove } = useServerCollection(seed, { save: saveInstructor, remove: deleteInstructor });
  const [editing, setEditing] = useState<StudioInstructor | null>(null);
  const [confirm, setConfirm] = useState<StudioInstructor | null>(null);
  const { show, toast } = useToast();

  return (
    <>
      <ManageTable
        title="Instructors"
        items={items}
        getId={(i) => i.id}
        minWidth="44rem"
        searchText={(i) => [i.name, i.specialty, i.email]}
        searchPlaceholder="Search name or specialty"
        initialSort={{ key: "order", dir: 1 }}
        onRowClick={(i) => setEditing(i)}
        toolbar={
          <button type="button" onClick={() => setEditing(blank(items.length))} className={`${primaryButton} h-10`}>
            <PlusIcon className="size-4" /> Add instructor
          </button>
        }
        columns={[
          {
            key: "name",
            header: "Instructor",
            sort: (i) => i.name,
            render: (i) => (
              <span className="flex items-center gap-3">
                <UserAvatar src={i.image || null} name={i.name} pixels={72} className="size-9 text-xs" />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{i.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{i.specialty || "No specialty yet"}</span>
                </span>
              </span>
            ),
          },
          { key: "courses", header: "Courses", align: "right", sort: (i) => i.courses, render: (i) => <span className="tabular-nums">{i.courses}</span> },
          { key: "posts", header: "Posts", align: "right", sort: (i) => i.posts, render: (i) => <span className="tabular-nums">{i.posts}</span> },
          {
            key: "about",
            header: "About page",
            sort: (i) => (i.showOnAbout ? 1 : 0),
            render: (i) => <span className={i.showOnAbout ? "text-foreground" : "text-muted-foreground"}>{i.showOnAbout ? "Shown" : "Hidden"}</span>,
          },
          { key: "order", header: "Order", align: "right", sort: (i) => i.position, render: (i) => <span className="tabular-nums text-muted-foreground">{i.position + 1}</span> },
        ]}
        actions={(i) => (
          <RowMenu
            label={`Actions for ${i.name}`}
            items={[
              { label: "Edit", icon: PencilIcon, onSelect: () => setEditing(i) },
              { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setConfirm(i) },
            ]}
          />
        )}
        empty={<p className="text-muted-foreground">No instructors yet. Add the people who teach your courses.</p>}
      />

      {editing && (
        <InstructorDrawer
          key={editing.id}
          instructor={editing}
          taken={items.filter((i) => i.id !== editing.id).map((i) => i.slug)}
          onClose={() => setEditing(null)}
          onSave={async (next) => {
            const saved = await save(next);
            if (saved) {
              setEditing(null);
              show(`${saved.name} saved`);
            }
          }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm.name}?`}
          body={
            confirm.courses || confirm.posts
              ? `They're listed on ${confirm.courses} ${confirm.courses === 1 ? "course" : "courses"} and ${confirm.posts} ${confirm.posts === 1 ? "post" : "posts"}, which will show "The Ultimate Deejays team" instead.`
              : "They'll be removed from the site."
          }
          confirmLabel="Delete instructor"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const instructor = confirm;
            setConfirm(null);
            remove(instructor.id).then((done) => done && show(`${instructor.name} deleted`));
          }}
        />
      )}
      {toast}
    </>
  );
}

function InstructorDrawer({
  instructor,
  taken,
  onClose,
  onSave,
}: {
  instructor: StudioInstructor;
  taken: string[];
  onClose: () => void;
  onSave: (next: StudioInstructor) => Promise<void>;
}) {
  const titleId = useId();
  const isNew = !instructor.name;
  const [draft, setDraft] = useState(instructor);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof StudioInstructor>(key: K, value: StudioInstructor[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const slugTaken = taken.includes(draft.slug);

  async function submit() {
    if (draft.name.trim().length < 2) return setError("Enter their name.");
    if (!draft.slug) return setError("Add a profile URL.");
    if (slugTaken) return setError("Another instructor already uses that profile URL.");
    setError("");
    setBusy(true);
    await onSave(draft);
    setBusy(false);
  }

  return (
    <Drawer
      titleId={titleId}
      onClose={onClose}
      header={
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {isNew ? "Add instructor" : `Edit ${instructor.name}`}
        </h2>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : <span />}
          <button type="button" disabled={busy} onClick={submit} className={primaryButton}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <Field label="Photo" htmlFor="instructor-photo" hint="Square photos work best; shown in circles and cards.">
        <ThumbnailPicker id="instructor-photo" folder="instructors" size={{ width: 640, height: 640 }} value={draft.image} onChange={(src) => set("image", src)} />
      </Field>
      <Field label="Name" htmlFor="instructor-name" required>
        <Input
          id="instructor-name"
          value={draft.name}
          maxLength={80}
          onChange={(e) => {
            set("name", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="Profile URL" htmlFor="instructor-slug" error={slugTaken ? "Already used by another instructor." : undefined} hint="Used to identify them; lowercase letters, numbers and dashes.">
        <Input
          id="instructor-slug"
          value={draft.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="Specialty" htmlFor="instructor-specialty" hint='Shown under their name, e.g. "Scratch & Turntablism".'>
        <Input id="instructor-specialty" value={draft.specialty} maxLength={80} onChange={(e) => set("specialty", e.target.value)} />
      </Field>
      <Field label="Bio" htmlFor="instructor-bio" hint="Two or three sentences for course pages and blog posts.">
        <Textarea id="instructor-bio" rows={5} maxLength={1000} value={draft.bio} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="instructor-email" hint="Private. For your team's reference only.">
        <Input id="instructor-email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
      </Field>
      <Field label="Display order" htmlFor="instructor-order" hint="1 is shown first on the home and About pages.">
        <Input id="instructor-order" type="number" min={1} value={draft.position + 1} onChange={(e) => set("position", Math.max(0, (Number(e.target.value) || 1) - 1))} />
      </Field>
      <Switch id="instructor-about" label="Show on the About page" checked={draft.showOnAbout} onChange={(on) => set("showOnAbout", on)} />
    </Drawer>
  );
}
