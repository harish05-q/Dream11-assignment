import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import unzipper from "unzipper";

type Delivery = {
  batter: string;
  bowler: string;
  non_striker: string;
  runs: { batter: number; extras: number; total: number };
  wickets?: Array<{ kind: string; player_out: string }>;
};
type Innings = {
  team: string;
  overs: Array<{ over: number; deliveries: Delivery[] }>;
  target?: { overs: number; runs: number };
};
type RawMatch = {
  meta: { data_version: string; created: string; revision: number };
  info: {
    teams: string[];
    dates: string[];
    venue?: string;
    overs?: number;
    event?: { name?: string; stage?: string };
    outcome?: {
      winner?: string;
      by?: { runs?: number; wickets?: number };
      result?: string;
    };
  };
  innings: Innings[];
};

const root = process.cwd();
const archivePath = path.join(root, "data", "archive.zip");
const workPath = path.join(root, "data", ".cache", "ipl_json");
const matchPath = path.join(root, "data", "matches");
const archiveUrl = "https://cricsheet.org/downloads/ipl_json.zip";

function inningsTotals(innings: Innings[]) {
  return innings.map((inn) => ({
    team: inn.team,
    runs: inn.overs
      .flatMap((over) => over.deliveries)
      .reduce((sum, ball) => sum + ball.runs.total, 0),
    balls: inn.overs.reduce((sum, over) => sum + over.deliveries.length, 0),
    wickets: inn.overs
      .flatMap((over) => over.deliveries)
      .reduce((sum, ball) => sum + (ball.wickets?.length ?? 0), 0),
  }));
}

function isFinal(match: RawMatch) {
  const info = match.info;
  const text =
    `${info.event?.name ?? ""} ${info.event?.stage ?? ""}`.toLowerCase();
  return text.includes("final") && !text.includes("qualifier");
}

function isLastOverChase(match: RawMatch) {
  const inn = match.innings.at(-1);
  if (!inn || match.innings.length < 2 || !match.info.outcome?.winner)
    return false;
  const totals = inningsTotals(match.innings);
  const chase = totals.at(-1);
  const maximum = Number(inn.target?.overs ?? match.info.overs ?? 20) * 6;
  const lastOver = inn.overs.at(-1)?.over ?? -1;
  return (
    inn.team === match.info.outcome.winner &&
    chase !== undefined &&
    lastOver >= Math.floor(maximum / 6) - 1
  );
}

function hasCollapseOrChase(match: RawMatch) {
  const totals = inningsTotals(match.innings);
  const chase = totals.at(-1);
  const highScoringChase = Boolean(
    match.info.outcome?.winner === match.innings.at(-1)?.team &&
    chase &&
    chase.runs >= 190,
  );
  if (highScoringChase) return true;
  for (const innings of match.innings) {
    const balls = innings.overs.flatMap((over) => over.deliveries);
    for (let end = 0; end < balls.length; end += 1) {
      const inTwenty = balls
        .slice(Math.max(0, end - 19), end + 1)
        .reduce((sum, ball) => sum + (ball.wickets?.length ?? 0), 0);
      const inThirty = balls
        .slice(Math.max(0, end - 29), end + 1)
        .reduce((sum, ball) => sum + (ball.wickets?.length ?? 0), 0);
      if (inTwenty >= 4 || inThirty >= 5) return true;
    }
  }
  return false;
}

function matchId(file: string, match: RawMatch) {
  return (
    path.basename(file, ".json").replace(/[^a-zA-Z0-9-]/g, "-") ||
    `${match.info.dates?.[0] ?? "match"}-${match.info.teams?.join("-")}`
  );
}

function describe(match: RawMatch, reason: string) {
  const teams = match.info.teams ?? [];
  return {
    id: "",
    title: `${teams.join(" v ")} · ${match.info.dates?.[0] ?? "IPL match"}`,
    teams,
    venue: match.info.venue ?? "Venue not recorded",
    date: match.info.dates?.[0] ?? "",
    result: match.info.outcome?.by
      ? `${match.info.outcome.winner} won by ${match.info.outcome.by.runs ? `${match.info.outcome.by.runs} runs` : `${match.info.outcome.by.wickets} wickets`}`
      : (match.info.outcome?.winner ?? "Result not recorded"),
    whyInteresting: reason,
  };
}

async function main() {
  await mkdir(path.dirname(archivePath), { recursive: true });
  await mkdir(workPath, { recursive: true });
  await mkdir(matchPath, { recursive: true });

  console.log("Downloading the Cricsheet IPL JSON archive…");
  const response = await fetch(archiveUrl);
  if (!response.ok || !response.body)
    throw new Error(
      `Cricsheet download failed: ${response.status} ${response.statusText}`,
    );
  await pipeline(
    response.body as unknown as NodeJS.ReadableStream,
    createWriteStream(archivePath),
  );
  await rm(workPath, { recursive: true, force: true });
  await mkdir(workPath, { recursive: true });
  await pipeline(
    createReadStream(archivePath),
    unzipper.Extract({ path: workPath }),
  );

  const files = (await readdir(workPath))
    .filter((file) => file.endsWith(".json"))
    .sort();
  const candidates: {
    id: string;
    raw: RawMatch;
    reason: string;
    rank: number;
    date: string;
  }[] = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(
        await readFile(path.join(workPath, file), "utf8"),
      ) as RawMatch;
      if (!raw.innings?.length || !raw.info?.teams) continue;
      const totals = inningsTotals(raw.innings);
      const date = raw.info.dates?.[0] ?? "";
      if (isFinal(raw))
        candidates.push({
          id: matchId(file, raw),
          raw,
          reason: "An IPL final: pressure, plans and a trophy on the line.",
          rank: 3,
          date,
        });
      if (isLastOverChase(raw))
        candidates.push({
          id: matchId(file, raw),
          raw,
          reason:
            "A chase that ran into the final over, where every ball changed the equation.",
          rank: 2,
          date,
        });
      if (hasCollapseOrChase(raw)) {
        const lastInnings = raw.innings.at(-1);
        const lastTotal = totals.at(-1);
        const isBigChase = Boolean(
          raw.info.outcome?.winner === lastInnings?.team &&
          lastTotal &&
          lastTotal.runs >= 190,
        );
        candidates.push({
          id: matchId(file, raw),
          raw,
          reason: isBigChase
            ? "A high-scoring chase with the asking rate always in view."
            : "A rapid cluster of wickets turned the innings on its head.",
          rank: 1,
          date,
        });
      }
    } catch (error) {
      console.warn(`Skipping unreadable archive entry ${file}:`, error);
      continue;
    }
  }

  const selected: typeof candidates = [];
  for (const rank of [3, 2, 1]) {
    const match = candidates
      .filter(
        (candidate) =>
          candidate.rank === rank &&
          !selected.some((entry) => entry.id === candidate.id),
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (match) selected.push(match);
  }
  if (selected.length !== 3)
    throw new Error(
      `Expected three rule-matched IPL fixtures; found ${selected.length}.`,
    );

  const index = [];
  for (const match of selected) {
    const metadata = describe(match.raw, match.reason);
    metadata.id = match.id;
    await writeFile(
      path.join(matchPath, `${match.id}.json`),
      JSON.stringify(match.raw, null, 2),
    );
    index.push(metadata);
    console.log(`Selected ${metadata.title}`);
  }
  await writeFile(
    path.join(root, "data", "index.json"),
    JSON.stringify(index, null, 2),
  );
  await rm(workPath, { recursive: true, force: true });
  console.log(`Wrote ${index.length} matches from Cricsheet.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
