# Vagabond: Anki Card Local Generator Development Guide (v0.2.0)

## Build & Test Commands
- `npm run dev`: Start development server (Next.js 16)
- `npm run build`: Production build
- `npm run start`: Start production server
- `npx vitest run --coverage`: Execute test coverage suite (Requires minimum 80% boundaries!)
- `npm run lint`: Run ESLint

## Architecture
- **Framework**: Next.js 16+ (App Router)
- **Lazy Loading**: Native React Component splitting via `next/dynamic` to shrink the initial JS payload footprint on client interactions dynamically.
- **Testing Engine**: Vitest & React Testing Library simulating custom JSDOM DOM injection contexts.
- **Styling**: Vanilla CSS. Absolutely no Tailwind permitted securely. All styles cascade cleanly in `globals.css` using CSS custom design tokens.
- **i18n**: Translations map against `src/app/locales.js` utilizing explicit string interpolation mechanisms natively via the central `t()` helper logic.
- **Pipelines**: `useGeneratorPipeline` custom hook acts as the singular state manager orchestration pattern for all API fetching data loops, cleanly decoupling interface state management logic entirely out of the components mapping layers.

## Generator Funnel (src/components/generator/*.jsx)
- **Step1.jsx**: Language & Topic Configuration inputs (uses numeric input types, range sliders are strictly prohibited).
- **Step2.jsx**: Subtopic tagging constraint models & precise volume input boxes.
- **Step3Review.jsx**: Review and edit generation vocabulary candidates dynamically inside native HTML tables mapped to internal state instances.
- **Step4Media.jsx**: Processing and asynchronous media feedback interface uniquely mapped using Airbnb-styled continuous animated metric tracking per-word completions natively.
- **Step5Download.jsx**: Export dashboard handling telemetry stat rendering and triggering client `.apkg` local downloads directly via encoded Blob APIs natively.

## API Microservices (src/app/api)
- `generate-topics/route.js`: (Edge runtime) Brainstorms hierarchical topic/subtopic relationships utilizing OpenRouter JSON modeling endpoints natively.
- `generate-topic-cards/route.js`: (Edge runtime) Mass generates targeted vocabulary card pairs, concurrently connects to Google Cloud for accurate TTS generation strings, and interfaces identically with the explicit `google/gemini-2.5-flash-image` endpoint utilizing a very targeted prompt definition to collect contextual study images.
- `compile-apkg/route.js`: (Node.js runtime required) Aggregates buffers securely and invokes SQLite `anki-apkg-export` tooling natively, generating and pushing the `.apkg` compressed payload securely into external clients cleanly.

## Project Strict Constraints
- **File size**: Component files must legally be kept strictly < 200 lines natively.
- **Testing Gates**: A failure to deliver an 80%+ test suite coverage across modifications is unacceptable. Coverage configuration is in `vitest.config.js`.
- **Card Logic Handling**: Front of Anki Card -> Native Language. Back of Anki Card -> Target Language. Audio matches the Back of the Anki card only!

## Documentation Maintenance & Session Logs
- **Self-Updating Blueprints**: For EVERY major change implemented, you MUST automatically update this file (`CLAUDE.md`), `AGENTS.md`, and `specification.md` to perfectly reflect the new architecture, refactoring ideas, and any documented bugs discovered.
- **Session Excerpts (Pre-Push)**: Before executing ANY GitHub push, you MUST generate and save a short excerpt (summary) of the session directly into both `CLAUDE.md` and `AGENTS.md`.

### Session Excerpts
- **2026-04-14 (v0.2.0 Overhaul)**: Completely modularized Vagabond utilizing the `useGeneratorPipeline` isolated React hook. Implemented heavy lazy loading components (`next/dynamic`), updated our model engine integrations connecting Gemini 2.5 Flash for contextually mapped images, and strictly hit the >80% testing boundaries via Vitest integrations. `specification.md` was rewritten completely acting as a comprehensive Student Architectural Blueprint mapping the `.jsx` structure.
- **2026-04-14 (Bugfix)**: Fixed ReferenceError in `page.js` by properly exporting and extracting `setGeneratingProgress` from the `useGeneratorPipeline` hook.
- **2026-04-14 (Media Fix & Prompt AI)**: Resolved "Invalid Zip Archive" bug by throwing explicit internal Next.js responses. Mitigated OpenRouter rate-limiting missing constraints by implementing exponential backoff protocols. Developed dynamic prompt enhancement injecting Vagabond-themed prompt mutations structurally into the Gemini pipeline explicitly natively.
- **2026-04-14 (Cancellation & Coverage bounds)**: Integrated dynamic global cancellation triggers via AbortController within the `useGeneratorPipeline` isolated architecture gracefully preserving partial APKG data configurations natively. Advanced global mapping bounds within vitest significantly breaking >90% minimum code coverage limits dynamically over backend and frontend hooks concurrently!
