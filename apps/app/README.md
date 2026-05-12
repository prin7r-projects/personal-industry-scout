# `apps/app/` — Subscriber Console

Express server providing the subscriber dashboard. Deployed via
`docker-compose.yml` with Traefik routing at
`app.personal-industry-scout.prin7r.com`.

## What's live

- Template listing and detail pages (`/app/templates`)
- Benchmark catalog (`/app/benchmarks`)
- Schedule management with drag-and-drop reorder (`/app/schedule`)
- Full HTML rendering with brand styling (Source Serif 4, Inter,
  JetBrains Mono; oxblood accent)

## Stack

- Express 4.21
- `@pis/db` (Prisma client)
- `marked` for Markdown rendering
- `tsx` for running TypeScript at runtime

## Planned rebuild

The implementation plan calls for an **Open-SaaS** (Wasp) fork in Phase 2.
The current Express app serves as the temporary console until volume
justifies that migration.
