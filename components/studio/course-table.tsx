"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { findTopic, formatDuration } from "@/lib/course-taxonomy";
import { plans } from "@/lib/plans";
import { matchesQuery } from "@/lib/search";
import { lessonsOf, totalSeconds, uid, type StudioCourse, type StudioStatus } from "@/lib/studio-courses";
import { useStudioCourses } from "@/lib/studio-store";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
} from "../icons";
import { StatusBadge } from "./status";
import { Select, primaryButton, secondaryButton } from "./ui";

type SortKey = "updated" | "title" | "students" | "rating";

// The table scroller is position:relative so sr-only labels inside it can't widen the page on phones.
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const planName = (slug: string) => plans.find((p) => p.slug === slug)?.name ?? slug;

export function CourseTable({ seed }: { seed: StudioCourse[] }) {
  const { courses, save, remove } = useStudioCourses(seed);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StudioStatus | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "updated", dir: -1 });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<StudioCourse | null>(null);
  const [toast, setToast] = useState("");

  const counts = {
    all: courses.length,
    published: courses.filter((c) => c.status === "published").length,
    review: courses.filter((c) => c.status === "review").length,
    draft: courses.filter((c) => c.status === "draft").length,
  };

  const filtered = courses
    .filter((c) => status === "all" || c.status === status)
    .filter((c) => matchesQuery([c.title, c.instructor.name, findTopic(c.subcategory || c.category)?.topic.name ?? ""], query))
    .sort((a, b) => {
      const v =
        sort.key === "title"
          ? a.title.localeCompare(b.title)
          : sort.key === "students"
            ? a.students - b.students
            : sort.key === "rating"
              ? a.rating - b.rating
              : a.updatedAt.localeCompare(b.updatedAt);
      return v * sort.dir;
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "title" ? 1 : -1 }));
  }

  function duplicate(course: StudioCourse) {
    const copy: StudioCourse = {
      ...course,
      id: uid(),
      slug: `${course.slug}-copy-${uid().slice(0, 4)}`,
      title: `${course.title} (copy)`,
      status: "draft",
      students: 0,
      rating: 0,
    };
    save(copy);
    flash(`Duplicated as a draft: ${copy.title}`);
  }

  const tabs: { key: StudioStatus | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "review", label: "In review" },
    { key: "draft", label: "Drafts" },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]" aria-labelledby="course-list-title">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="course-list-title" className="text-base font-semibold text-foreground">
            Course list
          </h2>
          <div role="tablist" aria-label="Filter by status" className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto px-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={status === tab.key}
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                  status === tab.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 text-xs tabular-nums ${status === tab.key ? "bg-background/20" : "bg-foreground/[0.07]"}`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-72">
            <label htmlFor="course-table-search" className="sr-only">
              Search courses
            </label>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="course-table-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search title, instructor, category"
              className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <div className="w-24">
            <label htmlFor="page-size" className="sr-only">
              Rows per page
            </label>
            <Select
              id="page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-10 text-sm"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {rows.length ? (
        <div className="relative overflow-x-auto" data-lenis-prevent-horizontal>
          <table className="w-full min-w-[60rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <SortHeader label="Course" sortKey="title" sort={sort} onSort={toggleSort} className="pl-6" />
                <th scope="col" className="px-3 py-3 font-medium">Status</th>
                <th scope="col" className="px-3 py-3 font-medium">Category</th>
                <th scope="col" className="px-3 py-3 font-medium">Access</th>
                <th scope="col" className="px-3 py-3 font-medium">Content</th>
                <SortHeader label="Students" sortKey="students" sort={sort} onSort={toggleSort} align="right" />
                <SortHeader label="Rating" sortKey="rating" sort={sort} onSort={toggleSort} align="right" />
                <SortHeader label="Updated" sortKey="updated" sort={sort} onSort={toggleSort} align="right" />
                <th scope="col" className="px-6 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((course) => {
                const topic = findTopic(course.subcategory || course.category);
                return (
                  <tr key={course.id} className="transition hover:bg-muted/40">
                    <td className="py-3 pr-3 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted">
                          {course.thumbnail && (
                            <Image src={course.thumbnail} alt="" fill sizes="72px" unoptimized={course.thumbnail.startsWith("data:")} className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[22rem]">
                          <Link href={`/studio/courses/${course.id}/edit`} className="line-clamp-2 font-medium text-foreground hover:text-brand">
                            {course.title || "Untitled course"}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {course.instructor.name} · {course.instructor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-foreground">{topic?.parent?.name ?? topic?.topic.name ?? "—"}</p>
                      {topic?.parent && <p className="text-xs text-muted-foreground">{topic.topic.name}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/80">{planName(course.access)}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {lessonsOf(course).length} lessons
                      <span className="block text-xs">{formatDuration(Math.round(totalSeconds(course) / 60))}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-foreground tabular-nums">{course.students.toLocaleString("en-US")}</td>
                    <td className="px-3 py-3 text-right">
                      {course.rating ? (
                        <span className="inline-flex items-center gap-1 text-foreground tabular-nums">
                          <StarIcon fill="currentColor" className="size-3.5 text-accent-amber" />
                          {course.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-muted-foreground">{dateFormat.format(new Date(course.updatedAt))}</td>
                    <td className="px-6 py-3 text-right">
                      <RowMenu course={course} onDuplicate={() => duplicate(course)} onDelete={() => setConfirmDelete(course)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">{courses.length ? "No courses match your search" : "No courses yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length ? "Try another keyword or status." : "Create your first course to get started."}
          </p>
          <Link href="/studio/courses/new" className={`${primaryButton} mt-5`}>
            <PlusIcon className="size-4" /> Create course
          </Link>
        </div>
      )}

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border px-5 py-4 sm:flex-row sm:px-6">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length ? start + 1 : 0}</span> to{" "}
          <span className="font-semibold text-foreground">{start + rows.length}</span> of{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span> courses
        </p>
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <PageButton label="First page" icon={ChevronsLeftIcon} disabled={current === 1} onClick={() => setPage(1)} />
          <PageButton label="Previous page" icon={ChevronLeftIcon} disabled={current === 1} onClick={() => setPage(current - 1)} />
          <span className="px-2 text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{current}</span> of {pageCount}
          </span>
          <PageButton label="Next page" icon={ChevronRightIcon} disabled={current === pageCount} onClick={() => setPage(current + 1)} />
          <PageButton label="Last page" icon={ChevronsRightIcon} disabled={current === pageCount} onClick={() => setPage(pageCount)} />
        </nav>
      </div>

      {confirmDelete && (
        <ConfirmDelete
          course={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            remove(confirmDelete.id);
            flash(`Deleted: ${confirmDelete.title}`);
            setConfirmDelete(null);
          }}
        />
      )}

      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50">
        {toast && <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-2xl">{toast}</p>}
      </div>
    </section>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={`px-3 py-3 font-medium ${align === "right" ? "text-right" : ""} ${className}`}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}>
        {label}
        <ChevronDownIcon className={`size-3.5 transition ${active ? (sort.dir === 1 ? "rotate-180" : "") : "opacity-30"}`} />
      </button>
    </th>
  );
}

function PageButton({ label, icon: Icon, disabled, onClick }: { label: string; icon: typeof ChevronLeftIcon; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition hover:bg-muted disabled:opacity-40"
    >
      <Icon className="size-4" />
    </button>
  );
}

function RowMenu({ course, onDuplicate, onDelete }: { course: StudioCourse; onDuplicate: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-foreground/5";

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${course.title}`}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl">
          <Link role="menuitem" href={`/studio/courses/${course.id}/edit`} className={item}>
            <PencilIcon className="size-4 text-muted-foreground" /> Edit course
          </Link>
          {course.status === "published" && (
            <Link role="menuitem" href={`/courses/${course.slug}`} target="_blank" className={item}>
              <ArrowUpRightIcon className="size-4 text-muted-foreground" /> View on site
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            className={item}
          >
            <PlusIcon className="size-4 text-muted-foreground" /> Duplicate
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className={`${item} text-red-600 hover:bg-red-500/10 dark:text-red-400`}
          >
            <CloseIcon className="size-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ConfirmDelete({ course, onCancel, onConfirm }: { course: StudioCourse; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"
      >
        <h2 id="delete-title" className="text-lg font-semibold text-foreground">
          Delete this course?
        </h2>
        <p id="delete-desc" className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{course.title}</span>
          {course.students ? ` has ${course.students.toLocaleString("en-US")} enrolled students.` : ""} This removes the course and all its
          lessons. It can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
            Delete course
          </button>
        </div>
      </div>
    </div>
  );
}
