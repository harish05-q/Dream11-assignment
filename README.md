<div align="center">
  <svg width="100%" height="240" viewBox="0 0 1200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="WhyThisMoment banner">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#070b17"/>
        <stop offset="35%" stop-color="#111827"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" x2="1">
        <stop offset="0%" stop-color="#22d3ee"/>
        <stop offset="50%" stop-color="#8b5cf6"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
      <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="1200" height="240" rx="32" fill="url(#bg)"/>
    <circle cx="150" cy="95" r="120" fill="url(#glow1)">
      <animate attributeName="cx" values="150;1080;150" dur="17s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="90;120;90" dur="13s" repeatCount="indefinite"/>
    </circle>
    <circle cx="1030" cy="130" r="170" fill="url(#glow2)">
      <animate attributeName="cx" values="1030;180;1030" dur="19s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="130;80;130" dur="15s" repeatCount="indefinite"/>
    </circle>

    <rect x="38" y="35" width="1124" height="170" rx="24" fill="rgba(15, 23, 42, 0.72)" stroke="rgba(148, 163, 184, 0.24)"/>

    <text x="78" y="96" fill="#e2e8f0" font-size="24" font-weight="700" font-family="Segoe UI, sans-serif" letter-spacing="3">
      WHYTHISMOMENT
    </text>
    <text x="78" y="142" fill="#f8fafc" font-size="46" font-weight="800" font-family="Segoe UI, sans-serif">
      Cricket, with
    </text>
    <text x="78" y="192" fill="url(#accent)" font-size="46" font-weight="800" font-family="Segoe UI, sans-serif">
      the moment explained.
    </text>

    <g transform="translate(910 62)">
      <rect x="0" y="0" width="190" height="82" rx="20" fill="rgba(15,118,110,0.2)" stroke="rgba(34,211,238,0.8)"/>
      <text x="95" y="35" fill="#67e8f9" font-size="22" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">
        AI + DATA
      </text>
      <text x="95" y="60" fill="#e2e8f0" font-size="16" font-weight="500" text-anchor="middle" font-family="Segoe UI, sans-serif">
        cricket insight
      </text>
    </g>
  </svg>
</div>

<p align="center">
  <a href="#"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=nextdotjs&logoColor=white"/></a>
  <a href="#"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/></a>
  <a href="#"><img alt="Gemini AI" src="https://img.shields.io/badge/Gemini-AI-8B5CF6?style=for-the-badge&logo=google&logoColor=white"/></a>
  <a href="#"><img alt="CricSheet" src="https://img.shields.io/badge/Source-CricSheet-22C55E?style=for-the-badge&logo=cricket&logoColor=white"/></a>
</p>

# WhyThisMoment

> The moment is obvious. The reason isn’t.

WhyThisMoment is an AI-assisted cricket explainer for fans who want to understand tactical turning points without getting lost in noise, speculation, or outdated post-match hot takes. It transforms match data into clear context around the key swing points in a game: the bowling change, the wicket burst, the partnership break, the phase shift, and the tactical decision that shaped the result.

This project mixes structured cricket data, tactical analysis, and optional AI-generated explanation to answer one simple question:

“Why did this moment matter?”

---

## Why this project exists

In cricket, a key over often feels self-explanatory until you ask the real question:

- Why was that bowling change necessary?
- Why did the run rate suddenly spike?
- Was the wicket the trigger, or the consequence?
- What changed in match pressure at that point?

WhyThisMoment answers those questions with a more grounded lens:
- performance pressure by phase
- score progression and run-rate context
- wicket and partnership influence
- over-by-over tactical story
- AI support to make the answer readable and understandable

---

## ✨ What makes it special

- AI-assisted tactical explanations for cricket moments
- Grounded analysis based on live match state and match history
- Focus on match pressure, phases, and tactical shifts
- Clear fact-vs-interpretation framing
- Built for fans who want clarity without fake certainty
- Designed around the “moment” rather than generic score summaries

---

## 🧠 How it works

```mermaid
flowchart LR
    A[CricSheet IPL archive] --> B[Data pipeline]
    B --> C[Match + delivery analysis]
    C --> D[Moment detection]
    D --> E[Grounded tactical explanations]
    E --> F[Next.js experience]
```

The app does four main things:

1. Loads curated IPL archive fixtures
2. Computes tactical and score-state metrics from deliveries
3. Identifies high-impact moments such as turning overs or wicket clusters
4. Produces an understandable narrative about why the moment mattered

The system is designed to explain the “why” behind a turning point without pretending to know unrecorded intent.

---

## 📊 Project snapshot

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-87%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 87%" />
  <img src="https://img.shields.io/badge/CSS-12.8%25-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS 12.8%" />
  <img src="https://img.shields.io/badge/JavaScript-0.2%25-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript 0.2%" />
</p>

---

## 🏗️ Tech stack

- Next.js
- React
- TypeScript
- Framer Motion
- D3
- Zod
- Google Gemini API
- CricSheet-based dataset
- Vitest + TypeScript checks

This keeps the product fast, modular, and open to richer match analysis over time.

---

## 🔍 Core principle

WhyThisMoment does not pretend to know what the captain was thinking in the huddle.

Instead, it explains what can be known from the match itself:
- scoring phase
- wicket pressure
- overs remaining
- partnership context
- run-rate changes
- tactical shifts in momentum

Where the data is incomplete, the app stays explicit about uncertainty.

---

## 🚀 Getting started

Use Node.js 20.9 or newer.

```bash
npm install
npm run data
npm run generate
npm run dev
```

For production:

```bash
npm run build
npm start
```

Then copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY` for generated prebuild explanations and live follow-ups.

---

## 📦 Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the app locally |
| `npm run build` | Build the production app |
| `npm start` | Run the built app |
| `npm run data` | Fetch and prepare match data |
| `npm run generate` | Generate match explanations |
| `npm run typecheck` | TypeScript validation |
| `npm test` | Run the test suite |
| `npm run lint` | Run ESLint checks |

---

## 🧪 Quality and guardrails

The project is intentionally built around uncertainty-aware analysis:

- it prioritizes evidence over invented context
- it avoids hidden-intent claims
- it separates observed facts from interpretation
- it explicitly warns when data cannot fully explain a decision

This makes the output more trustworthy for fans who want clarity without overclaiming.

---

## 🧭 Project structure

```text
WhyThisMoment/
├── app/
├── components/
├── data/
├── lib/
├── scripts/
├── tests/
├── .env.example
├── DEPLOY.md
├── eslint.config.mjs
├── next-env.d.ts
├── package.json
├── tsconfig.json
├── README.md
└── package-lock.json
```

---

## ⚠️ Limits and uncertainty

This project explains tactical moments using data, not hidden intent.

It cannot fully know:
- captain’s private strategic intent
- exact field placements not captured in the record
- unrecorded conversations in the huddle
- every nuance of player psychology

The result is an evidence-based explanation layer, not a claim of certainty.

---

## 🌍 Why it matters

Cricket is often described in broad strokes:
- that over changed the game
- the bowling change broke the partnership
- the wicket was the defining moment

But the real story usually lives in the details:
- pressure curves
- wicket clusters
- phase changes
- scoring rhythm
- tactical adjustments

WhyThisMoment was built to make those details readable and useful.

---

## 🙌 Acknowledgements

- CricSheet for match data
- Google Gemini for optional natural-language explanation support
- The broader cricket analytics and storytelling community

---

<p align="center">
  <i>Built for fans who want explanations, not just opinions.</i>
</p>
