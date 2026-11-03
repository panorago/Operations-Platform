# Start VENDA

Use the existing isolated checkout at `/workspace/Operations-Platform`. Do not create a Git worktree unless the user explicitly requests one. Read README.md. Use Node.js 24 / npm 11; preserve injected proxies, CA trust, existing source, `.env.local`, and `.runtime` data.

Dependencies and the production build are retained by environment snapshots. Run `npm ci` when refreshing dependencies, without modifying the lockfile. Start `npm run dev` in a persistent execution session from the repository root. This starts Vite on port 5173 and the API/reminder worker on port 3001. Check for existing services first; stop only services you started. Processes must restart after restoration. For production-style validation, run `npm run build`, then `npm start` instead.

Verify the development API proxy with `curl --noproxy '*' -fsS http://127.0.0.1:5173/api/auth`; expect JSON with `needsSetup` and `user`. Verify the UI with `curl --noproxy '*' -fsS http://127.0.0.1:5173/dashboard`; expect the VENDA HTML entrypoint. Do not create loopback preview links. A fresh database presents first-administrator setup; do not invent or store administrator credentials. The user creates their account in the application.

Run `npm run build`, `npm test` (17 domain/provider tests), and `npm run test:e2e` (one comprehensive Chromium workflow). Browser tests use a separate temporary database and npm-distributed Chromium. They must not initialise the primary workspace.

Allow map tiles at tile.openstreetmap.org. Inter is bundled locally and has an optional Google Fonts import. Optional AI requires ANTHROPIC_API_KEY for api.anthropic.com. Email uses RESEND_API_KEY, EMAIL_FROM, FINANCE_EMAIL. SMS uses TWILIO_ACCOUNT_SID, SMS_FROM, FINANCE_PHONE, and TWILIO_AUTHORIZATION (the full Basic authorization header for proxy-backed secrets). Inspect variable names and presence only, never values. Missing providers must remain visibly unconfigured. Live credentials have not been verified. Truck locations are simulated. Payment actions record manual settlement; they do not debit wallets or bank accounts.
