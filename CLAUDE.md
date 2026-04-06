# Vagabond Development Guide

## Build Commands
- `npm run dev`: Start development server
- `npm run build`: Production build
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Architecture
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Vanilla CSS (modularized in `src/app/` to stay <200 lines)
- **i18n**: Handled via `src/app/locales.js` and `t()` helper in `page.js`
- **Generators**: 
  - `Step1-4.js`: UI components for the generation funnel
  - `WordCloud.js`: Randomized vocabulary visualization

## API Routes
- `api/generate-topics`: (Edge) Brainstorms subtopics
- `api/generate-topic-cards`: (Edge) Generates card text, TTS, and Imagen
- `api/compile-apkg`: (Node.js) Assembles the Anki package

## Constraints
- **File size**: Keep all component/source files < 200 lines.
- **Styling**: No Tailwind. Global styles only.
