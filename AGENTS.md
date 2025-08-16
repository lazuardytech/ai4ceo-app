# Repository Guidelines

## Project Structure & Module Organization
- `app/(chat)`: Chat UI, layout, and API routes (e.g., `/api/chat`, `/api/document`, `/api/vote`).
- `app/(auth)`: NextAuth config, login/register pages, auth routes (incl. guest).
- `components/`: UI components (chat, messages, artifact panel, inputs, `ui/*`).
- `artifacts/`: Document handlers for `text`, `code`, `image`, `sheet` (server/client).
- `lib/`: AI models/providers/prompts (`lib/ai`), DB schema/queries/migrations (`lib/db`), types/utils.
- `tests/`: Playwright tests (`e2e/*`, `routes/*`), fixtures and helpers.

## Build, Test, and Development Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Run Next.js dev server (uses `.env.local`).
- `pnpm build`: Run DB migrations then build (`tsx lib/db/migrate && next build`).
- `pnpm start`: Start production server.
- `pnpm test`: Run Playwright e2e and route tests.
- Database: `pnpm db:migrate`, `pnpm db:generate`, `pnpm db:studio`.

Example local flow:
```
cp .env.example .env.local
pnpm install
pnpm db:migrate
pnpm dev
```

## Coding Style & Naming Conventions
- Language: TypeScript + React (App Router, RSC where applicable).
- Lint/format: ESLint + Biome. Run `pnpm lint` and `pnpm format` before pushing.
- Files: kebab-case (`components/chat-header.tsx`); components/functions in PascalCase/camelCase.
- Keep changes focused; avoid unrelated refactors. Prefer small, typed interfaces (e.g., `ChatMessage`).

## Testing Guidelines
- Framework: Playwright. Tests live under `tests/e2e` and `tests/routes`; files end with `.test.ts`.
- Run: `pnpm test` or target a file via `pnpm exec playwright test tests/routes/chat.test.ts`.
- Tests boot the dev server at `/ping`. Models are mocked when `PLAYWRIGHT` is set.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (`feat:`, `fix:`, `chore:`). One logical change per commit.
- PRs must include: summary, scope (paths touched), test plan (commands + expected result), screenshots for UI, and linked issue.
- Ensure `pnpm lint`, `pnpm format`, and `pnpm test` pass.

## Security & Configuration Tips
- Use `.env.local`; never commit secrets. Required vars: `AUTH_SECRET`, `POSTGRES_URL`, `XAI_API_KEY`; optional `REDIS_URL` enables resumable streams.
- Cloudflare R2: set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and optionally `R2_PUBLIC_BASE_URL` for public URLs.
- Migrations: use Drizzle (`pnpm db:generate`), commit generated SQL under `lib/db/migrations`.
