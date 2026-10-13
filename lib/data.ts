import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { analyzeMatch } from "./analysis";
import type {
  AnalyzedMatch,
  Explanation,
  MatchIndexEntry,
  Moment,
  RawMatch,
} from "./types";

const dataPath = path.join(process.cwd(), "data");

export async function getMatches(): Promise<MatchIndexEntry[]> {
  return JSON.parse(
    await readFile(path.join(dataPath, "index.json"), "utf8"),
  ) as MatchIndexEntry[];
}

export async function getMatch(id: string) {
  const matches = await getMatches();
  const info = matches.find((item) => item.id === id);
  if (!info) return null;
  const raw = JSON.parse(
    await readFile(path.join(dataPath, "matches", `${id}.json`), "utf8"),
  ) as RawMatch;
  const analysis = analyzeMatch(raw);
  return { info, raw, analysis };
}

export async function getExplanations(): Promise<
  Record<string, Record<string, Explanation>>
> {
  return JSON.parse(
    await readFile(path.join(dataPath, "explanations.json"), "utf8"),
  ) as Record<string, Record<string, Explanation>>;
}

export async function getExplanation(
  matchId: string,
  moment: Moment,
  depth: "new-fan" | "nerd",
  lang: "en" | "hi",
) {
  const explanations = await getExplanations();
  return explanations[matchId]?.[`${moment.id}:${depth}:${lang}`] ?? null;
}

export async function getMatchIds() {
  return (await getMatches()).map((match) => ({ id: match.id }));
}

export async function getAllMomentParams() {
  const matches = await getMatches();
  const params: Array<{ id: string; moment: string }> = [];
  for (const match of matches) {
    const result = await getMatch(match.id);
    for (const moment of result?.analysis.moments ?? [])
      params.push({ id: match.id, moment: moment.id });
  }
  return params;
}

export type { AnalyzedMatch };
