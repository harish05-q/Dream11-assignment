# WhyThisMoment

WhyThisMoment is an AI-assisted cricket explainer for fans who see a tactical change during a match and want to know why it might have happened—without mistaking a plausible read for a confirmed fact. The prototype uses a small, automatically selected archive of real past IPL matches; it is not a live-score product.

## How the answer is grounded

`npm run data` downloads Cricsheet's IPL JSON archive and chooses three distinct fixtures by rule: an IPL final, a winning chase completed in the last over, and a high-scoring chase or a rapid wicket cluster. The original match JSON is bundled under `data/matches/`, with selection metadata in `data/index.json`. Cricsheet is credited in the interface and on About.

`lib/analysis.ts` is a pure calculation module. It derives delivery and over score state, run rates, phases, bowler figures by phase, partnerships, bowling changes, scoring profiles, tactical moments and a deliberately simple estimated win-probability curve. A moment's confirmed lines point back to the delivery or phase figures. Moment selection is heuristic, and its surprise value is a ranking aid—not a probability.

`npm run generate` builds all moment × depth × language explanations. If `GEMINI_API_KEY` is configured, it requests JSON from Gemini, validates each response with Zod and resumes from its cache. Without a key, it writes cautious, scorecard-grounded local explanations so the site is still usable. Live follow-ups validate input, rebuild context server-side, validate model output and stream only the validated answer. Upstash Redis applies per-IP rate limits and a daily cap when configured; a process-local fallback is used otherwise.

## Limits and uncertainty

The source can establish recorded events, not a captain's intent, the words in a huddle, full field placement, or a bowler's type unless that information is explicitly present. The current bundled files do not expose enough consistent evidence to detect spinner type or infer batting-order intent, so the interface does not guess. Review moments are detected only when the source records a review.

Win probability is an uncalibrated estimate, not a betting model or official feed. First-innings score is mapped through a logistic curve around a 150-run reference. In a chase, a wickets-left-adjusted expected scoring rate is compared with required runs per ball; the plotted probability is for the team batting first. Weather, pitch, injuries, player quality and tactics are not modelled. Fantasy context is general only and is never betting, captain or lineup advice.

Optional AI text is provided through Google's Gemini API. Questions are sent to Google only when a fan submits them. No API key is exposed to the browser. Review Cricsheet's current attribution and data terms before redistributing match files.

## Run locally

Use Node.js 20.9 or newer.

```bash
npm install
npm run data
npm run generate
npm run dev
```

For production, run `npm run build` then `npm run start`. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` for generated prebuild explanations and live follow-ups. Optional Upstash variables enable distributed rate limiting; `SITE_URL` sets the sitemap and Open Graph base URL.

## Checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```
