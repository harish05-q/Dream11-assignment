1. Use Node.js 20.9+ and a Next.js-compatible host.
2. Set `SITE_URL` to the public origin.
3. Optional: set `GEMINI_API_KEY` and `GEMINI_MODEL`.
4. Optional: set both Upstash Redis REST variables for distributed limits.
5. Run `npm ci`.
6. Run `npm run data && npm run generate`.
7. Run `npm run build`.
8. Start with `npm run start` (or deploy the generated Next.js output).
