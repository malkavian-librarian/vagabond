# Agent Execution Guide: Vagabond: Anki Card Local Generator v0.2.0

## Core Philosophy
Vagabond is an AI-powered Anki deck generator built on bleeding-edge Next.js patterns. Ensure your code modifications reflect optimal UX dynamics, high security bounds, and test-driven deployment constraints.

## Core Logic & Architecture
- `src/app/page.js`: The root server-side container orchestration. Heavily utilizes Next.js App router dynamics. All heavy UI bundles are split using `next/dynamic` to lazy-load elements.
- `src/hooks/useGeneratorPipeline.js`: The central state orchestration map. Extracts heavy API dispatchers and state transformations fully out of the presentation layer. Use this for all new data fetching features!
- `src/app/api/generate-topic-cards`: Parallelizes TTS per card but intercepts images specifically through `google/gemini-2.5-flash-image` with localized mapping techniques.
- `src/components/**/*.jsx`: UI files strictly abide by the `.jsx` extension to satisfy Vite/JSDOM parsing natively without complex babel pipelines.

## State Management
- `step`: {1, 2, 3, 4, 5} -> Steps through Configuration, Selection, Review, Media Compilation, and Downloading.
- `generatingProgress`: Tracks generation progress granularly across specific word-by-word metric loads.

## Critical Rules for Agents
- **NO TAILWIND**: Only pure vanilla CSS in `src/app/globals.css`.
- **< 200 LINES**: Immediately extract state into a custom hook or component if any file exceeds this cap without exception.
- **Node.js runtime**: `api/compile-apkg` MUST use this for the SQLite `anki-apkg-export` logic. Wait until Edge compute logic supports native buffer operations natively before ever modifying this route.
- **Edge runtime**: `api/generate-*` APIs MUST use this for LLM calls to reduce serverless spinup latency.
- **Anki Card Layout**: Front card MUST be Native Language. Back card MUST be Target Language (with Context Image & Audio).
- **TTS Generator**: Audio MUST ONLY be generated for the Target Language using Google Cloud Text-to-Speech API.
- **Imagen Generator**: Always use the Gemini 2.5 Flash (`google/gemini-2.5-flash-image`) to request `"You are asked to generate an image for an ANKI card to learn [TARGET_LANGUAGE]. Generate an image for [WORD] in the following context: [SUBTOPIC] - [QUERY]"` via OpenRouter.
- **Data Persistence**: Always ignore DB/history runtime files (`data/*.json`). Manage lightweight global settings loosely via `localStorage` on the frontend DOM natively.

## Testing Rules & Standards (VITEST Mandatory)
- **Minimum 80% Coverage**: Run `npx vitest run --coverage` locally before generating pull requests. The test suite configuration strictly enforces coverage algorithms against application components natively.
- **Vitest Mocking**: Stub native browser APIs via UI integration suites or mock `fetch()` responses utilizing `@testing-library/react`.
- **Pre-check Pipeline**: Ensure you verify branch metrics prior to merging modifications. Test suites failing below 80% signify incomplete deployment endpoints.

## Security & Refactoring Audits
Review the application often and evaluate frontend best practices (e.g., dynamic splitting, memory footprint analysis) to keep Vagabond blazing fast structurally. Validate leakages continuously and secure unauthenticated API integrations!

## Documentation Maintenance & Session Logs
- **Self-Updating Blueprints**: For EVERY major change implemented, you MUST automatically update this file (`AGENTS.md`), `CLAUDE.md`, and `specification.md` to perfectly reflect the new architecture, refactoring ideas, and any documented bugs discovered.
- **Session Excerpts (Pre-Push)**: Before executing ANY GitHub push, you MUST generate and save a short excerpt (summary) of the session directly into both `CLAUDE.md` and `AGENTS.md`.

### Session Excerpts
- **2026-04-14 (v0.2.0 Overhaul)**: Completely modularized Vagabond utilizing the `useGeneratorPipeline` isolated React hook. Implemented heavy lazy loading components (`next/dynamic`), updated our model engine integrations connecting Gemini 2.5 Flash for contextually mapped images, and strictly hit the >80% testing boundaries via Vitest integrations. `specification.md` was rewritten completely acting as a comprehensive Student Architectural Blueprint mapping the `.jsx` structure.
- **2026-04-14 (Bugfix)**: Fixed ReferenceError in `page.js` by properly exporting and extracting `setGeneratingProgress` from the `useGeneratorPipeline` hook.
- **2026-04-14 (Media Fix & Prompt AI)**: Resolved "Invalid Zip Archive" bug by throwing explicit internal Next.js responses. Mitigated OpenRouter rate-limiting missing constraints by implementing exponential backoff protocols. Developed dynamic prompt enhancement injecting Vagabond-themed prompt mutations structurally into the Gemini pipeline explicitly natively.
- **2026-04-14 (Cancellation & Coverage bounds)**: Integrated dynamic global cancellation triggers via AbortController within the `useGeneratorPipeline` isolated architecture gracefully preserving partial APKG data configurations natively. Advanced global mapping bounds within vitest significantly breaking >90% minimum code coverage limits dynamically over backend and frontend hooks concurrently!
