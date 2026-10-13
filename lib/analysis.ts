import type {
  AnalyzedMatch,
  Ball,
  Moment,
  OverSummary,
  Partnership,
  PhaseBowling,
  RawDelivery,
  RawMatch,
} from "./types";

const phaseFor = (over: number, inningsOvers: number): Ball["phase"] => {
  if (over < 6) return "powerplay";
  if (over >= inningsOvers - 5) return "death";
  return "middle";
};

const legalDelivery = (delivery: RawDelivery) =>
  !delivery.extras?.wide && !delivery.extras?.noballs;
const oversToDisplay = (legalBalls: number) =>
  legalBalls === 0 ? 0 : legalBalls / 6;

function surprise(type: Moment["type"], count = 1) {
  const base: Record<Moment["type"], number> = {
    "bowling-change": 0.42,
    "powerplay-spinner": 0.7,
    "big-over": 0.68,
    "dot-pressure": 0.57,
    "partnership-break": 0.76,
    "batting-order": 0.74,
    review: 0.72,
  };
  return Math.min(0.99, base[type] + Math.max(0, count - 1) * 0.035);
}

function buildWinProbability(balls: Ball[], match: RawMatch) {
  const points: AnalyzedMatch["winProbability"] = [];
  const inningsCount = match.innings.length;
  if (!inningsCount) return points;

  for (let innings = 1; innings <= inningsCount; innings += 1) {
    const inningsBalls = balls.filter((ball) => ball.innings === innings);
    if (!inningsBalls.length) continue;
    if (innings === 1 && inningsCount > 1) {
      for (const ball of inningsBalls.filter(
        (item) => item.ball === 6 || item === inningsBalls.at(-1),
      )) {
        const current = ball.score;
        const runsEstimate = Math.max(
          0.01,
          Math.min(0.99, 1 / (1 + Math.exp(-(current - 150) / 22))),
        );
        points.push({
          innings,
          over: ball.over + ball.ball / 6,
          probability: runsEstimate,
        });
      }
      continue;
    }
    const previousScore = balls
      .filter((ball) => ball.innings === innings - 1)
      .at(-1)?.score;
    const target =
      match.innings[innings - 1]?.target?.runs ??
      (innings > 1 && previousScore !== undefined
        ? previousScore + 1
        : undefined);
    if (!target) continue;
    const maxOvers =
      match.innings[innings - 1]?.target?.overs ?? match.info.overs ?? 20;
    const totalBalls = maxOvers * 6;
    for (const ball of inningsBalls) {
      const ballsLeft = Math.max(0, totalBalls - ball.legalBall);
      const runsNeeded = Math.max(0, target - ball.score);
      const wicketsLeft = Math.max(1, 10 - ball.wickets);
      const requiredPerBall = ballsLeft ? runsNeeded / ballsLeft : runsNeeded;
      const resources = Math.sqrt(wicketsLeft / 10);
      const expectedScoringPerBall = 0.13 + 0.13 * resources;
      const z =
        ((expectedScoringPerBall - requiredPerBall) *
          Math.sqrt(Math.max(1, ballsLeft))) /
        1.8;
      points.push({
        innings,
        over: ball.over + ball.ball / 6,
        probability: Math.max(0.01, Math.min(0.99, 1 - 1 / (1 + Math.exp(-z)))),
      });
    }
  }

  return points.sort((a, b) => a.innings - b.innings || a.over - b.over);
}

