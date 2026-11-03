# VENDA · FreshMark Operations Intelligence

**[Open VENDA](https://panorago.github.io/Operations-Platform/#/dashboard)**

VENDA is hosted directly on GitHub Pages. It does not require a separate hosting signup, deployment redirect, paid hosting blueprint, or external service to open and use the device workspace. The repository root contains the compiled site: `index.html`, `assets/`, and `.nojekyll`. GitHub Pages should publish **main / (root)**.

## What this hosted site does

All eight routes work directly in the browser: dashboard, tracking, catalogue, orders, inventory, credits, alerts, and settings. Orders, stock receipts, invoice settlements, configured interest policies, notification preferences and company details are saved in that browser's local storage. Dylan is the device-workspace administrator identity. Existing browser data is retained across this update.

This is a **single-device workspace**, not a shared authenticated service. Data is not synchronised between staff, devices or browsers. Device member entries are contact records, not secure login accounts. Clearing browser/site storage removes this local data. The initial supplier/product/invoice records are sample seeds. Fleet positions animate automatically from seeded routes. There is no automatic transaction generator; orders and payments are created through the checkout and settlement flows. Reset sample data restores the seeds only after confirmation.

Live local monitoring evaluates stock, credit and delivery risks without an API key. GitHub Pages cannot keep an AI secret or execute a server worker. Live cloud AI, shared accounts/database, email/SMS delivery and payment-provider integration require an optional backend you control. The code does not pretend those capabilities run securely inside a static website. No secret should be added to a `VITE_` variable.

Payments are manual settlement records; they do not debit a bank account or wallet. Credit interest is disabled until an approved policy is entered in Settings → Credits. Product photographs are generated, product-specific illustrations; they are not verified supplier pack shots.

## Workflows

- **Dashboard:** operational metrics, selectable chart period/metric, interactive fleet overview, supplier network, shelf health, monitoring, urgent invoice and recorded transaction stream.
- **Tracking:** animated direction-aware truck markers, route animation, pause/resume/speed/fit/follow controls, driver details and linked order manifests with CSV download. Offline schematic roads appear when tiles are unavailable. Routes loop after a 20-second arrival stop.
- **Catalogue:** product photos, supplier/category/search/sort/availability filters, minimum/maximum price fields, typed bulk quantities up to 1,000,000, cart, VAT and supplier-specific credit availability.
- **Orders:** supplier/status/date/search filters, sortable paginated table, detail drawer and Process / Dispatch / Receive / Cancel actions. Receiving updates stock once. Cancelling unpaid credit releases principal.
- **Inventory:** stock summaries, issues filters, dated inventory rows, prefilled reorders and an actionable local monitoring panel.
- **Credits:** account balances, invoice statuses, reminders, manual settlement records, receipts, accrued interest and explicit credit interest consent.
- **Alerts:** unread state, category filters, contextual reorder/payment/tracking actions and mark-all-read.
- **Settings:** company/supplier/member records, notification preferences, reminder thresholds and credit interest policy.

Prices are USD, VAT is 15%, and monetary calculations use cents with supplier-level VAT rounding. Opening credit balances are the supplied snapshots, which differ from the supplied invoice totals. Dates determine invoice status rather than inconsistent relative seed labels. Displayed timestamps use Africa/Harare.

Interest is simple daily interest on principal including VAT: `principal × APR / 100 × chargeableDays / 365`, rounded to cents. Policies support 0–100% APR and 0–365 grace days. Each new credit invoice stores its agreed rate and grace period. The due-date quote is an estimate; actual interest uses the recorded settlement date. Existing invoices without agreed rates are not retrospectively charged. Credit limits apply to principal. Invalid, future or pre-purchase settlement dates are rejected.

## Build and publish the standalone site

Requires Node.js 24 and npm 11. From this repository:

```sh
npm ci
npm run build:pages
npm run test:pages
```

`build:pages` builds with the `/Operations-Platform/` asset prefix, uses hash routing so route refreshes work on Pages, and updates the generated root deployment files. Commit and push those files along with source changes. GitHub's branch-based Pages publishing then rebuilds the site. A successful push is not independent proof that the remote Pages deployment completed.

The canonical Vite HTML source is **web/index.html**. Do not hand-edit the generated root HTML/assets. TypeScript application source remains under `src/`. The validation workflow checks both the standalone and optional server builds and detects stale committed Pages output.

```sh
npm test
npm run build
npm run test:e2e
npm run test:pages
```

The 27 domain/provider tests cover integer-cent VAT, credit limits, permissions, delivery receipt, invoice settlement, daily interest, consent, date handling, reminders, fleet movement and mocked AI/provider behaviour. The thirteen Pages browser scenarios exercise all eight routes with no API server, persisted data, product photos, bulk quantities, price fields, interest acceptance, pause/resume, accessible dropdowns, payment validation, review and receipt downloads. The separate server browser workflow uses a temporary SQLite database. Chromium is supplied through an npm package, so no separate browser download is required.

## Optional self-hosted backend

The provider-independent Express/SQLite backend remains in the repository for users who need a shared service. The public GitHub Pages site does not depend on it. There is no vendor-specific hosting configuration or deployment link.

For local development:

```sh
npm ci
npm run dev
```

Vite listens on port 5173 and proxies `/api` to the API on port 3001. For a built installation on your own Node.js 24 server:

```sh
npm run build
npm start
```

Express serves the UI and API together. `PORT` overrides 3001 and `DATA_DIR` chooses a persistent database directory (default `.runtime`). Do not delete it to refresh dependencies. Back up SQLite consistently with its WAL, using SQLite's backup facilities or stopping the process before copying. Use one application process per database.

Configure HTTPS, `COOKIE_SECURE=true`, and a securely generated `SETUP_TOKEN` before exposing an uninitialised production server. The first administrator supplies that setup key and creates their own password; setup then closes. Sessions are HTTP-only, same-site and expire after 24 hours. The server enforces Admin / Operations / Finance mutations independently of navigation. `/api/health` provides an unauthenticated database readiness check. `.env.local` is loaded when present; `.env.example` lists optional variables without credentials.

Optional integrations:

- **Anthropic:** server-only `ANTHROPIC_API_KEY`. The monitoring worker calls `claude-sonnet-4-6` when relevant data or the calendar day changes, caches assessments in SQLite and observes a configurable 5–60 minute minimum automatic interval. Local scans run every minute. Manual analysis is rate-limited. Calls can incur provider charges. A key is not shown as verified until a provider response succeeds. AI advises; it does not place orders or record payments.
- **Email:** `RESEND_API_KEY`, verified `EMAIL_FROM`, `FINANCE_EMAIL`.
- **SMS:** `TWILIO_ACCOUNT_SID`, `SMS_FROM`, `FINANCE_PHONE`, plus `TWILIO_AUTH_TOKEN` on a normal server or `TWILIO_AUTHORIZATION` (the complete Basic header) for proxy-backed secrets.

The server reminder worker evaluates configured thresholds and daily overdue in-app pings, suppresses paid invoices, and records blocked/failed/accepted external submissions. Accepted submissions are not claimed as confirmed delivery. Delivery callbacks, automatic retries after ambiguous submissions, automatic invitation email and password recovery are not implemented. Check provider logs before retrying uncertain sends. Live integrations remain unverified without credentials.

Where network policy is restricted, allow `tile.openstreetmap.org`, `fonts.googleapis.com`, `fonts.gstatic.com` and any enabled provider hosts (`api.anthropic.com`, `api.resend.com`, `api.twilio.com`). Inter is also bundled locally. Node retains environment proxy and CA configuration and TLS verification.

## Audit and reusable environment notes

See [the supplied specification](docs/SPECIFICATION.md) and [audit report](docs/AUDIT.md). The earlier cloud environment draft was locked, so those configuration edits were not saved. Provider-independent proposed instructions remain in `environment/install.sh`, `environment/START.md`, and `environment/config.proposed.json` for separate review. No live process, cloud publication or external account should be assumed to survive a snapshot.

Router v6 is retained as requested. npm reports moderate upstream router advisories; this app does not use SSR hydration or accept arbitrary navigation targets. The previously identified high-severity validation-library advisory was patched.

Payment entry uses method selection, reference details, review and a downloadable receipt. Bank transfers and EcoCash settlements require an external reference and confirmation that payment was received. VENDA records settlement; it does not debit an account. Dropdowns support keyboard navigation and remain usable during fleet updates.

The layout adapts from 320px phones to wide desktops: navigation becomes a drawer below 1024px, catalogue filters collapse on phones, content panels stack, and wide tables scroll within their own panels. Responsive browser checks cover 320, 375, 768, 844, 1024, 1280 and 1920px widths, including landscape payment dialogs and mobile checkout.
