"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useExperienceStore } from "@/lib/store";
import type {
  AnalyzedMatch,
  Ball,
  Explanation,
  MatchIndexEntry,
  Moment,
  RawMatch,
} from "@/lib/types";
import { BallStrip } from "./BallStrip";
import { WormChart } from "./WormChart";

type Props = {
  info: MatchIndexEntry;
  raw: RawMatch;
  analysis: AnalyzedMatch;
  explanations: Record<string, Explanation>;
};

const formatScore = (balls: Ball[]) => {
  const last = balls.at(-1);
  return last ? `${last.score}/${last.wickets}` : "0/0";
};

const questionsFor: Record<Moment["type"], string[]> = {
  "bowling-change": [
    "What had changed in the previous over?",
    "Was this bowler effective in this phase?",
    "What can the scorecard tell us?",
  ],
  "powerplay-spinner": [
    "What does the powerplay mean?",
    "How did the over finish?",
    "What data is missing here?",
  ],
  "big-over": [
    "Which balls made this over big?",
    "Was this above the innings' usual rate?",
    "What changed after this over?",
  ],
  "dot-pressure": [
    "How many dots were in the sequence?",
    "What happened on the next ball?",
    "Did the asking rate move?",
  ],
  "partnership-break": [
    "How long had this pair batted?",
    "What happened immediately after?",
    "Can we know why the wicket fell?",
  ],
  "batting-order": [
    "What does batting order mean?",
    "How did the new batter start?",
    "What can the scorecard tell us?",
  ],
  review: [
    "What is a review in cricket?",
    "What do these records show?",
    "What remains unknown?",
  ],
};

