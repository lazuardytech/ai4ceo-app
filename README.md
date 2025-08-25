<div>
  <img alt="CodeQL Analysis" src="https://github.com/lazuardytech/landing/actions/workflows/github-code-scanning/codeql/badge.svg" />
  <img alt="Vercel" src="https://deploy-badge.vercel.app?url=https://lazuardy.tech&logo=vercel&name=vercel" />
</div>

## AI4CEO App

This is a repository for the AI4CEO chatbot app. Built using [Next](https://nextjs.org/).

> This project is **NOT** licensed and all rights are reserved. <br/>
> You are not allowed to use this project for commercial purposes.

> © AI4CEO 2025. All rights reserved. <br/>
> PT Lazuardy Innovation Group. <br/> [Terms of Service](https://www.lazuardy.group/terms) | [Privacy Policy](https://www.lazuardy.group/privacy)

## Curated News

The app can fetch Indonesian news via RSS, store them, and generate:
- news resume
- news timeline
- fact check
- related news
- news category

How to run:
- Migrate DB: `bun run db:generate && bun run db:migrate`
- One-off fetch+curate: `bun run news:curate`
- HTTP cron endpoint: `GET /api/cron/curate-news` (or `POST` with optional `CRON_TOKEN` header)

Feeds and logic:
- Feeds list defined in `lib/news/curator.ts`
- Curator uses the configured AI provider (see `lib/ai/providers.ts`); set env keys accordingly.

UI:
- Visit `/news` to see the latest curated items.

Admin:
- Manage feed toggles at `/admin/news/feeds` (add/activate/deactivate/remove RSS sources).

Vercel Cron:
- `vercel.json` contains a cron that calls `/api/cron/curate-news` every 8 hours (≈3x/day).

Rate limit and curation controls (env):
- `NEWS_STOP_ON_RATE_LIMIT` (default: true) — stop current run when rate limit is detected.
- `NEWS_RATE_LIMIT_COOLDOWN_MINUTES` (default: 60) — pause further runs; stored in Setting key `newsCurationPauseUntil`.
- `NEWS_MAX_CURATE_PER_RUN` (default: 30) — cap curated items per run to reduce token usage.
