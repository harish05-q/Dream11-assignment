import { ExplanationSchema } from "./types";

export const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const EXPLANATION_SYSTEM = `You explain a real cricket moment for a fan. Use ONLY the supplied match facts for factual claims. Do not invent player attributes, field placements, bowling styles, statistics, or motives. Any explanation of intent is a hypothesis and must be phrased as likely, with a confidence label. The unknowns list must say what only players or staff could confirm. Fantasy context is general cricket context only; never give betting, captain, or lineup advice. Reply only as JSON matching this shape: {"confirmed":[{"text":string,"source":string}],"reasoning":{"text":string,"confidence":"High"|"Medium"|"Low","wouldChangeIf":string},"cantKnow":[string],"fantasy":string}.`;

export const explanationResponseSchema = {
  type: "OBJECT",
  properties: {
    confirmed: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { text: { type: "STRING" }, source: { type: "STRING" } },
        required: ["text", "source"],
      },
    },
    reasoning: {
      type: "OBJECT",
      properties: {
        text: { type: "STRING" },
        confidence: { type: "STRING", enum: ["High", "Medium", "Low"] },
        wouldChangeIf: { type: "STRING" },
      },
      required: ["text", "confidence", "wouldChangeIf"],
    },
    cantKnow: { type: "ARRAY", items: { type: "STRING" } },
    fantasy: { type: "STRING" },
  },
  required: ["confirmed", "reasoning", "cantKnow", "fantasy"],
};

export function groundingFor(
  match: {
    title: string;
    venue: string;
    result: string;
  },
  analysis: {
    balls: Array<{
      id: string;
      innings: number;
      over: number;
      ball: number;
      batter: string;
      bowler: string;
      total: number;
      batterRuns: number;
      score: number;
      wickets: number;
      outcome: string;
    }>;
    overs: Array<{
      innings: number;
      over: number;
      score: number;
      wickets: number;
      runRate: number;
      requiredRate: number | null;
      runs: number;
      phase: string;
    }>;
    phaseBowling: Array<{
      innings: number;
      phase: string;
      bowler: string;
      balls: number;
      runs: number;
      wickets: number;
      economy: number;
    }>;
    partnerships: Array<{
      innings: number;
      batterA: string;
      batterB: string;
      runs: number;
      balls: number;
      startOver: number;
      endOver: number;
    }>;
  },
  moment: {
    innings: number;
    over: number;
    ball: number;
    title: string;
    summary: string;
  },
) {
  const current =
    analysis.balls.find(
      (ball) =>
        ball.innings === moment.innings &&
        ball.over === moment.over &&
        ball.ball === moment.ball,
    ) ??
    analysis.balls.find(
      (ball) => ball.innings === moment.innings && ball.over === moment.over,
    );
  const relevantBalls = analysis.balls.filter(
    (ball) =>
      ball.innings === moment.innings && Math.abs(ball.over - moment.over) <= 1,
  );
  const relevantOvers = analysis.overs.filter(
    (over) =>
      over.innings === moment.innings && Math.abs(over.over - moment.over) <= 2,
  );
  return JSON.stringify(
    {
      match: { title: match.title, venue: match.venue, result: match.result },
      moment: {
        ...moment,
        scoreAtMoment: current
          ? `${current.score}/${current.wickets}`
          : "not available",
      },
      nearbyDeliveries: relevantBalls.map((ball) => ({
        ball: `${ball.over + 1}.${ball.ball}`,
        batter: ball.batter,
        bowler: ball.bowler,
        total: ball.total,
        batRuns: ball.batterRuns,
        score: `${ball.score}/${ball.wickets}`,
        outcome: ball.outcome,
      })),
      nearbyOvers: relevantOvers.map((over) => ({
        over: over.over + 1,
        score: `${over.score}/${over.wickets}`,
        runs: over.runs,
        runRate: Number(over.runRate.toFixed(2)),
        requiredRate:
          over.requiredRate === null
            ? null
            : Number(over.requiredRate.toFixed(2)),
        phase: over.phase,
      })),
      bowlingFigures: analysis.phaseBowling
        .filter(
          (item) =>
            item.innings === moment.innings &&
            item.phase ===
              relevantOvers.find((over) => over.over === moment.over)?.phase,
        )
        .map((item) => ({
          bowler: item.bowler,
          balls: item.balls,
          runs: item.runs,
          wickets: item.wickets,
          economy: Number(item.economy.toFixed(2)),
        })),
      nearbyPartnerships: analysis.partnerships.filter(
        (item) =>
          item.innings === moment.innings &&
          item.startOver <= moment.over &&
          item.endOver >= moment.over,
      ),
    },
    null,
    2,
  );
}

export function validateExplanation(value: unknown) {
  return ExplanationSchema.parse(value);
}
