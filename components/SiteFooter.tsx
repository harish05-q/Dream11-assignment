import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true" />
            WhyThisMoment
          </Link>
          <p>Past matches. Real deliveries. Honest explanations.</p>
          <p>Match data: Cricsheet, used under its published terms.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/method">How it works</Link>
          <Link href="/about">About this project</Link>
        </nav>
      </div>
    </footer>
  );
}
