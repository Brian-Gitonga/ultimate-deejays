import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "./icons";

/*
 * Title band for inner pages. Like the home hero, it's pulled up under the
 * sticky header so the cream backdrop runs behind the nav.
 */
export function PageHeader({ title }: { title: string }) {
  return (
    <div className="page-header-backdrop -mt-20 pt-20 lg:-mt-[5.5rem] lg:pt-[5.5rem]">
      <div className="site-container py-16 text-center sm:py-20 lg:py-24">
        <h1 className="text-[2.5rem] leading-tight font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
        <nav aria-label="Breadcrumb" className="mt-3">
          <ol className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="flex items-center text-foreground transition hover:text-brand">
                <HomeIcon className="size-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3.5" />
            </li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
      </div>
    </div>
  );
}
