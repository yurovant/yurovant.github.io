# ARCHITECTURE.md
## Isomorphic Type-Safe GraphQL Monorepo

**Stack:** Vue 3 · Node.js · GraphQL · **Version:** 2.0 (2026)

---

## 1. System Philosophy

This is a **Schema-First, Isomorphic, Type-Safe Monorepo** managed by `pnpm` and **Turborepo**. The source of truth for all data structures is the GraphQL schema. Code is never manually typed if it can be generated. Types and runtime utilities flow in one direction only: from schema → server → client.

> **KEY** — Isomorphic means shared code runs unchanged in both Node.js (server) and the browser (client). This lives in `packages/shared` — never duplicated.

---

## 2. Directory Structure

All workspaces reside at the root. No `src/` sub-folder — source files live directly inside each workspace.

```
.
├── client/                  # Vue 3 + TypeScript frontend
│   ├── composables/         # Generated Vue composables (Apollo / TanStack)
│   ├── ...                  # Feature modules
│   └── package.json
│
├── server/                  # Node.js + Express + GraphQL Yoga backend
│   ├── resolvers/           # Consume types from @workspace/schema
│   ├── ...                  # Modules, context, plugins
│   └── package.json
│
├── packages/
│   ├── schema/              # Single Source of Truth
│   │   ├── schema.graphql           # GraphQL schema definition
│   │   ├── generated/graphql.ts     # Auto-generated — DO NOT EDIT
│   │   └── package.json
│   │
│   └── shared/              # Isomorphic runtime utilities
│       ├── validators/       # Zod schemas mirroring GraphQL input types
│       ├── formatters/       # Date, currency, string helpers
│       ├── constants/        # Enums & config shared by both sides
│       ├── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 3. Isomorphic Type Flow

Types and shared logic travel in one direction only. Nothing in `client` or `server` may be imported by `packages/schema` or `packages/shared`.

```
  packages/schema/schema.graphql
           │
           │  pnpm codegen
           ▼
  packages/schema/generated/graphql.ts   ← generated once, used everywhere
           │                          │
           │  consumed by             │  consumed by
           ▼                          ▼
       server/                    client/
       resolvers                  composables / stores
           │                          │
           └──────────┬───────────────┘
                      │  both import
                      ▼
          packages/shared/        ← isomorphic runtime code
          validators · formatters · constants
```

> **RULE** — `packages/shared` must have zero framework-specific imports. No Vue, no Express, no Node built-ins. Pure TypeScript only, so it is safe in any environment.

---

## 4. Package Responsibilities

| Package | Owns | May Import From | Must Never Import |
| :--- | :--- | :--- | :--- |
| `packages/schema` | GraphQL SDL + codegen output | *(nothing)* | `client` · `server` · `shared` |
| `packages/shared` | Validators · formatters · enums · constants | `@workspace/schema` | `client` · `server` · any framework |
| `server` | Resolvers · context · plugins · DB layer | `@workspace/schema` · `@workspace/shared` | `client` |
| `client` | Vue components · composables · stores · styles | `@workspace/schema` · `@workspace/shared` | `server` |

---

## 5. Tooling & Versioning (2026 Standards)

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| `pnpm` | v9+ | Package manager — workspace linking via `pnpm-workspace.yaml` |
| `turbo` | v2+ | Parallel task orchestration with remote caching |
| TypeScript | 5.x strict | Strict mode across all packages |
| ESLint | v9+ Flat Config | `typescript-eslint` v8+ for unified linting |
| Vite | v6+ | Client bundler and dev server (Vue plugin) |
| Vue | 3.x + Composition API | Frontend framework — Options API is disallowed |
| GraphQL Yoga | v5+ | GraphQL server (Express adapter) |
| GraphQL Codegen | v5+ | Type + composable generation from SDL |
| `tsx` | latest | High-performance ESM server runner for development |
| Zod | v3+ | Runtime validation in `packages/shared` — mirrors input types |
| Sass / SCSS | latest | Component styling (scoped) — global tokens in shared SCSS variables |

**Runtime:** ESM only — `"type": "module"` across all packages. No CommonJS.

---

## 6. Codegen Configuration

The codegen pipeline runs once and produces artifacts consumed by both sides. Client plugins must target Vue composables — not React hooks.

```ts
// codegen.ts (root)
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./packages/schema/schema.graphql",
  generates: {
    // ① Shared types — imported by both server and client
    "./packages/schema/generated/graphql.ts": {
      plugins: ["typescript"],
      config: { strictScalars: true, enumsAsConst: true },
    },

    // ② Server resolver types
    "./server/generated/resolvers.ts": {
      plugins: ["typescript-resolvers"],
      config: { contextType: "../context#AppContext" },
    },

    // ③ Vue composables (Apollo or TanStack Query)
    "./client/generated/composables.ts": {
      documents: ["./client/**/*.graphql"],
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-vue-apollo",    // or "typescript-vue-urql"
      ],
      config: { vueCompositionApiImportFrom: "vue" },
    },
  },
};

