import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our method",
  description:
    "How WhyThisMoment grounds cricket explanations in ball-by-ball data, and what it cannot know.",
};

export default function MethodPage() {
  return (
    <main className="site-shell method-page" id="main-content">
      <div className="eyebrow">A scorecard can show what. Not always why.</div>
      <h1 className="prose-heading">
        An explanation
        <br />
        with its receipts.
      </h1>
      <p className="prose-lede">
        WhyThisMoment starts with the delivery record, not a confident-sounding
        story. We show the match facts first, then label the tactical read as a
        likelihood, and leave the unknowable in plain sight.
      </p>
      <section className="method-grid">
        <h2>01 / Match record</h2>
        <div>
          <p>
            Three past IPL matches are bundled from Cricsheet’s ball-by-ball
            JSON archive. Score, wickets, runs, phase, bowler changes,
            partnerships and required rate are computed from those deliveries.
            Every confirmed line points back to a scorecard location.
          </p>
          <p>
            The strip has one mark per recorded delivery. A wicket, boundary,
            dot, ordinary run and extra each have a distinct visual treatment.
            It remains a replay of the record—not a live feed.
          </p>
        </div>
      </section>
      <section className="method-grid">
        <h2>02 / Likely read</h2>
        <div>
          <p>
            A language model may connect the recorded situation to a plausible
            tactical explanation. It is instructed to use only supplied match
            facts, call intent “likely”, and give a confidence label plus
            evidence that could change its view. The explanation is precomputed
            so the demo works without a live AI request.
          </p>
          <p>
            Win probability is explicitly an estimate: first-innings score is
            mapped through a simple logistic curve around a 150-run reference;
            during a chase, required runs per ball are compared with a
            wickets-left-adjusted scoring rate. It is not calibrated, not
            official, and not predictive advice.
          </p>
        </div>
      </section>
      <section className="method-grid">
        <h2>03 / What we won’t claim</h2>
        <div>
          <p>
            Ball-by-ball files do not reliably say what the captain intended,
            what was said in the huddle, where every fielder stood, or what kind
            of bowler delivered the ball. If that information is absent, the
            site does not infer it. Spinner-in-powerplay, batting-order
            surprises and reviews are surfaced only when the source records
            enough evidence; this archive may not.
          </p>
          <p>
            Impact from weather, pitch, injuries, player skill and live odds is
            outside this prototype’s model. The fantasy note is general context
            only. It never makes betting, captaincy or lineup recommendations.
          </p>
        </div>
      </section>
      <section className="method-grid">
        <h2>04 / Generated answers</h2>
        <div>
          <p>
            Gemini outputs are validated against a strict schema before they are
            stored. If generation is unavailable, the build produces a clearly
            cautious, scorecard-grounded explanation. Follow-up questions are
            sent to Google only after you submit one, and are rate-limited
            server-side. No API key is shipped to the browser.
          </p>
        </div>
      </section>
    </main>
  );
}
