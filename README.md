# VENDA · FreshMark Operations Intelligence

A desktop-first React 18 / TypeScript application for FreshMark Retail Zimbabwe, with an Express API, SQLite persistence, session authentication, and server-enforced roles. The supplied 6 suppliers, 29 products, 8 trucks, invoices, alerts, and historical orders seed a new database once.

## Run

Requires Node.js 24 and npm 11. Run from the repository root:

```sh
npm ci
npm run dev
```

Vite listens on port 5173 and proxies `/api` to port 3001. Open the application through your environment's supported access mechanism. The first visit creates the administrator account; there is no default password. Initialise this account before exposing a deployment publicly. Subsequent visits require sign-in.

For a built application:

```sh
npm run build
npm start
```

Express serves the application and API together on port 3001. `PORT` overrides the port. `.env.local`, when present, is loaded by the server. Use `.env.example` as a reference and supply actual credentials securely; never commit them or prefix secrets with `VITE_`.

## Workflows

- **Dashboard:** operational metrics, supplier health, map overview, nearest deliveries, stock issues, urgent invoice, and a seven-day orders chart.
- **Tracking:** selectable truck list and map, driver details, schematic route, estimated straight-line distance, and CSV manifest downloads. Telemetry is explicitly simulated every 30 seconds. Seed manifests use linked dispatched-order product quantities; no external GPS feed is connected. The supplier-alert button prepares a contact notification rather than claiming an email was sent.
- **Catalogue:** supplier/category/price/availability/search/sort filters, persistent cart, quantities, VAT, supplier-specific projected credit availability, and pay or Net 7/15/30 checkout. Orders split by supplier. Store stock is not supplier warehouse availability.
- **Orders:** search, supplier/status/date filters, sortable columns, ten-row pagination, details, and fulfilment transitions. Receiving a dispatched order adds its quantities to inventory once. Cancelling an unpaid credit order voids its invoice and releases credit.
- **Inventory:** stock metrics and issues filters, prefilled reorder quantities, and streaming AI recommendations with an honest rule-based fallback.
- **Credits:** current account balances, due-date calculations, outstanding/paid views, reminder timelines, manual payment records, and receipts. Overdue supplier accounts can be suspended from new credit orders.
- **Alerts:** category filters, unread tracking, actions, and mark-all-read.
- **Settings:** company profile, supplier editing/creation, user creation with roles, notification preferences, and reminder thresholds.

Admin has all permissions. Operations manages logistics, purchasing, and inventory. Finance views orders and manages invoices/payments. The API independently rejects unauthorised mutations; hiding navigation is not the permission boundary. User creation provisions a local account; share its initial credentials securely. Automatic invitation email and password recovery are not implemented.

## Financial semantics

All prices are USD. VAT is 15%, rounded to cents per supplier order. Checkout totals use the same rounding rule as the server. The server calculates prices and rejects invalid quantities, unavailable credit, and suspended supplier credit. Checkout creates operational purchase records; it does not send purchase orders to supplier ERP systems.

EcoCash, bank transfer, and cash on delivery are settlement methods recorded by the application. No bank account or wallet is debited. Finance must verify receipt before recording an invoice payment. There is no live payment-gateway integration. Original account balances are supplied snapshots and intentionally remain distinct from the inconsistent invoice totals in the brief. Dates, rather than conflicting relative labels, determine invoice status. Displayed timestamps use Africa/Harare.

## Optional integrations

**Anthropic:** set server-only `ANTHROPIC_API_KEY`. The server calls `claude-sonnet-4-6` with low-stock data and streams the response. The browser receives neither the key nor direct provider access. Missing credentials and upstream failures preserve the default recommendation. Live AI was not tested without a key.

**Email:** set `RESEND_API_KEY`, a verified `EMAIL_FROM`, and `FINANCE_EMAIL`. **SMS:** set `TWILIO_ACCOUNT_SID`, `SMS_FROM`, `FINANCE_PHONE`, and either `TWILIO_AUTH_TOKEN` for a normal server or `TWILIO_AUTHORIZATION` for proxy-backed credentials. The latter is the full Basic authorization header supplied securely; encoding a proxy placeholder as a password will not work.

The reminder worker runs every minute while the server is running. It evaluates configured thresholds, stores in-app reminder state, and submits enabled email/SMS threshold reminders to the configured providers. Daily overdue pings are in-app. Payments stop future reminders. Accepted provider submissions are distinguished from confirmed recipient delivery; delivery callbacks are not implemented. Missing providers remain blocked. Ambiguous/failed submissions are retained for review and are not automatically retried. Inspect provider logs before retrying an uncertain send. These adapters have mocked request tests; live delivery requires your provider accounts and verified senders. Notification preferences do not retroactively erase existing alerts.

