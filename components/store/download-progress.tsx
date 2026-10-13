import { useEffect, useRef, useState, type MouseEvent } from "react";
import { DOWNLOAD_COOKIE } from "@/lib/store";
import { CheckIcon, DownloadIcon } from "../icons";

export type DownloadState = "idle" | "preparing" | "started";

const CHECK_EVERY = 250;
/** No sign of it by then (a link that opened a page, cookies blocked): stop waiting. */
const GIVE_UP_AFTER = 45_000;
/** How long "started" shows before the link goes back to normal. */
const STARTED_FOR = 4000;

const newToken = () => (Date.now().toString(36) + Math.random().toString(36).slice(2, 12)).slice(0, 32);
const hasCookie = (token: string) => document.cookie.split("; ").includes(`${DOWNLOAD_COOKIE}=${token}`);
const clearCookie = () => {
  document.cookie = `${DOWNLOAD_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
};

/**
 * A download link's progress: "preparing" until the file starts, "started"
 * for a few seconds, then "idle" again. The link carries a token the download
 * route sends back as a cookie when the file starts (see DOWNLOAD_COOKIE).
 * `onStarted` runs then, e.g. to update the downloads left.
 */
export function useDownload(onStarted?: () => void) {
  const [state, setState] = useState<DownloadState>("idle");
  const timer = useRef<number | undefined>(undefined);
  const busy = useRef(false);
  const latest = useRef(onStarted);

  useEffect(() => {
    latest.current = onStarted;
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function start(href: string) {
    if (busy.current) return;
    busy.current = true;
    const token = newToken();
    const url = new URL(href, window.location.href);
    url.searchParams.set("t", token);
    clearCookie();
    setState("preparing");

    const since = Date.now();
    const check = () => {
      const arrived = hasCookie(token);
      if (!arrived && Date.now() - since < GIVE_UP_AFTER) {
        timer.current = window.setTimeout(check, CHECK_EVERY);
        return;
      }
      clearCookie();
      busy.current = false;
      latest.current?.();
      if (!arrived) return setState("idle");
      setState("started");
      timer.current = window.setTimeout(() => setState("idle"), STARTED_FOR);
    };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(check, CHECK_EVERY);
    // A download keeps the page; a refusal (log in, no downloads left) loads the page it sends them to.
    window.location.assign(url.toString());
  }

  /** onClick for a download link. Leaves ctrl/cmd-clicks and links already handled alone. */
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    start(event.currentTarget.href);
  }

  return { state, follow };
}

/* A download link's icon: an arrow, a spinner while the file is prepared, a tick once it's on its way. */
export function DownloadStateIcon({ state }: { state: DownloadState }) {
  if (state === "preparing")
    return <span aria-hidden="true" className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />;
  if (state === "started") return <CheckIcon className="size-4 shrink-0" />;
  return <DownloadIcon className="size-4 shrink-0" />;
}
