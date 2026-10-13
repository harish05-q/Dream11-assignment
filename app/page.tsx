import Link from "next/link";
import { getMatch, getMatches } from "@/lib/data";
import type { MatchIndexEntry, RawMatch } from "@/lib/types";

function featuredScore(raw: RawMatch) {
  return raw.innings.map((innings) => {
    const deliveries = innings.overs.flatMap((over) => over.deliveries);
    const runs = deliveries.reduce((total, item) => total + item.runs.total, 0);
    const wickets = deliveries.reduce(
      (total, item) => total + (item.wickets?.length ?? 0),
      0,
    );
    return { team: innings.team, score: `${runs}/${wickets}` };
  });
}

export default async function HomePage() {
  const matches = await getMatches();
  const featuredInfo = matches[0];
  const featured = featuredInfo ? await getMatch(featuredInfo.id) : null;
  const scores = featured ? featuredScore(featured.raw) : [];
  const moments = featured?.analysis.moments ?? [];
  const teaserMoment =
    moments.find(
      (moment) =>
        moment.type === "big-over" || moment.type === "partnership-break",
    ) ?? moments[0];
  return (
    <main id="main-content">
      <section className="site-shell home-hero">
        <div>
          <div className="eyebrow">
            The moment is obvious. The reason isn’t.
          </div>
          <h1 className="display">
            Cricket, with
            <br />
            the moment
            <br />
            explained.
          </h1>
        </div>
        <div className="hero-note">
          <p>
            That bowling change. That wicket straight after. Get a clear answer
            without scrolling through a hundred hot takes.
          </p>
          <Link className="small-link" href="/method">
            See how we separate fact from theory
          </Link>
        </div>
      </section>

      {featured && teaserMoment && (
        <section className="site-shell" aria-label="Featured moment">
          <div className="eyebrow">A moment to start with · IPL archive</div>
          <Link
            className="live-teaser"
            href={`/match/${featured.info.id}?moment=${teaserMoment.id}`}
          >
            <div className="teaser-title">
              <div>{teaserMoment.title}</div>
              <p>
                {featured.info.teams.join(" v ")} · {featured.info.date} · OVER{" "}
                {teaserMoment.over + 1}
              </p>
            </div>
            <div className="teaser-score">
              {scores.map((item, index) => (
                <span key={item.team}>
                  {item.score}
                  <small> {item.team}</small>
                  {index < scores.length - 1 ? "  /  " : ""}
                </span>
              ))}
            </div>
            <span className="button" aria-label="Open this moment">
              Open moment <span aria-hidden="true">↗</span>
            </span>
          </Link>
        </section>
      )}

      <section
        className="site-shell match-library"
        aria-labelledby="library-title"
      >
        <div className="section-label">
          <h2 id="library-title">Pick up a match</h2>
          <span>THREE REAL IPL FIXTURES · CRICSHEET</span>
        </div>
        <div className="match-grid">
          {matches.map((match, index) => (
            <MatchCard key={match.id} match={match} number={index + 1} />
          ))}
        </div>
        <p
          className="muted"
          style={{ font: ".67rem var(--mono)", marginTop: "1rem" }}
        >
          This is an archive, not a live score service. The matches are selected
          automatically for tactical texture.
        </p>
      </section>
    </main>
  );
}

function MatchCard({
  match,
  number,
}: {
  match: MatchIndexEntry;
  number: number;
}) {
  return (
    <Link className="match-card" href={`/match/${match.id}`}>
      <span className="card-number">
        0{number} / {match.date}
      </span>
      <h3>
        {match.teams[0]}
        <br />
        <span className="muted">v</span> {match.teams[1]}
      </h3>
      <p>{match.whyInteresting}</p>
      <div className="card-meta">
        {match.venue}
        <span className="card-result">{match.result}</span>
      </div>
    </Link>
  );
}