export function analyzeMatch(match: RawMatch): AnalyzedMatch {
  const balls: Ball[] = [];
  const overs: OverSummary[] = [];
  const phaseStats = new Map<string, PhaseBowling>();
  const partnerships: Partnership[] = [];
  const bowlingChanges: AnalyzedMatch["bowlingChanges"] = [];
  const inningsScoring: AnalyzedMatch["inningsScoring"] = [];
  const moments: Moment[] = [];
  let ballIndex = 0;

  match.innings.forEach((innings, inningsOffset) => {
    const inningsNumber = inningsOffset + 1;
    const inningsOvers = match.info.overs ?? innings.target?.overs ?? 20;
    let score = 0;
    let wickets = 0;
    let legalBalls = 0;
    let partnershipRuns = 0;
    let partnershipBalls = 0;
    let partnershipStartOver = 0;
    let partnershipBatters = new Set<string>();
    let previousBowler: string | null = null;
    let previousChange: { over: number } | null = null;
    let recentDotIndices: number[] = [];
    let boundaryRuns = 0;
    let boundaries = 0;
    let dotBalls = 0;
    let dotBallRuns = 0;

    for (const overData of innings.overs) {
      const overStartScore = score;
      const phase = phaseFor(overData.over, inningsOvers);
      for (const [deliveryOffset, delivery] of overData.deliveries.entries()) {
        const legal = legalDelivery(delivery);
        if (legal) legalBalls += 1;
        score += delivery.runs.total;
        const wicket = delivery.wickets?.[0]?.player_out ?? null;
        if (delivery.wickets?.length) wickets += delivery.wickets.length;
        const ball = deliveryOffset + 1;
        const currentPhase = phaseFor(overData.over, inningsOvers);
        const requiredRuns =
          inningsOffset > 0
            ? Math.max(
                0,
                (innings.target?.runs ??
                  (balls
                    .filter((item) => item.innings === inningsNumber - 1)
                    .at(-1)?.score ?? 0) + 1) - score,
              )
            : 0;
        const ballsRemaining = Math.max(0, inningsOvers * 6 - legalBalls);
        const requiredRate =
          inningsOffset > 0 && ballsRemaining
            ? (requiredRuns * 6) / ballsRemaining
            : null;
        const outcome: Ball["outcome"] = wicket
          ? "wicket"
          : delivery.extras && Object.keys(delivery.extras).length
            ? "extra"
            : delivery.runs.batter === 4 || delivery.runs.batter === 6
              ? "boundary"
              : delivery.runs.total === 0
                ? "dot"
                : "runs";
        const record: Ball = {
          id: `i${inningsNumber}-o${overData.over + 1}-b${deliveryOffset + 1}`,
          innings: inningsNumber,
          over: overData.over,
          ball,
          legalBall: legalBalls,
          batter: delivery.batter,
          bowler: delivery.bowler,
          total: delivery.runs.total,
          batterRuns: delivery.runs.batter,
          extras: delivery.runs.extras,
          wicket,
          outcome,
          score,
          wickets,
          runRate: legalBalls ? score / oversToDisplay(legalBalls) : 0,
          requiredRate,
          phase: currentPhase,
        };
        balls.push(record);
        if (delivery.runs.batter === 4 || delivery.runs.batter === 6) {
          boundaryRuns += delivery.runs.batter;
          boundaries += 1;
        }
        if (delivery.runs.total === 0 && !delivery.wickets?.length) {
          dotBalls += 1;
          dotBallRuns += delivery.runs.total;
        }
        partnershipBatters.add(delivery.batter);
        partnershipBatters.add(delivery.non_striker);
        partnershipRuns += delivery.runs.total;
        partnershipBalls += legal ? 1 : 0;

        const phaseKey = `${inningsNumber}|${currentPhase}|${delivery.bowler}`;
        const stats = phaseStats.get(phaseKey) ?? {
          innings: inningsNumber,
          phase: currentPhase,
          bowler: delivery.bowler,
          balls: 0,
          runs: 0,
          wickets: 0,
          economy: 0,
          wicketsPerOver: 0,
        };
        stats.balls += legal ? 1 : 0;
        stats.runs += delivery.runs.total;
        stats.wickets +=
          delivery.wickets?.filter(
            (item) =>
              !["run out", "retired hurt", "obstructing the field"].includes(
                item.kind,
              ),
          ).length ?? 0;
        stats.economy = stats.balls ? (stats.runs * 6) / stats.balls : 0;
        stats.wicketsPerOver = stats.balls
          ? (stats.wickets * 6) / stats.balls
          : 0;
        phaseStats.set(phaseKey, stats);

        if (previousBowler && previousBowler !== delivery.bowler) {
          bowlingChanges.push({
            innings: inningsNumber,
            over: overData.over,
            ball,
            from: previousBowler,
            to: delivery.bowler,
            ballIndex: balls.length - 1,
          });
          previousChange = { over: overData.over };
          moments.push({
            id: `change-${inningsNumber}-${overData.over}-${deliveryOffset}`,
            type: "bowling-change",
            title: `${delivery.bowler} takes the ball`,
            summary: `A bowling change at ${overData.over + 1}.${ball}.`,
            innings: inningsNumber,
            over: overData.over,
            ball,
            surprise: surprise("bowling-change"),
            ballIndex: balls.length - 1,
          });
        }
        if (delivery.review) {
          moments.push({
            id: `review-${inningsNumber}-${overData.over}-${deliveryOffset}`,
            type: "review",
            title: "A review was recorded",
            summary: `The delivery record marks a review involving ${delivery.review.by ?? "a side"}.`,
            innings: inningsNumber,
            over: overData.over,
            ball,
            surprise: surprise("review"),
            ballIndex: balls.length - 1,
          });
        }
        if (
          previousChange &&
          delivery.wickets?.length &&
          overData.over - previousChange.over <= 2
        ) {
          const exists = moments.some(
            (moment) =>
              moment.type === "bowling-change" &&
              moment.innings === inningsNumber &&
              moment.over === previousChange!.over,
          );
          if (exists) {
            moments.push({
              id: `change-wicket-${inningsNumber}-${overData.over}-${deliveryOffset}`,
              type: "partnership-break",
              title: "A wicket follows the change",
              summary: `${delivery.bowler} struck within two overs of taking the ball.`,
              innings: inningsNumber,
              over: overData.over,
              ball,
              surprise: surprise("partnership-break"),
              ballIndex: balls.length - 1,
            });
            previousChange = null;
          }
        }
        if (delivery.runs.total === 0 && !delivery.wickets?.length) {
          recentDotIndices.push(balls.length - 1);
          if (
            recentDotIndices.length >= 3 &&
            recentDotIndices.at(-1)! - recentDotIndices.at(-3)! <= 4
          ) {
            const firstDot = balls[recentDotIndices.at(-3)!];
            moments.push({
              id: `pressure-${inningsNumber}-${overData.over}-${deliveryOffset}`,
              type: "dot-pressure",
              title: "Dot-ball pressure builds",
              summary: "Three scoreless deliveries arrive in a short sequence.",
              innings: inningsNumber,
              over: firstDot.over,
              ball: firstDot.ball,
              surprise: surprise("dot-pressure"),
              ballIndex: recentDotIndices.at(-3)!,
            });
            recentDotIndices = [];
          }
        } else recentDotIndices = [];

        if (wicket) {
          partnerships.push({
            innings: inningsNumber,
            batterA: [...partnershipBatters][0] ?? delivery.batter,
            batterB: [...partnershipBatters][1] ?? delivery.non_striker,
            runs: partnershipRuns,
            balls: partnershipBalls,
            startOver: partnershipStartOver,
            endOver: overData.over,
            endedBy: wicket,
          });
          moments.push({
            id: `wicket-${inningsNumber}-${overData.over}-${deliveryOffset}`,
            type: "partnership-break",
            title: `${wicket} is out`,
            summary: `${delivery.bowler} ends a ${partnershipRuns}-run stand.`,
            innings: inningsNumber,
            over: overData.over,
            ball,
            surprise: surprise(
              "partnership-break",
              partnershipRuns >= 50 ? 2 : 1,
            ),
            ballIndex: balls.length - 1,
          });
          partnershipRuns = 0;
          partnershipBalls = 0;
          partnershipStartOver = overData.over;
          partnershipBatters = new Set();
        }
        if (previousBowler !== delivery.bowler)
          previousBowler = delivery.bowler;
      }

      const overBalls = balls.slice(ballIndex);
      const overRuns = score - overStartScore;
      const summary: OverSummary = {
        innings: inningsNumber,
        over: overData.over,
        score,
        wickets,
        runRate: legalBalls ? score / oversToDisplay(legalBalls) : 0,
        requiredRate: overBalls.at(-1)?.requiredRate ?? null,
        runs: overRuns,
        phase,
      };
      overs.push(summary);
      if (overRuns >= 14) {
        moments.push({
          id: `big-over-${inningsNumber}-${overData.over}`,
          type: "big-over",
          title: `${overRuns} runs in the over`,
          summary: `${innings.team} accelerate through over ${overData.over + 1}.`,
          innings: inningsNumber,
          over: overData.over,
          ball: 1,
          surprise: surprise("big-over", Math.floor(overRuns / 14)),
          ballIndex: Math.max(0, balls.length - overBalls.length),
        });
      }
      ballIndex = balls.length;
    }

    inningsScoring.push({
      innings: inningsNumber,
      boundaryRuns,
      boundaries,
      dotBalls,
      dotBallRuns,
    });

    if (partnershipRuns || partnershipBalls) {
      const batters = [...partnershipBatters];
      partnerships.push({
        innings: inningsNumber,
        batterA: batters[0] ?? "Unavailable",
        batterB: batters[1] ?? "Unavailable",
        runs: partnershipRuns,
        balls: partnershipBalls,
        startOver: partnershipStartOver,
        endOver: innings.overs.at(-1)?.over ?? 0,
        endedBy: null,
      });
    }
  });

  const recent = new Set<string>();
  const sortedMoments = moments
    .sort((a, b) => b.surprise - a.surprise || a.ballIndex - b.ballIndex)
    .filter((moment) => {
      const signature = `${moment.type}-${moment.innings}-${moment.over}`;
      if (recent.has(signature)) return false;
      recent.add(signature);
      return true;
    })
    .slice(0, 12)
    .sort((a, b) => a.ballIndex - b.ballIndex);

  return {
    balls,
    overs,
    phaseBowling: [...phaseStats.values()],
    partnerships,
    bowlingChanges,
    inningsScoring,
    moments: sortedMoments,
    winProbability: buildWinProbability(balls, match),
    unavailable: [
      {
        field: "Bowler type",
        reason:
          "The bundled ball-by-ball file does not identify bowling style.",
      },
      {
        field: "Field placements",
        reason:
          "The bundled ball-by-ball file does not record fielder positions.",
      },
      {
        field: "Batting-order intent",
        reason:
          "The record lists deliveries, not the reason a batter was promoted.",
      },
      {
        field: "Captain or coach intent",
        reason: "The scorecard cannot establish what was said or planned.",
      },
    ],
  };
}
