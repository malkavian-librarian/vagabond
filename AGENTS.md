# Agent Execution Guide: Vagabond: Anki Card Local Generator

## Core Logic
- `src/app/page.js`: Orchestrates the sequential generation flow.
- `src/app/api/generate-topic-cards`: Parallelizes TTS and Imagen per card.

## State Management
- `step`: {1, 2, 3, 4}
- `generatingProgress`: Tracks subtopic status (pending, active, done).

## Critical Rules for Agents
- **NO TAILWIND**: Only `src/app/*.css`.
- **< 200 LINES**: Refactor if any file exceeds this.
- **Node.js runtime**: `api/compile-apkg` MUST use this for `anki-apkg-export`.
- **Edge runtime**: `api/generate-*` MUST use this for LLM calls.

## Fixed Bugs (since v0.1.0)
- Messages array in LLM call fixed in `generate-topics`.
- Variable scoping fixed in `generate-topic-cards`.
- Duplicate keys/assignments fixed in `generate-topic-cards`.
- Invalid HTML fixed in `page.js`.
- Navigator property fixed in `page.js`.
