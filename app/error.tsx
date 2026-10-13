"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="site-shell error-page" id="main-content">
      <div className="eyebrow">Something interrupted the replay</div>
      <h1>We lost the thread.</h1>
      <p>
        The match record could not be opened just now. Your place is still here.
      </p>
      <button className="button" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
