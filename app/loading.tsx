export default function Loading() {
  return (
    <main
      className="site-shell error-page"
      id="main-content"
      aria-busy="true"
      aria-label="Loading match"
    >
      <div className="eyebrow">Opening the scorebook</div>
      <div className="loading-line" />
      <div className="loading-line" />
    </main>
  );
}