**Network:** allow `tile.openstreetmap.org`, `fonts.googleapis.com`, `fonts.gstatic.com`, `api.anthropic.com`, `api.resend.com`, and `api.twilio.com` where required. Inter is also bundled locally so typography works without Google Fonts. The server uses Node's environment-proxy support and retains TLS verification. Map tiles require permitted network access; routes and GPS markers work independently of tiles. The current cloud policy blocks the tile/font destinations until the saved network draft is applied.

## Validation

```sh
npm run build
npm test
npm run test:e2e
```

Domain tests cover checkout, rounding, credit enforcement, permissions, payments, cancellation, stock receipt, date handling, and reminders. Provider tests exercise request construction, rejection, missing configuration, and paid-invoice suppression. Playwright uses an npm-distributed Chromium binary and a separate temporary database. Its workflow covers every route, credit ordering, receiving stock, recording payment, manifest download, read state, settings persistence, local user creation, and API permission rejection. No live provider calls are required.

## Persistence and deployment

SQLite data, users, hashed session tokens, and an append-only command audit live in `.runtime/venda.sqlite`; `DATA_DIR` selects another directory. Do not delete this directory to refresh dependencies. Back up SQLite consistently with its WAL, using SQLite's backup facilities or stopping the service before copying. Keep one application process per database; this is a small-store deployment rather than a distributed database service.

Terminate HTTPS at your deployment proxy and set `COOKIE_SECURE=true`. Sessions use HTTP-only, same-site cookies and expire after 24 hours. Mutations reject cross-origin browser requests; login attempts are rate-limited. Session data and operational seeds are server-owned; Zustand holds the client view, cart, and UI selections. There is no live-process restoration after a cloud snapshot: restart the service using the saved instructions.

React Router v6 is retained as requested. npm reports moderate upstream router advisories, including SSR hydration and untrusted redirect paths; this app does not use SSR hydration or accept arbitrary navigation targets. The high-severity validation-library advisory was patched. Upgrading to a supported patched router major requires changing the requested version constraint.

## Cloud configuration handoff

The existing environment draft rejected edits as locked/uneditable. Its saved scripts and network settings were **not updated**. Complete proposed instructions are preserved in `environment/install.sh`, `environment/START.md`, and `environment/config.proposed.json`. Apply these additions in environment settings, preserving any other existing domain rules. If the draft remains locked after publication finishes, open a new setup chat from environment settings and use the preserved proposal. Review/save and publication are user actions; neither has been performed by this implementation task.

## Deploy to Render

A deployment blueprint is included in `render.yaml`. See [Render deployment instructions](environment/RENDER.md) for the launch link, account connection, pricing confirmation, persistent disk, and protected first-administrator setup. Production setup requires `SETUP_TOKEN`; Render generates it automatically. `/api/health` provides an unauthenticated database readiness check. The repository and ZIP have been pushed to GitHub; a public app URL exists only after the hosting service is actually created and reports Live.

## GitHub Pages preview and specification audit

The repository root now contains a **built, browser-only preview** for the existing `https://panorago.github.io/Operations-Platform/` Pages site. Configure GitHub Pages to publish `main` / `(root)` when using this prebuilt version. `index.html`, `assets/`, and `.nojekyll` are generated deployment output. The canonical Vite HTML source is **`web/index.html`**; application TypeScript remains under `src/`.

Run `npm run build:pages` before committing a client update. This builds with the `/Operations-Platform/` asset prefix, uses hash routing for refresh-safe Pages URLs, and refreshes the generated root deployment files. `npm run test:pages` exercises the preview at that exact path without a backend. `npm run build` continues to build the full server application into `dist/` for Render. The validation workflow checks both targets and detects stale committed Pages output.

The preview opens directly into the seeded dashboard and labels itself **VENDA PREVIEW**. Its changes are saved only in that browser's local storage; Reset preview restores the sample workspace. Preview users are sample team records, not authenticated accounts. It sends no passwords, purchase orders, payments, AI requests, email, or SMS. The full server build retains authentication, SQLite, server role enforcement, and optional integration adapters. GitHub Pages cannot host that server. Deploy to Render for a shared workspace.

See [the supplied specification](docs/SPECIFICATION.md) and [the audit report](docs/AUDIT.md) for checked requirements, corrections, intentional differences, and remaining deployment/integration blockers. A GitHub push is not proof that the remote Pages rebuild or Render deployment has completed.
