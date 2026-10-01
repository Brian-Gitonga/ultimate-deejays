"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { validateName } from "@/lib/auth";
import { experienceOptions, fileToAvatar, genreOptions, useProfile, type Profile } from "@/lib/profile-store";
import { AccountCard } from "./account-card";
import { FormMessage, TextField } from "./auth-form-parts";
import { CameraIcon, CheckIcon } from "./icons";

const BIO_MAX = 280;

type Status = { status: "idle" | "error" | "notice"; message?: string };

/*
 * Wraps the editor so it restarts from the saved profile whenever the saved
 * profile changes (first load from storage, or after saving).
 */
export function ProfileForm() {
  const [profile, save] = useProfile();
  const [status, setStatus] = useState<Status>({ status: "idle" });
  return (
    <ProfileEditor
      key={JSON.stringify(profile)}
      initial={profile}
      status={status}
      onSave={(next) => {
        try {
          save(next);
          setStatus({ status: "notice", message: "Profile saved. Your changes show across your account." });
        } catch (error) {
          setStatus({ status: "error", message: (error as Error).message });
        }
      }}
      onError={(message) => setStatus({ status: "error", message })}
    />
  );
}

function validate(p: Profile) {
  const errors: Record<string, string> = {};
  const nameError = validateName(p.fullName.trim());
  if (nameError) errors.fullName = nameError;
  if (p.djName.length > 40) errors.djName = "Keep your DJ name to 40 characters or fewer.";
  if (p.bio.length > BIO_MAX) errors.bio = `Keep your bio to ${BIO_MAX} characters.`;
  if (p.instagram && !/^@?[A-Za-z0-9._]{1,30}$/.test(p.instagram)) errors.instagram = "Enter your Instagram handle, like @djjordan.";
  if (p.soundcloud && !/^https:\/\/(www\.|on\.)?soundcloud\.com\/\S+$/.test(p.soundcloud))
    errors.soundcloud = "Paste your full SoundCloud link, starting with https://soundcloud.com/.";
  return errors;
}

function ProfileEditor({
  initial,
  status,
  onSave,
  onError,
}: {
  initial: Profile;
  status: Status;
  onSave: (profile: Profile) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyPhoto, setBusyPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  async function pickPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return onError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 8 * 1024 * 1024) return onError("That photo is over 8 MB. Choose a smaller one.");
    setBusyPhoto(true);
    try {
      set("avatar", await fileToAvatar(file));
    } catch {
      onError("We couldn't read that photo. Try a different file.");
    } finally {
      setBusyPhoto(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = { ...draft, fullName: draft.fullName.trim(), djName: draft.djName.trim(), instagram: draft.instagram.trim().replace(/^@/, "") };
    const found = validate(trimmed);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    // TODO: send `trimmed` to your API (and upload the avatar to storage) once accounts exist.
    onSave(trimmed);
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-muted-foreground">This is how you appear on challenges, in the community and to your instructors.</p>
      </div>

      <FormMessage state={status} />

      <AccountCard title="Photo & identity">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative w-fit">
            <Image
              src={draft.avatar}
              alt="Your profile photo"
              width={192}
              height={192}
              unoptimized={draft.avatar.startsWith("data:")}
              className={`size-24 rounded-full object-cover ring-4 ring-brand/15 transition sm:size-28 ${busyPhoto ? "opacity-50" : ""}`}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
              className="absolute -right-1 -bottom-1 flex size-10 items-center justify-center rounded-full bg-[#18181b] text-white shadow-lg ring-4 ring-card transition hover:scale-105 dark:bg-foreground dark:text-background"
            >
              <CameraIcon className="size-[1.125rem]" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <TextField
              name="fullName"
              label="Full name"
              autoComplete="name"
              value={draft.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              error={errors.fullName}
            />
            <TextField
              name="djName"
              label="DJ name"
              autoComplete="nickname"
              placeholder="e.g. DJ Jordan"
              value={draft.djName}
              onChange={(e) => set("djName", e.target.value)}
              error={errors.djName}
            />
          </div>
        </div>
      </AccountCard>

      <AccountCard title="About you" description="Help instructors tailor their feedback to you.">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="email" label="Email" value={draft.email} readOnly hint="Change it in Settings." />
            <TextField
              name="location"
              label="Location"
              autoComplete="address-level2"
              placeholder="City, country"
              value={draft.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-sm font-medium text-foreground">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={draft.bio}
              onChange={(e) => set("bio", e.target.value)}
              aria-invalid={errors.bio ? true : undefined}
              aria-describedby="bio-count"
              placeholder="What do you play, and what are you working toward?"
              className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-[0.9375rem] text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/80 hover:border-foreground/20 focus:border-brand focus:ring-4 focus:ring-brand/15 aria-invalid:border-red-500"
            />
            <p id="bio-count" className={`mt-1.5 text-right text-xs ${draft.bio.length > BIO_MAX ? "text-red-600" : "text-muted-foreground"}`}>
              {errors.bio ?? `${draft.bio.length}/${BIO_MAX}`}
            </p>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-foreground">Experience</legend>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {experienceOptions.map((option) => {
                const checked = draft.experience === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative cursor-pointer rounded-xl border p-3.5 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 ${
                      checked ? "border-brand bg-brand/[0.06]" : "border-border hover:border-foreground/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name="experience"
                      value={option.value}
                      checked={checked}
                      onChange={() => set("experience", option.value)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.hint}</span>
                    {checked && <CheckIcon className="absolute top-3 right-3 size-4 text-brand" strokeWidth={3} />}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-foreground">
              Genres you play <span className="font-normal text-muted-foreground">({draft.genres.length} selected)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((genre) => {
                const on = draft.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("genres", on ? draft.genres.filter((g) => g !== genre) : [...draft.genres, genre])}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition ${
                      on
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-background text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {on && <CheckIcon className="size-3.5" strokeWidth={3} />}
                    {genre}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </AccountCard>

      <AccountCard title="Links" description="Show off your mixes. Both are optional.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="instagram"
            label="Instagram"
            placeholder="@yourhandle"
            value={draft.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            error={errors.instagram}
          />
          <TextField
            name="soundcloud"
            label="SoundCloud"
            type="url"
            inputMode="url"
            placeholder="https://soundcloud.com/you"
            value={draft.soundcloud}
            onChange={(e) => set("soundcloud", e.target.value)}
            error={errors.soundcloud}
          />
        </div>
      </AccountCard>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-border bg-background/90 p-3 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl">
        <p className="mr-auto pl-2 text-sm text-muted-foreground">{dirty ? "You have unsaved changes" : "All changes saved"}</p>
        <button
          type="button"
          disabled={!dirty}
          onClick={() => {
            setDraft(initial);
            setErrors({});
          }}
          className="h-10 rounded-lg px-4 text-sm font-medium text-foreground hover:bg-foreground/5 disabled:opacity-40"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={!dirty || busyPhoto}
          className="h-10 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white transition hover:bg-[#27272a] disabled:opacity-40 dark:bg-foreground dark:text-background"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}
