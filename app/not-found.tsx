import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-shell error-page" id="main-content">
      <div className="eyebrow">404 · Ball lost</div>
      <h1>Not in the scorebook.</h1>
      <p>
        That page isn’t part of this archive. The match is still on—just not
        here.
      </p>
      <Link className="button" href="/">
        Back to the matches
      </Link>
    </main>
  );
}
