import { describe, expect, it } from "vitest";
import { analyzeMatch } from "../lib/analysis";
import {
  ExplainRequestSchema,
  ExplanationSchema,
  type RawMatch,
} from "../lib/types";

const fixture: RawMatch = {
  info: {
    teams: ["North", "South"],
    dates: ["2024-04-01"],
    overs: 4,
    outcome: { winner: "South" },
  },
  innings: [
    {
      team: "North",
      overs: [
        {
          over: 0,
          deliveries: [
            {
              batter: "Batter A",
              bowler: "Bowler X",
              non_striker: "Batter B",
              runs: { batter: 1, extras: 0, total: 1 },
            },
            {
              batter: "Batter B",
              bowler: "Bowler X",
              non_striker: "Batter A",
              runs: { batter: 0, extras: 0, total: 0 },
            },
            {
              batter: "Batter B",
              bowler: "Bowler X",
              non_striker: "Batter A",
              runs: { batter: 0, extras: 0, total: 0 },
            },
            {
              batter: "Batter B",
              bowler: "Bowler X",
              non_striker: "Batter A",
              runs: { batter: 0, extras: 0, total: 0 },
            },
            {
              batter: "Batter B",
              bowler: "Bowler X",
              non_striker: "Batter A",
              runs: { batter: 4, extras: 0, total: 4 },
            },
            {
              batter: "Batter A",
              bowler: "Bowler X",
              non_striker: "Batter B",
              runs: { batter: 0, extras: 0, total: 0 },
              wickets: [{ kind: "caught", player_out: "Batter A" }],
            },
          ],
        },
        {
          over: 1,
          deliveries: [
            {
              batter: "Batter B",
              bowler: "Bowler Y",
              non_striker: "Batter C",
              runs: { batter: 6, extras: 0, total: 6 },
            },
            {
              batter: "Batter B",
              bowler: "Bowler Y",
              non_striker: "Batter C",
              runs: { batter: 6, extras: 0, total: 6 },
            },
            {
              batter: "Batter B",
              bowler: "Bowler Y",
              non_striker: "Batter C",
              runs: { batter: 2, extras: 0, total: 2 },
            },
          ],
        },
      ],
    },
    {
      team: "South",
      target: { overs: 4, runs: 20 },
      overs: [
        {
          over: 0,
          deliveries: [
            {
              batter: "Chaser A",
              bowler: "Bowler X",
              non_striker: "Chaser B",
              runs: { batter: 0, extras: 0, total: 0 },
            },
            {
              batter: "Chaser A",
              bowler: "Bowler X",
              non_striker: "Chaser B",
              runs: { batter: 1, extras: 0, total: 1 },
            },
          ],
        },
      ],
    },
  ],
};

describe("analyzeMatch", () => {
  it("calculates delivery scores, phases, run rate, and chase rate", () => {
    const result = analyzeMatch(fixture);
    expect(result.balls[5]).toMatchObject({
      score: 5,
      wickets: 1,
      phase: "powerplay",
      outcome: "wicket",
    });
    expect(result.balls[8]).toMatchObject({ score: 19, outcome: "runs" });
    expect(result.balls.at(-1)).toMatchObject({
      innings: 2,
      requiredRate: expect.any(Number),
    });
    expect(
      result.overs.find((over) => over.innings === 1 && over.over === 1)?.runs,
    ).toBe(14);
  });

  it("finds bowling changes, short dot sequences, big overs, and broken stands", () => {
    const analysis = analyzeMatch(fixture);
    const moments = analysis.moments;
    expect(moments.some((moment) => moment.type === "bowling-change")).toBe(
      true,
    );
    expect(moments.some((moment) => moment.type === "dot-pressure")).toBe(true);
    expect(moments.some((moment) => moment.type === "big-over")).toBe(true);
    expect(moments.some((moment) => moment.type === "partnership-break")).toBe(
      true,
    );
    expect(analysis.bowlingChanges[0]).toMatchObject({
      from: "Bowler X",
      to: "Bowler Y",
    });
    expect(analysis.inningsScoring[0]).toMatchObject({
      boundaryRuns: 16,
      boundaries: 3,
      dotBalls: 3,
      dotBallRuns: 0,
    });
    expect(
      analysis.partnerships.find(
        (item) => item.innings === 1 && item.endedBy === null,
      ),
    ).toMatchObject({ batterA: "Batter B", batterB: "Batter C" });
    expect(analysis.unavailable.map((item) => item.field)).toContain(
      "Bowler type",
    );
  });

  it("keeps the win curve explicitly bounded as an estimate", () => {
    const points = analyzeMatch(fixture).winProbability;
    expect(points.length).toBeGreaterThan(0);
    expect(
      points.every(
        (point) => point.probability >= 0.01 && point.probability <= 0.99,
      ),
    ).toBe(true);
  });
});

describe("AI schemas", () => {
  it("accepts a valid grounded explanation and rejects invented confidence values", () => {
    const valid = {
      confirmed: [
        { text: "The over cost 14.", source: "Ball-by-ball data, over 2" },
      ],
      reasoning: {
        text: "A likely acceleration.",
        confidence: "Medium",
        wouldChangeIf: "A coach shared the plan.",
      },
      cantKnow: ["The intended plan."],
      fantasy: "This does not predict the next score.",
    };
    expect(ExplanationSchema.safeParse(valid).success).toBe(true);
    expect(
      ExplanationSchema.safeParse({
        ...valid,
        reasoning: { ...valid.reasoning, confidence: "Certain" },
      }).success,
    ).toBe(false);
  });

  it("bounds user questions and accepts only known moment IDs", () => {
    const valid = {
      matchId: "match-123",
      momentId: "over-2-big",
      question: "Why did that change?",
      depth: "new-fan",
      lang: "en",
    };
    expect(ExplainRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      ExplainRequestSchema.safeParse({ ...valid, question: "why" }).success,
    ).toBe(false);
    expect(
      ExplainRequestSchema.safeParse({ ...valid, momentId: "../secret" })
        .success,
    ).toBe(false);
    expect(
      ExplainRequestSchema.safeParse({ ...valid, question: "a".repeat(401) })
        .success,
    ).toBe(false);
  });
});