export default config;
```

---

## 7. The Golden Workflow

1. **Schema Change** — All data changes start in `packages/schema/schema.graphql`. Discuss in terms of types and operations, never in terms of REST endpoints.

2. **Shared Validation** — If the change involves user input, add or update a Zod schema in `packages/shared/validators/`. This runs on both client (instant feedback) and server (authoritative guard).

3. **Run Codegen** — Execute `pnpm codegen` to regenerate all three artifacts. Commit generated files along with the schema change.

4. **Server Implementation** — Implement or update resolvers in `server/resolvers/` using the generated `Resolvers` type.

5. **Client Implementation** — Use generated Vue composables in components. Import from `@/generated/composables`, never write manual `useQuery` calls.

6. **Type-check** — Run `pnpm typecheck` to confirm zero TypeScript errors across the entire workspace before opening a PR.

---

## 8. Turbo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "codegen": {
      "inputs":  ["packages/schema/schema.graphql", "codegen.ts"],
      "outputs": [
        "packages/schema/generated/**",
        "server/generated/**",
        "client/generated/**"
      ]
    },
    "build": {
      "dependsOn": ["^build", "codegen"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["codegen"],
      "persistent": true,
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^typecheck", "codegen"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

> **NOTE** — The `"^"` prefix means "run the same task in all dependencies first". `codegen` is always a prerequisite of `build` and `dev`, so types are never stale.

---

## 9. Script Definitions

| Command | Scope | Purpose |
| :--- | :--- | :--- |
| `pnpm dev` | Global | Runs codegen, then starts server, client, and `codegen --watch` in parallel |
| `pnpm build` | Global | Builds all packages in dependency order (`codegen` → `shared` → `server` + `client`) |
| `pnpm codegen` | Root | Generates all three artifacts from `schema.graphql` |
| `pnpm codegen:watch` | Root | Watches schema + client `.graphql` files, re-generates on change |
| `pnpm typecheck` | Global | Runs `tsc --noEmit` across all packages, always after codegen |
| `pnpm lint` | Global | Runs ESLint (Flat Config) from root across all workspaces |
| `pnpm test` | Global | Runs Vitest unit tests across `server` and `shared` |

---

## 10. Dependency Rules

Enforced by ESLint's `import/no-restricted-imports` rule and TypeScript project references.

- ✅ **Allowed:** `client` → `@workspace/schema`, `@workspace/shared`
- ✅ **Allowed:** `server` → `@workspace/schema`, `@workspace/shared`
- ❌ **Forbidden:** `client` ↔ `server` (any cross-import)
- ❌ **Forbidden:** `shared` → any framework package
- ❌ **Forbidden:** `schema` → anything

**Circular dependency prevention:** Run `pnpm dlx madge --circular .` in CI.

**Shared package scope:** Anything used by more than one workspace belongs in `packages/shared`, not duplicated.

**Peer dependencies:** Vue and any framework peer dep must never appear in `packages/shared`'s `dependencies` — only in `devDependencies` for local type-checking.

---

## 11. packages/shared — The Isomorphic Contract

This package is the bridge that makes the monorepo truly isomorphic. It must adhere to strict constraints.

### What belongs here

- **Validators** — Zod schemas that mirror GraphQL input types. Used on the client for form validation and on the server as the authoritative guard before resolver logic.
- **Formatters** — Pure functions for dates, currency, and strings. No DOM, no Node built-ins.
- **Constants & Enums** — Values generated by codegen (`enumsAsConst: true`) re-exported here for convenience, plus non-GraphQL app constants.
- **Type utilities** — Generic TypeScript helper types that neither side should redefine.

### What does NOT belong here

- Any import from `vue`, `express`, or any Node.js built-in (`fs`, `path`, etc.)
- API call logic — that belongs in `client/composables/` or `server/services/`
- Component logic, directives, or any DOM-adjacent code

```ts
// packages/shared/validators/user.ts — example
import { z } from "zod";
import type { CreateUserInput } from "@workspace/schema";

export const createUserSchema = z.object({
  name:  z.string().min(2).max(64),
  email: z.string().email(),
  role:  z.enum(["ADMIN", "MEMBER", "VIEWER"]),
}) satisfies z.ZodType<CreateUserInput>;

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
```

---

## 12. AI Initialization Prompt

When starting a new project from this document, paste the following to your AI assistant:

> Initialize a new repository following the attached ARCHITECTURE.md. Use pnpm to set up the four workspaces (`client`, `server`, `packages/schema`, `packages/shared`). No `src/` sub-folder in any workspace — source files live at the workspace root. Configure `turbo.json` so `codegen` is a prerequisite of `build` and `dev`. Scaffold `packages/shared` with a `validators/`, `formatters/`, and `constants/` folder. Configure GraphQL Codegen to generate: (1) shared types in `packages/schema/generated/graphql.ts`, (2) resolver types in `server/generated/resolvers.ts`, and (3) Vue Apollo composables in `client/generated/composables.ts`.
