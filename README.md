# Home Billiards

Production monorepo for the Home Billiards storefront, internal admin, NestJS backend, and shared contracts.

## Requirements

- Node.js 22 (`nvm use`)
- npm 10+

## Applications

| Workspace | Purpose | Local URL |
| --- | --- | --- |
| `apps/storefront` | Customer-facing Next.js application | `http://localhost:3000` |
| `apps/admin` | Internal Next.js administration application | `http://localhost:3001` |
| `apps/backend` | NestJS API and business rules | `http://localhost:4000/v1` |
| `packages/contracts` | Runtime schemas and shared TypeScript API types | N/A |
| `packages/config` | Shared TypeScript configuration | N/A |

The static application in `DEMO/HBSWebv2/` is a visual and UX reference only. It is not part of the production workspace.

## Local setup

```bash
nvm use
npm install
npm run dev:backend
npm run dev:storefront
npm run dev:admin
```

Run each development process in its own terminal. Copy the relevant `.env.example` file for each application; never commit real credentials.

## Quality checks

```bash
npm run check
```

This runs formatting checks, lint, type checking, tests, and production builds. Pull requests into `dev` or `main` run the same command in CI.

Project requirements and architecture live in [DOCUMENTATION.md](DOCUMENTATION.md). Open business and SEO questions live in [DECISIONS.md](DECISIONS.md).
