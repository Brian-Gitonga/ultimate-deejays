"use client";

import { dismissStudioError, useStudioNotices } from "@/lib/studio-store";
import { CloseIcon } from "../icons";

/* The studio's error banner: anything a save or delete couldn't do, with the reason. */
export function StudioNotices() {
  const notices = useStudioNotices();
  if (!notices.length) return null;
  return (
    <div role="alert" className="sticky top-16 z-20 space-y-2 px-4 pt-4 sm:px-6 lg:px-8">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className="mx-auto flex max-w-[90rem] items-start gap-3 rounded-xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg dark:bg-red-950/80 dark:text-red-200"
        >
          <p className="flex-1">{notice.message}</p>
          <button type="button" onClick={() => dismissStudioError(notice.id)} aria-label="Dismiss" className="-m-1 rounded-md p-1 hover:bg-red-500/10">
            <CloseIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
