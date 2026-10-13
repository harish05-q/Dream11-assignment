import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { analyzeMatch } from "../lib/analysis";
import {
  EXPLANATION_SYSTEM,
  explanationResponseSchema,
  MODEL,
  groundingFor,
} from "../lib/ai";
import {
  ExplanationSchema,
  type Explanation,
  type MatchIndexEntry,
  type Moment,
  type RawMatch,
} from "../lib/types";

type ExplanationStore = Record<string, Record<string, Explanation>>;
type ExplanationCache = {
  version: number;
  model: string;
  explanations: ExplanationStore;
};
const generationVersion = 2;

async function main() {
  const root = process.cwd();
  const dataDir = path.join(root, "data");
  const index = JSON.parse(
    await readFile(path.join(dataDir, "index.json"), "utf8"),
  ) as MatchIndexEntry[];
  const targetFile = path.join(dataDir, "explanations.json");
  const cacheFile = path.join(dataDir, ".cache", "generated.json");
  const cached: ExplanationCache | null = existsSync(cacheFile)
    ? JSON.parse(await readFile(cacheFile, "utf8"))
    : null;
  const existing: ExplanationStore = existsSync(targetFile)
    ? JSON.parse(await readFile(targetFile, "utf8"))
    : {};
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  const modelKey = ai ? MODEL : "offline";
  let cachedExplanations =
    cached?.version === generationVersion && cached.model === modelKey
      ? cached.explanations
      : {};
  const store: ExplanationStore = { ...existing, ...cachedExplanations };

  function localExplanation(
    moment: Moment,
    analysis: ReturnType<typeof analyzeMatch>,
    innings: number,
    depth: "new-fan" | "nerd",
    lang: "en" | "hi",
  ): Explanation {
    const over = analysis.overs.find(
      (item) => item.innings === innings && item.over === moment.over,
    );
    const delivery = analysis.balls[moment.ballIndex];
    const bowling = analysis.phaseBowling.find(
      (item) =>
        item.innings === innings &&
        item.phase === over?.phase &&
        item.bowler === delivery?.bowler,
    );
    const phaseOvers = analysis.overs.filter(
      (item) =>
        item.innings === innings &&
        item.phase === over?.phase &&
        item.over !== moment.over,
    );
    const phaseAverage = phaseOvers.length
      ? phaseOvers.reduce((sum, item) => sum + item.runs, 0) / phaseOvers.length
      : null;
    const score = `${over?.score ?? "not available"}/${over?.wickets ?? "?"}`;
    const confirmed =
      lang === "hi"
        ? `${moment.summary} Over ${moment.over + 1} ke baad innings ${score} par thi; is over mein ${over?.runs ?? 0} runs aaye.`
        : `${moment.summary} Over ${moment.over + 1} ended at ${score}, with ${over?.runs ?? 0} runs in the over.`;
    const tacticalReads: Record<Moment["type"], { en: string; hi: string }> = {
      "bowling-change": {
        en: "A new bowler can change the matchup or reset the rhythm. That is a plausible explanation for the switch, not evidence of what the captain intended.",
        hi: "Naya bowler matchup ya innings ka rhythm badal sakta hai. Switch ki yeh ek mumkin wajah hai, captain ka confirmed plan nahi.",
      },
      "powerplay-spinner": {
        en: "A spin option in the powerplay can be used to change pace or matchup. This record cannot tell us whether that was the plan.",
        hi: "Powerplay mein spin option pace ya matchup badalne ke liye ho sakta hai. Record se yeh plan confirm nahi hota.",
      },
      "big-over": {
        en: `A burst of ${over?.runs ?? 0} runs can change the pressure quickly. A likely read is that the batting side found scoring options; the over alone cannot prove a planned attack.`,
        hi: `${over?.runs ?? 0} runs ka over pressure jaldi badal sakta hai. Mumkin hai batting side ko scoring options mile hon; sirf is over se planned attack prove nahi hota.`,
      },
      "dot-pressure": {
        en: "A short run of scoreless balls can raise the demand on the next delivery. The sequence is visible; the batter's intention is not.",
        hi: "Lagataar scoreless balls agle delivery par pressure badha sakti hain. Sequence dikh raha hai; batter ka intent nahi.",
      },
      "partnership-break": {
        en: "A wicket ends a stand and brings a new batter into the situation. A likely consequence is a reset in the batting partnership; the cause or plan behind the dismissal is not in this file.",
        hi: "Wicket se partnership khatam hoti hai aur naya batter aata hai. Mumkin consequence batting partnership ka reset hai; dismissal ka plan is file mein nahi.",
      },
      "batting-order": {
        en: "A batter arriving earlier than the usual sequence can change the matchup. This archive does not provide enough evidence to say why.",
        hi: "Batter ka usual sequence se pehle aana matchup badal sakta hai. Archive mein wajah batane ke liye kaafi evidence nahi hai.",
      },
      review: {
        en: "A review can pause a close decision, but this entry only records that a review happened. It does not establish the team's reasoning.",
        hi: "Review close decision ko pause kar sakta hai, lekin entry sirf review record karti hai. Team ki reasoning confirm nahi hoti.",
      },
    };
    const tacticRead = tacticalReads[moment.type][lang];
    const unknownText =
      lang === "hi"
        ? "Captain ki asli instruction ya bowler ka intended plan ball-by-ball record mein nahi hota."
        : "The captain's actual instruction or the bowler's intended plan is not in ball-by-ball records.";
    return ExplanationSchema.parse({
      confirmed: [
        {
          text: confirmed,
          source: `Ball-by-ball data, over ${moment.over + 1}`,
        },
        ...(bowling
          ? [
              {
                text:
                  lang === "hi"
                    ? `${bowling.bowler} ne is phase mein ${bowling.balls} legal balls par ${bowling.runs} runs diye aur ${bowling.wickets} credited wickets liye.`
                    : `${bowling.bowler} delivered ${bowling.balls} legal balls for ${bowling.runs} runs and ${bowling.wickets} credited wickets in this phase.`,
                source: `Phase bowling figures, ${over?.phase ?? "phase"} overs`,
              },
            ]
          : []),
      ],
      reasoning: {
        text:
          depth === "nerd" && lang === "en" && phaseAverage !== null
            ? `${tacticRead} Other ${over?.phase ?? "phase"} overs averaged ${phaseAverage.toFixed(1)} runs; that comparison describes the phase, not intent.`
            : tacticRead,
        confidence: "Low",
        wouldChangeIf:
          lang === "hi"
            ? "Captain ya coach ka explanation, ya field-setting aur bowler-type data milne par yeh view badal sakta hai."
            : "A captain or coach explained the plan, or field-setting and bowler-type data were available.",
      },
      cantKnow: [unknownText],
      fantasy:
        lang === "hi"
          ? "Role ya game state badalne se agla opportunity badal sakta hai, lekin yeh historical moment future fantasy score ke baare mein kuch pakka nahi batata."
          : "A change in role or game state can alter who gets the next opportunity, but this historical moment says nothing certain about a future fantasy score.",
    });
  }

  function makePrompt(
    match: MatchIndexEntry,
    moment: {
      id: string;
      title: string;
      summary: string;
      innings: number;
      over: number;
      ball: number;
    },
    grounding: string,
    depth: string,
    language: string,
  ) {
    return `Explain this moment in ${language === "hi" ? "Hinglish" : "English"} for ${depth === "nerd" ? "a cricket tactician who wants the numbers" : "a new fan who wants plain language"}.
Do not overstate certainty. Return exactly the requested JSON structure.

Match: ${match.title}
Moment: ${moment.title} — ${moment.summary} (innings ${moment.innings}, over ${moment.over + 1}, ball ${moment.ball})
Grounding data:
${grounding}`;
  }

  for (const matchInfo of index) {
    const raw = JSON.parse(
      await readFile(
        path.join(dataDir, "matches", `${matchInfo.id}.json`),
        "utf8",
      ),
    ) as RawMatch;
    const analysis = analyzeMatch(raw);
    const rawMomentMap = analysis.moments;
    const generated: Record<string, Explanation> = store[matchInfo.id] ?? {};
    for (const moment of rawMomentMap) {
      for (const depth of ["new-fan", "nerd"] as const) {
        for (const lang of ["en", "hi"] as const) {
          const key = `${moment.id}:${depth}:${lang}`;
          if (
            cached?.version === generationVersion &&
            cached.model === modelKey &&
            cached.explanations[matchInfo.id]?.[key]
          ) {
            generated[key] = cached.explanations[matchInfo.id][key];
            continue;
          }
          let explanation = localExplanation(
            moment,
            analysis,
            moment.innings,
            depth,
            lang,
          );
          if (ai) {
            for (let attempt = 0; attempt < 2; attempt += 1) {
              try {
                const response = await ai.models.generateContent({
                  model: MODEL,
                  contents: makePrompt(
                    matchInfo,
                    moment,
                    groundingFor(matchInfo, analysis, moment),
                    depth,
                    lang,
                  ),
                  config: {
                    systemInstruction: EXPLANATION_SYSTEM,
                    responseMimeType: "application/json",
                    responseSchema: explanationResponseSchema,
                  },
                });
                const responseText = response.text;
                if (!responseText)
                  throw new Error("Gemini returned an empty response.");
                explanation = ExplanationSchema.parse(JSON.parse(responseText));
                break;
              } catch (error) {
                if (attempt === 1) {
                  console.error(
                    `Gemini failed for ${matchInfo.id}/${key}; using grounded local explanation.`,
                    error,
                  );
                } else {
                  await new Promise((resolve) =>
                    setTimeout(resolve, 900 * 2 ** attempt),
                  );
                }
              }
            }
          }
          generated[key] = explanation;
          store[matchInfo.id] = generated;
          cachedExplanations = {
            ...cachedExplanations,
            [matchInfo.id]: generated,
          };
          await mkdir(path.dirname(cacheFile), { recursive: true });
          await writeFile(
            cacheFile,
            JSON.stringify(
              {
                version: generationVersion,
                model: modelKey,
                explanations: cachedExplanations,
              },
              null,
              2,
            ),
          );
          console.log(
            `${ai ? "Generated/cached" : "Prepared offline"} ${matchInfo.id} · ${key}`,
          );
        }
      }
    }
    store[matchInfo.id] = generated;
  }
  await writeFile(targetFile, JSON.stringify(store, null, 2));
  console.log(
    `Wrote explanations for ${Object.keys(store).length} matches${ai ? ` with ${MODEL}` : " without a Gemini key (offline grounded mode)"}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
