"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="masthead">
      <div className="site-shell masthead-inner">
        <Link className="brand" href="/" aria-label="WhyThisMoment home">
          <span className="brand-mark" aria-hidden="true" />
          <span>WhyThisMoment</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
            Matches
          </Link>
          <Link
            href="/method"
            aria-current={pathname === "/method" ? "page" : undefined}
          >
            Method
          </Link>
          <Link
            href="/about"
            aria-current={pathname === "/about" ? "page" : undefined}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