function MomentDetail({
  moment,
  ball,
  explanation,
  depth,
  lang,
  onDepth,
  onLang,
  matchId,
  analysis,
}: {
  moment: Moment | null;
  ball: Ball | null;
  explanation: Explanation | null;
  depth: "new-fan" | "nerd";
  lang: "en" | "hi";
  onDepth: (depth: "new-fan" | "nerd") => void;
  onLang: (lang: "en" | "hi") => void;
  matchId: string;
  analysis: AnalyzedMatch;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const active = moment;
  const selectedBall = ball;
  const overStats = selectedBall
    ? analysis.overs.find(
        (item) =>
          item.innings === selectedBall.innings &&
          item.over === selectedBall.over,
      )
    : null;
  const comparators = active
    ? analysis.overs.filter(
        (item) =>
          item.innings === active.innings &&
          item.phase ===
            analysis.overs.find(
              (over) =>
                over.innings === active.innings && over.over === active.over,
            )?.phase &&
          item.over !== active.over,
      )
    : [];
  const phaseAverage = comparators.length
    ? comparators.reduce((sum, item) => sum + item.runs, 0) / comparators.length
    : null;
  const momentUrl = active
    ? `/match/${matchId}?moment=${active.id}`
    : `/match/${matchId}`;
  const shareUrl =
    typeof window === "undefined" || !active
      ? ""
      : `${window.location.origin}/share/${matchId}/${active.id}`;
  const replayUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${momentUrl}`;

  const ask = async (text: string) => {
    if (!active || text.trim().length < 4) return;
    setQuestion(text);
    setBusy(true);
    setAnswer("");
    setNotice("");
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          momentId: active.id,
          question: text,
          depth,
          lang,
        }),
      });
      if (!response.ok || !response.body) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error ?? "Follow-up is unavailable right now.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setAnswer(content);
      }
      content += decoder.decode();
      setAnswer(content);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Follow-up is unavailable right now.",
      );
      setAnswer(
        explanation?.reasoning.text ??
          "The saved explanation is still available above.",
      );
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice(
        "Copy was blocked by your browser. Use the address bar to share this moment.",
      );
    }
  };
  const copyReplayLink = async () => {
    try {
      await navigator.clipboard.writeText(replayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice(
        "Copy was blocked by your browser. Use the address bar to share this moment.",
      );
    }
  };

  if (!active) {
    return (
      <motion.aside
        className="detail-panel"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        aria-live="polite"
      >
        <div className="detail-top">
          <span>Ball replay</span>
          <span>
            {selectedBall
              ? `${selectedBall.innings}.${selectedBall.over + 1}.${selectedBall.ball}`
              : "Choose a ball"}
          </span>
        </div>
        <h2>
          {selectedBall
            ? `${selectedBall.total} ${selectedBall.total === 1 ? "run" : "runs"}`
            : "Follow the innings"}
        </h2>
        {selectedBall ? (
          <>
            <p className="detail-summary">
              {selectedBall.batter} faced {selectedBall.bowler}
              {selectedBall.wicket
                ? `; ${selectedBall.wicket} was out`
                : "."}{" "}
              The score moved to {selectedBall.score}/{selectedBall.wickets}.
            </p>
            <div className="explanation-block">
              <div className="block-title">
                CONFIRMED{" "}
                <small>
                  Ball-by-ball data, {selectedBall.over + 1}.{selectedBall.ball}
                </small>
              </div>
              <p className="fact">
                {selectedBall.batterRuns} from the bat; {selectedBall.extras}{" "}
                extras. The over was recorded as {overStats?.runs ?? 0} runs in
                total.
              </p>
              <span className="fact-source">
                Cricsheet delivery record · {selectedBall.id}
              </span>
            </div>
          </>
        ) : (
          <p className="detail-summary">
            Pick any delivery on the strip. Moments have a lime marker; ordinary
            balls still update the score above.
          </p>
        )}
        <Link className="small-link" href="/method">
          How we calculate the replay
        </Link>
      </motion.aside>
    );
  }

  const facts = explanation?.confirmed ?? [];
  const confidence = explanation?.reasoning.confidence ?? "Low";
  const confidenceWidth =
    confidence === "High" ? "100%" : confidence === "Medium" ? "66%" : "34%";
  const suggested = questionsFor[active.type];

  return (
    <motion.aside
      key={active.id}
      className="detail-panel"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      aria-live="polite"
      id="why"
    >
      <div className="detail-top">
        <span>
          Why? · {active.innings === 1 ? "1st innings" : "2nd innings"}
        </span>
        <span>
          {active.over + 1}.{active.ball}
        </span>
      </div>
      <h2>{active.title}</h2>
      <p className="detail-summary">{active.summary}</p>
      <div className="control-row">
        <div className="segmented" aria-label="Explanation depth">
          <button
            type="button"
            aria-pressed={depth === "new-fan"}
            onClick={() => onDepth("new-fan")}
          >
            New fan
          </button>
          <button
            type="button"
            aria-pressed={depth === "nerd"}
            onClick={() => onDepth("nerd")}
          >
            Cricket nerd
          </button>
        </div>
        <div className="segmented" aria-label="Explanation language">
          <button
            type="button"
            aria-pressed={lang === "en"}
            onClick={() => onLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            aria-pressed={lang === "hi"}
            onClick={() => onLang("hi")}
          >
            Hinglish
          </button>
        </div>
      </div>

      <section className="explanation-block">
        <div className="block-title">
          01 · CONFIRMED <small>From the scorecard</small>
        </div>
        {facts.length ? (
          facts.map((fact) => (
            <p className="fact" key={fact.source + fact.text}>
              {fact.text}
              <span className="fact-source">{fact.source}</span>
            </p>
          ))
        ) : (
          <p className="fact">
            Recorded deliveries place the score at{" "}
            {selectedBall?.score ?? overStats?.score}/
            {selectedBall?.wickets ?? overStats?.wickets} after this ball.
            <span className="fact-source">
              Ball-by-ball data, {active.over + 1}.{active.ball}
            </span>
          </p>
        )}
        {overStats && (
          <p className="fact">
            Over {overStats.over + 1} closed at {overStats.score}/
            {overStats.wickets}: {overStats.runs} runs, run rate{" "}
            {overStats.runRate.toFixed(2)}
            {overStats.requiredRate === null
              ? ""
              : `; required rate ${overStats.requiredRate.toFixed(2)}`}
            .
            <span className="fact-source">
              Computed from ball-by-ball data, over {overStats.over + 1}
            </span>
          </p>
        )}
      </section>

      <section className="explanation-block">
        <div className="block-title">
          02 · LIKELY REASONING
          <span className="confidence" aria-label={`${confidence} confidence`}>
            {confidence}
            <i className="confidence-meter">
              <i style={{ width: confidenceWidth }} />
            </i>
          </span>
        </div>
        <p className="reason-text">
          {explanation?.reasoning.text ??
            "This moment changed the immediate shape of the innings. The delivery record shows the change; it cannot tell us the plan behind it."}
        </p>
        <p className="would-change">
          <b>What would change this view:</b>{" "}
          {explanation?.reasoning.wouldChangeIf ??
            "A captain or coach confirming the thinking at the time."}
        </p>
      </section>

      <section className="explanation-block">
        <div className="block-title">
          03 · WE CAN’T KNOW <small>Without the people there</small>
        </div>
        <ul className="cant-know">
          {(
            explanation?.cantKnow ?? [
              "The captain's actual instruction is not in ball-by-ball records.",
            ]
          ).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="explanation-block">
        <div className="block-title">
          FANTASY CONTEXT <small>Not a recommendation</small>
        </div>
        <p className="fantasy-note">
          {explanation?.fantasy ??
            "A change in match state can shift opportunities, but one past moment cannot tell you what happens next."}
        </p>
      </section>

      <p className="compare-line">
        <strong>Against this innings:</strong>{" "}
        {phaseAverage === null
          ? "There are no other overs in this phase to compare."
          : `This phase averaged ${phaseAverage.toFixed(1)} runs per over elsewhere; over ${active.over + 1} produced ${overStats?.runs ?? 0}.`}
      </p>
      <div className="share-actions">
        <button type="button" className="button button-quiet" onClick={share}>
          {copied ? "Link copied" : "Share this moment"}
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={copyReplayLink}
        >
          Copy replay link
        </button>
        <a
          className="button button-quiet"
          href={`/share/${matchId}/${active.id}/opengraph-image`}
          download={`whythismoment-${matchId}-${active.id}.png`}
        >
          Download card
        </a>
      </div>
      <div className="followup">
        <h3>One more question?</h3>
        <p className="notice">
          Questions go to Google&apos;s Gemini API. Match facts are rebuilt from
          the bundled scorecard.
        </p>
        <div className="suggestions">
          {suggested.map((text) => (
            <button
              className="suggestion"
              type="button"
              key={text}
              onClick={() => void ask(text)}
              disabled={busy}
            >
              {text}
            </button>
          ))}
        </div>
        <form
          className="question-form"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
        >
          <input
            aria-label="Ask a cricket follow-up"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={400}
            placeholder="Ask about this moment…"
          />
          <button
            className="button"
            type="submit"
            disabled={busy || question.trim().length < 4}
          >
            {busy ? "Thinking…" : "Ask"}
          </button>
        </form>
        {notice && (
          <p className="notice" role="status">
            {notice} Showing the saved explanation when available.
          </p>
        )}
        {answer && (
          <div className="question-answer" aria-live="polite">
            {answer}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

export function MatchExperience({ info, raw, analysis, explanations }: Props) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const depth = useExperienceStore((state) => state.depth);
  const lang = useExperienceStore((state) => state.lang);
  const selectedMomentId = useExperienceStore((state) => state.selectedMoment);
  const replayPosition = useExperienceStore((state) => state.replayPosition);
  const setMatch = useExperienceStore((state) => state.setMatch);
  const setMoment = useExperienceStore((state) => state.setMoment);
  const setDepth = useExperienceStore((state) => state.setDepth);
  const setLang = useExperienceStore((state) => state.setLang);
  const setReplayPosition = useExperienceStore(
    (state) => state.setReplayPosition,
  );
  const selectedMoment =
    analysis.moments.find((moment) => moment.id === selectedMomentId) ?? null;
  const selectedBall = analysis.balls[replayPosition] ?? null;
  const explanation = selectedMoment
    ? (explanations[`${selectedMoment.id}:${depth}:${lang}`] ?? null)
    : null;
  const scores = useMemo(
    () =>
      [1, 2].map((innings) =>
        analysis.balls.filter((ball) => ball.innings === innings),
      ),
    [analysis.balls],
  );

  useEffect(() => {
    setMatch(info.id);
    const initialMoment = new URLSearchParams(window.location.search).get(
      "moment",
    );
    const initial =
      analysis.moments.find((moment) => moment.id === initialMoment) ??
      analysis.moments[0] ??
      null;
    setMoment(initial?.id ?? null);
    setReplayPosition(initial?.ballIndex ?? 0);
  }, [analysis.moments, info.id, setMatch, setMoment, setReplayPosition]);

  const select = (momentId: string | null, ballIndex: number) => {
    setReplayPosition(ballIndex);
    setMoment(momentId);
    if (momentId)
      router.replace(`/match/${info.id}?moment=${momentId}`, { scroll: false });
    else router.replace(`/match/${info.id}`, { scroll: false });
  };
  const selectMoment = (moment: Moment) => {
    select(moment.id, moment.ballIndex);
    document.getElementById("why")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };
  const firstInn = scores[0] ?? [];
  const secondInn = scores[1] ?? [];
  const liveScore = selectedBall
    ? `${selectedBall.score}/${selectedBall.wickets}`
    : null;
  const firstScore =
    selectedBall?.innings === 1 ? liveScore! : formatScore(firstInn);
  const secondScore =
    selectedBall?.innings === 2 ? liveScore! : formatScore(secondInn);
  const latest = analysis.moments[0];

  return (
    <main className="site-shell match-shell" id="main-content">
      <div className="eyebrow">
        {info.venue} · {info.date}
      </div>
      <section
        className="scoreboard"
        aria-label="Match scoreboard"
        aria-live="polite"
      >
        <div className="team-score">
          <motion.strong
            key={`first-${firstScore}`}
            initial={{ y: 5, opacity: 0.55 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.24 }}
          >
            {firstScore}
          </motion.strong>
          <span>{info.teams[0]}</span>
        </div>
        <div className="score-center">
          <span className="mono">
            {selectedBall
              ? `${selectedBall.innings}.${selectedBall.over + 1}.${selectedBall.ball}`
              : "FINAL"}
          </span>
          {selectedBall && (
            <small>
              RR {selectedBall.runRate.toFixed(2)}
              {selectedBall.requiredRate === null
                ? ""
                : ` · RRR ${selectedBall.requiredRate.toFixed(2)}`}
            </small>
          )}
          <small>{info.result}</small>
        </div>
        <div className="team-score">
          <motion.strong
            key={`second-${secondScore}`}
            initial={{ y: 5, opacity: 0.55 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.24 }}
          >
            {secondScore}
          </motion.strong>
          <span>{info.teams[1]}</span>
        </div>
      </section>
      <div className="match-meta-row">
        <span>
          {raw.info.event?.name ?? "Indian Premier League"}
          {raw.info.event?.stage ? ` · ${raw.info.event.stage}` : ""}
        </span>
        <span>{info.whyInteresting}</span>
      </div>
      <div className="match-meta-row" aria-label="Innings scoring profile">
        {analysis.inningsScoring.map((innings) => (
          <span key={innings.innings}>
            {info.teams[innings.innings - 1]} · {innings.boundaries} boundaries
            / {innings.boundaryRuns} boundary runs · {innings.dotBalls} dots
          </span>
        ))}
      </div>
      <p
        className="muted mono"
        style={{ fontSize: ".61rem", margin: ".65rem 0 0" }}
        aria-label={`Unavailable from this scorecard: ${analysis.unavailable.map((item) => item.field).join(", ")}`}
      >
        NOT RECORDED IN THIS SCORECARD ·{" "}
        {analysis.unavailable
          .map((item) => item.field.toUpperCase())
          .join(" · ")}
      </p>
      <div className="match-content">
        <div className="match-main">
          <div className="section-label">
            <h2>Match replay</h2>
            <span>ARCHIVE · BALL BY BALL</span>
          </div>
          <BallStrip
            balls={analysis.balls}
            moments={analysis.moments}
            selectedId={selectedMomentId}
            selectedIndex={replayPosition}
            onSelect={select}
          />
          <WormChart
            points={analysis.winProbability}
            moments={analysis.moments}
            selectedId={selectedMomentId}
            activeBall={selectedBall}
            firstTeam={info.teams[0]}
            onSelect={(id) => {
              const moment = analysis.moments.find((item) => item.id === id);
              if (moment) selectMoment(moment);
            }}
          />
          <section aria-labelledby="moments-title">
            <div className="section-label">
              <h2 id="moments-title">Moments worth a second look</h2>
              <span>{analysis.moments.length} DETECTED</span>
            </div>
            <div className="moment-list">
              {analysis.moments.map((moment) => (
                <button
                  className="moment-row"
                  key={moment.id}
                  type="button"
                  aria-current={moment.id === selectedMomentId}
                  onClick={() => selectMoment(moment)}
                >
                  <span className="moment-time">
                    {moment.over + 1}.{moment.ball}
                  </span>
                  <span>
                    <span className="moment-name">{moment.title}</span>
                    <span className="moment-caption">{moment.summary}</span>
                  </span>
                  <span className="surprise">
                    {Math.round(moment.surprise * 100)}
                    <span aria-hidden="true">↗</span>
                  </span>
                </button>
              ))}
              {!analysis.moments.length && (
                <p className="muted">
                  No moments passed the detection rules in this match.
                </p>
              )}
            </div>
          </section>
        </div>
        <MomentDetail
          key={`${selectedMomentId ?? "ball"}:${depth}:${lang}`}
          moment={selectedMoment}
          ball={selectedBall}
          explanation={explanation}
          depth={depth}
          lang={lang}
          onDepth={setDepth}
          onLang={setLang}
          matchId={info.id}
          analysis={analysis}
        />
      </div>
      <p
        className="muted mono"
        style={{ fontSize: ".64rem", marginTop: "2rem" }}
      >
        ESTIMATE METHOD: score-relative logistic for innings one;
        resource-adjusted chase-rate logistic for innings two. See{" "}
        <Link className="small-link" href="/method">
          method
        </Link>
        .
      </p>
      {latest && (
        <Link
          href={`/match/${info.id}?moment=${latest.id}`}
          className="visually-hidden"
        >
          Jump to {latest.title}
        </Link>
      )}
    </main>
  );
}
