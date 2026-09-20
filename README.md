# Free Invoice Generator

Create, customize and download professional invoices — no signup, no watermark.

The defining architectural constraint: **anonymous invoice creation makes zero
backend requests.** Totals are calculated on the user's device, uploaded images
are processed there, drafts are stored in IndexedDB, and the PDF and Word files
are generated in the browser. This is why the site can state plainly that it
does not hold your invoice data — it never receives it.

## Getting started

```bash
npm install
cp .env.example .env     # works as-is for local development
npx prisma db push       # creates the local SQLite database
npm run dev
```

The generator is fully functional with no configuration. Google OAuth, analytics
and AdSense are all optional and hide themselves when unset.

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright, against a production build) |
| `npm run test:all` | Both |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Architecture

```
Browser ── CDN ── Next.js (static/SSG) ── minimal API ── SQLite/Postgres
   │                                          │
   ├─ calculations                            ├─ auth (optional)
   ├─ image processing                        ├─ saved invoices (opt-in)
   ├─ IndexedDB persistence                   ├─ blog CMS
   └─ PDF + Word generation                   └─ contact inbox
```

71 pages are prerendered at build time and never touch the database. The
database is only reached by `/api/*`, the admin area and NextAuth.

### The invoice domain (`src/lib/invoice`)

| File | Responsibility |
| --- | --- |
| `types.ts` | The one normalised `Invoice` shape every renderer consumes |
| `money.ts` | Integer micro-unit arithmetic — no float money maths anywhere |
| `calculations.ts` | Totals: discounts, inclusive/exclusive tax, charges |
| `validation.ts` | Zod schemas (used client-side *and* re-run server-side) |
| `templates.ts` | 20 presets over 5 structural layouts |
| `labels.ts` | User-editable wording for everything printed |
| `pdf.tsx` | Vector PDF via `@react-pdf/renderer` |
| `docx.ts` | Real OOXML Word export |
| `storage.ts` | Versioned IndexedDB persistence with a migration path |
| `images.ts` | Magic-byte validation, resize, compress, thumbnail |

Business logic is deliberately free of React so it can be tested exhaustively
and reused by every renderer without divergence.

### Decisions worth knowing

**Money is never a float.** Every amount is an integer count of micro-units
(1e-6) and is rounded to an integer after each operation. `0.1 + 0.2` is exactly
`0.3` here.

**Rounding happens per line, not at the end.** Each displayed amount is rounded
before it enters any sum, so the printed rows always add up to the printed
total. Carrying full precision and rounding once is arithmetically "purer" but
produces invoices that are a cent out when a customer checks them by hand.

**Discounts apply before tax.** Tax authorities charge tax on the discounted
consideration; computing tax first overstates what is owed.

**Templates are data, not forks.** A template is a layout plus a styling preset.
Selecting one sets `templateId` and merges styling — it never touches invoice
data, so switching templates cannot lose work.

**PDF is vector, not a screenshot.** `html2canvas`-style approaches produce a
picture of an invoice: blurry, unsearchable, megabytes, and sliced mid-row at
page breaks. react-pdf emits real text with `wrap={false}` per row and a
repeating header, so rows and images are never split.

**The CSP needs `'wasm-unsafe-eval'`.** The PDF engine compiles a WebAssembly
module. That directive permits WASM only — it does not re-enable `eval()` of
JavaScript strings. Removing it breaks PDF download in production while dev
keeps working, which is exactly how it was missed the first time.

## Testing

- **51 unit tests** — the calculation engine (negative lines, zero quantities,
  multiple taxes, inclusive extraction, rounding), PDF rendering of all 20
  templates, pagination, and Word output.
- **23 E2E tests** on desktop and mobile against a production build — the full
  create → preview → download path, PDF and Word downloads, draft survival
  across reload, template switching preserving data, and column alignment.

The PDF test asserts no POST request carries invoice data anywhere, so the
site's central privacy claim is enforced by the suite rather than by comment.

## Deployment

Set `NEXT_PUBLIC_SITE_URL` — every canonical URL, sitemap entry, OG tag and
JSON-LD block derives from it. No domain is hardcoded.

**Moving to Postgres** is a two-file change: switch `provider` in
`prisma/schema.prisma` and swap the adapter in `src/lib/db/client.ts` for
`@prisma/adapter-pg`. Nothing else imports `PrismaClient`.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical URLs, sitemap, OG tags |
| `DATABASE_URL` | Yes | SQLite locally; Postgres in production |
| `AUTH_SECRET` | Optional | Needed only for sign-in |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Optional accounts |
| `ADMIN_EMAILS` | Optional | Comma-separated admin allowlist |
| `NEXT_PUBLIC_ANALYTICS_ID` | Optional | Analytics; no-ops when unset |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Optional | Ad slots render nothing when unset |

## Content

Templates, invoice-type landing pages, guides and worked examples live in
`src/lib/content` and `src/lib/invoice/templates.ts`. They are statically
generated, and the sitemap and `llms.txt` are built from the same registries so
they cannot drift. Blog posts are the one database-backed content type, managed
at `/admin`.

Worked examples are real `Invoice` objects rendered through the production
renderer — not screenshots — so an example can never disagree with what the
tool actually produces.
