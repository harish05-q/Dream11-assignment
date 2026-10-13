import { z } from "zod";

export type RawDelivery = {
  batter: string;
  bowler: string;
  non_striker: string;
  runs: { batter: number; extras: number; total: number };
  extras?: Record<string, number>;
  wickets?: Array<{ kind: string; player_out: string }>;
  review?: { by?: string; umpire?: string; batter?: string; decision?: string };
};

export type RawInnings = {
  team: string;
  overs: Array<{ over: number; deliveries: RawDelivery[] }>;
  target?: { overs: number; runs: number };
};

export type RawMatch = {
  info: {
    teams: string[];
    dates: string[];
    venue?: string;
    event?: { name?: string; stage?: string };
    overs?: number;
    outcome?: {
      winner?: string;
      by?: { runs?: number; wickets?: number };
      result?: string;
    };
    players?: Record<string, string[]>;
    player_of_match?: string[];
    reviews?: Array<Record<string, unknown>>;
  };
  innings: RawInnings[];
};

export type MatchIndexEntry = {
  id: string;
  title: string;
  teams: string[];
  venue: string;
  date: string;
  result: string;
  whyInteresting: string;
};

export type Ball = {
  id: string;
  innings: number;
  over: number;
  ball: number;
  legalBall: number;
  batter: string;
  bowler: string;
  total: number;
  batterRuns: number;
  extras: number;
  wicket: string | null;
  outcome: "dot" | "runs" | "boundary" | "wicket" | "extra";
  score: number;
  wickets: number;
  runRate: number;
  requiredRate: number | null;
  phase: "powerplay" | "middle" | "death";
};

export type OverSummary = {
  innings: number;
  over: number;
  score: number;
  wickets: number;
  runRate: number;
  requiredRate: number | null;
  runs: number;
  phase: Ball["phase"];
};

export type MomentType =
  | "bowling-change"
  | "powerplay-spinner"
  | "big-over"
  | "dot-pressure"
  | "partnership-break"
  | "batting-order"
  | "review";

export type Moment = {
  id: string;
  type: MomentType;
  title: string;
  summary: string;
  innings: number;
  over: number;
  ball: number;
  surprise: number;
  ballIndex: number;
};

export type PhaseBowling = {
  innings: number;
  phase: Ball["phase"];
  bowler: string;
  balls: number;
  runs: number;
  wickets: number;
  economy: number;
  wicketsPerOver: number;
};

export type Partnership = {
  innings: number;
  batterA: string;
  batterB: string;
  runs: number;
  balls: number;
  startOver: number;
  endOver: number;
  endedBy: string | null;
};

export type BowlingChange = {
  innings: number;
  over: number;
  ball: number;
  from: string;
  to: string;
  ballIndex: number;
};

export type InningsScoring = {
  innings: number;
  boundaryRuns: number;
  boundaries: number;
  dotBalls: number;
  dotBallRuns: number;
};

export type AnalyzedMatch = {
  balls: Ball[];
  overs: OverSummary[];
  phaseBowling: PhaseBowling[];
  partnerships: Partnership[];
  bowlingChanges: BowlingChange[];
  inningsScoring: InningsScoring[];
  moments: Moment[];
  winProbability: Array<{ innings: number; over: number; probability: number }>;
  unavailable: Array<{ field: string; reason: string }>;
};

export const ExplanationSchema = z.object({
  confirmed: z
    .array(z.object({ text: z.string().min(1), source: z.string().min(1) }))
    .min(1),
  reasoning: z.object({
    text: z.string().min(1),
    confidence: z.enum(["High", "Medium", "Low"]),
    wouldChangeIf: z.string().min(1),
  }),
  cantKnow: z.array(z.string().min(1)),
  fantasy: z.string().min(1),
});

export const ExplainRequestSchema = z.object({
  matchId: z.string().regex(/^[a-zA-Z0-9-]{1,100}$/),
  momentId: z.string().regex(/^[a-zA-Z0-9-]{1,120}$/),
  question: z.string().trim().min(4).max(400),
  depth: z.enum(["new-fan", "nerd"]),
  lang: z.enum(["en", "hi"]),
});

export type Explanation = z.infer<typeof ExplanationSchema>;
