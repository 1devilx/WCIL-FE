# CurtinSphere Frontend

Next.js 16 App Router frontend for CurtinSphere, organized as a feature-based architecture.

## Stack

- Next.js 16 + React 19 + TypeScript
- TanStack Query
- Zod
- CSS Modules
- Docker

## Project structure

```
src/
  app/                 # Routes (auth + dashboard route groups)
  features/            # Feature modules (components, hooks, services, actions)
  shared/              # Shared UI, lib, providers, utils
  middleware.ts        # Auth gate / redirects
```

## Local development

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

App: http://localhost:3000  
API (backend): set `NEXT_PUBLIC_API_URL` in `.env` (default `http://localhost:8000`)

## Docker

```bash
docker compose up --build
```

Dev server runs on http://localhost:3000 with hot reload for `src/` and `public/`.
