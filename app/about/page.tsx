import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WhyThisMoment",
  description:
    "A fan-first explanation of the tactical moments that make live cricket hard to follow.",
};

export default function AboutPage() {
  return (
    <main className="site-shell about-page" id="main-content">
      <div className="eyebrow">
        Built for the moment you ask your group chat
      </div>
      <h1 className="prose-heading">
        “Wait. Why
        <br />
        did that just
        <br />
        happen?”
      </h1>
      <p className="prose-lede">
        A live match moves faster than its explanations. A bowler comes on, a
        batter is moved up, or a wicket breaks a stand—and fans are left piecing
        together the why from clipped highlights and loud opinions.
      </p>
      <section className="method-grid" style={{ marginTop: "4rem" }}>
        <h2>The fan</h2>
        <div>
          <p>
            Someone who loves the match but does not have a broadcast analyst
            beside them. They are curious, not uninformed. They need a quick,
            plain-language explanation and a way to check the evidence, without
            being told a guess is a fact.
          </p>
        </div>
      </section>
      <section className="method-grid">
        <h2>The response</h2>
        <div>
          <p>
            WhyThisMoment turns the scorecard into a replayable trail. The
            answer has three boundaries: confirmed data, a clearly labelled
            likely reading, and the part only a player or coach can know. Go
            deeper when you want the numbers; keep it simple when you do not.
          </p>
        </div>
      </section>
      <section className="method-grid">
        <h2>Credits</h2>
        <div>
          <p>
            Historical match files are from{" "}
            <a className="small-link" href="https://cricsheet.org/">
              Cricsheet
            </a>
            . Their downloadable ball-by-ball archive is the source for the
            bundled IPL matches; please read Cricsheet’s current data terms and
            attribution guidance before reusing the files.
          </p>
          <p>
            Optional generated explanations and live follow-ups use the{" "}
            <a className="small-link" href="https://ai.google.dev/gemini-api">
              Google Gemini API
            </a>
            . The AI is not the source of match statistics: those are computed
            server-side from the bundled scorecard.
          </p>
        </div>
      </section>
    </main>
  );
}
