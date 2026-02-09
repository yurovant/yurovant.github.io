# ARCHITECTURE.md

## Workspace Manifesto: Type-Safe GraphQL Monorepo

### 1. System Philosophy
This is a **Schema-First, Type-Safe Monorepo** managed by `pnpm` and **Turborepo**. The source of truth for all data structures is the GraphQL schema. Code is never manually typed if it can be generated.

---

### 2. Directory Structure
All workspaces must reside at the root. No nested `src` at the workspace level.

* **/client**: React + TypeScript frontend.
* **/server**: Node.js + Express + GraphQL Yoga backend.
* **/packages/schema**: The "Single Source of Truth."

---

### 3. Tooling & Versioning (2026 Standards)
* **Package Manager**: `pnpm` (v9+) utilizing `pnpm-workspace.yaml`.
* **Orchestrator**: `turbo` (v2+) for parallel task execution and caching.
* **TypeScript**: Strict mode enabled.
* **ESLint**: v9+ (Flat Config) with `typescript-eslint` v8+.
* **Runtime**: ESM (`"type": "module"`) across all packages.
* **Server Runner**: `tsx` for high-performance development.

---

### 4. The "Golden" Workflow
1.  **Schema Change**: All data changes start in `packages/schema/src/schema.graphql`.
2.  **Codegen**: Run `pnpm codegen` to sync TypeScript interfaces across the workspace.
3.  **Implementation**: Update resolvers in `server` and hooks in `client` using the generated types.

---

### 5. Script Definitions

| Command | Scope | Purpose |
| :--- | :--- | :--- |
| `pnpm dev` | Global | Starts server, client, and codegen-watch in parallel. |
| `pnpm build` | Global | Builds all packages in dependency order. |
| `pnpm codegen` | Schema | Generates `src/generated/graphql.ts`. |
| `pnpm lint` | Global | Runs ESLint from the root across all workspaces. |

---

### 6. Dependency Rules
* `client` and `server` must link to the schema via `"@workspace/schema": "workspace:*"`.
* No circular dependencies between `client` and `server`.
* Shared logic belongs in `/packages`.

---

> **How to use this in the future:**
> When you start a new project, simply upload/paste this text to your AI assistant and say:
> *"Initialize a new repository following the attached ARCHITECTURE.md. Use pnpm, setup the three workspaces, and ensure the turbo.json reflects the dependency between codegen and build."*
