import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  EXPLANATION_SYSTEM,
  explanationResponseSchema,
  MODEL,
  validateExplanation,
  groundingFor,
} from "@/lib/ai";
import { getMatch } from "@/lib/data";
import { ExplainRequestSchema } from "@/lib/types";

export const runtime = "nodejs";

const minuteHits = new Map<string, number[]>();
const dailyHits = new Map<string, number>();
const redisReady = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
const redis = redisReady ? Redis.fromEnv() : null;
const minuteLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(6, "1 m"),
      prefix: "wtm-minute",
    })
  : null;
const dailyLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(30, "1 d"),
      prefix: "wtm-daily",
    })
  : null;

function allowedInMemory(ip: string) {
  const now = Date.now();
  const recent = (minuteHits.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < 60_000,
  );
  if (recent.length >= 6) return false;
  recent.push(now);
  minuteHits.set(ip, recent);
  const day = Math.floor(now / 86_400_000);
  const dailyKey = `${day}:${ip}`;
  const count = dailyHits.get(dailyKey) ?? 0;
  if (count >= 30) return false;
  dailyHits.set(dailyKey, count + 1);
  return true;
}

async function rateAllowed(ip: string) {
  if (minuteLimiter && dailyLimiter) {
    const [minute, daily] = await Promise.all([
      minuteLimiter.limit(ip),
      dailyLimiter.limit(ip),
    ]);
    return minute.success && daily.success;
  }
  return allowedInMemory(ip);
}

function streamText(text: string) {
  const encoder = new TextEncoder();
  const characters = Array.from(text);
  let cursor = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (cursor >= characters.length) {
        controller.close();
        return;
      }
      const next = characters.slice(cursor, cursor + 24).join("");
      cursor += 24;
      controller.enqueue(encoder.encode(next));
    },
  });
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192)
    return NextResponse.json(
      { error: "Question request is too large." },
      { status: 413 },
    );
  const parsed = ExplainRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the moment and keep your question under 400 characters.",
      },
      { status: 400 },
    );
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Live follow-ups are not configured. The saved, match-grounded explanation is still available.",
      },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  try {
    if (!(await rateAllowed(ip)))
      return NextResponse.json(
        { error: "Question limit reached. Try again in a little while." },
        { status: 429 },
      );
  } catch (error) {
    console.error("Rate limiter unavailable.", error);
    return NextResponse.json(
      { error: "Follow-ups are temporarily unavailable." },
      { status: 503 },
    );
  }

  const { matchId, momentId, question, depth, lang } = parsed.data;
  const match = await getMatch(matchId);
  const moment = match?.analysis.moments.find((item) => item.id === momentId);
  if (!match || !moment)
    return NextResponse.json(
      { error: "That moment is not in this match archive." },
      { status: 404 },
    );
  const grounding = groundingFor(match.info, match.analysis, moment);
  const prompt = `Answer the fan's follow-up in ${lang === "hi" ? "Hinglish" : "English"} for ${depth === "nerd" ? "a cricket tactician" : "a new fan"}.
Use only the grounding data for facts. Keep the reasoning concise and explicitly tentative. If the data cannot answer the question, say so in cantKnow. Do not make betting or lineup recommendations.
Question: ${question}
Moment grounding:
${grounding}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const generated = await ai.models.generateContentStream({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: EXPLANATION_SYSTEM,
        responseMimeType: "application/json",
        responseSchema: explanationResponseSchema,
      },
    });
    let responseText = "";
    for await (const chunk of generated) responseText += chunk.text ?? "";
    if (!responseText) throw new Error("Gemini returned an empty response.");
    const validated = validateExplanation(JSON.parse(responseText));
    return new Response(streamText(validated.reasoning.text), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Gemini follow-up failed.", error);
    return NextResponse.json(
      {
        error:
          "Gemini could not answer this one. The saved explanation is still available.",
      },
      { status: 502 },
    );
  }
}
