# Technical Specification: Vagabond
**Version:** 0.1.0 | **Status:** Production-ready | **Last Updated:** 2026-04-06

> This document is a complete, build-from-scratch blueprint for **Vagabond** — an AI-powered immersive Anki deck generator for language learners. Every component, API route, data structure, CSS rule, and external integration is documented in full detail so the application can be reconstructed without reference to the original source code.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Directory Structure](#3-directory-structure)
4. [Environment Variables](#4-environment-variables)
5. [Configuration Files](#5-configuration-files)
6. [Design System & CSS](#6-design-system--css)
7. [Application Architecture](#7-application-architecture)
8. [Component Reference](#8-component-reference)
9. [API Routes](#9-api-routes)
10. [Internationalization (i18n)](#10-internationalization-i18n)
11. [Status Rotator Messages](#11-status-rotator-messages)
12. [Data Flow: Full Generation Lifecycle](#12-data-flow-full-generation-lifecycle)
13. [External API Integrations](#13-external-api-integrations)
14. [Anki .apkg Format](#14-anki-apkg-format)
15. [Coding Conventions & Constraints](#15-coding-conventions--constraints)
16. [Development Setup](#16-development-setup)
17. [Known Bugs in v0.1.0](#17-known-bugs-in-v010)

---

## 1. Project Overview

**Vagabond** is a Next.js web application that generates Anki flashcard decks enriched with:
- **AI-generated vocabulary pairs** (target word + native translation) via an LLM
- **Native-language audio** (MP3) via Google Cloud Text-to-Speech
- **Contextual images** (JPEG) via Google Gemini Imagen

The user specifies a native language, a target language, and a topic (e.g., "Coffee Shop"). The app discovers subtopics via LLM, the user selects which to include, and the app generates a fully-packaged `.apkg` file ready for import into the Anki desktop app.

**User flow:** Step 1 (language + topic input) → Step 2 (subtopic selection + card density) → Step 3 (live generation progress) → Step 4 (download + Anki import guide).

---

## 2. Tech Stack & Dependencies

### Runtime
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| UI Library | React 19.2.4 + ReactDOM 19.2.4 |
| Language | JavaScript (ES2022+) |
| Styling | Vanilla CSS (no Tailwind) |
| Font | Inter (Google Fonts, `next/font/google`) |

### Production Dependencies (`package.json`)
```json
{
  "anki-apkg-export": "^4.0.3",
  "lucide-react": "^1.7.0",
  "next": "16.2.2",
  "openai": "^6.33.0",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "uuid": "^13.0.0"
}
```

**Key dependency notes:**
- `anki-apkg-export` — Node.js-only library that creates `.apkg` ZIP files (SQLite + media). Must run in Node.js runtime, not Edge.
- `openai` — Used as an OpenRouter-compatible client by overriding `baseURL`. Not the official Anthropic SDK.
- `lucide-react` — Icon library (imported but not used in core flow in v0.1.0).
- `uuid` — Imported but not visibly used in v0.1.0 core flow.

### Dev Dependencies
```json
{
  "eslint": "^9",
  "eslint-config-next": "16.2.2"
}
```

---

## 3. Directory Structure

```
ankiCardBuilder/
├── src/
│   ├── app/
│   │   ├── page.js                           # Root client component — state orchestrator
│   │   ├── layout.js                         # Root HTML layout, Inter font, metadata
│   │   ├── globals.css                       # All application styles (377 lines)
│   │   ├── locales.js                        # i18n translation dictionary (8+ languages)
│   │   └── api/
│   │       ├── generate-topics/
│   │       │   └── route.js                  # POST /api/generate-topics (Edge runtime)
│   │       ├── generate-topic-cards/
│   │       │   └── route.js                  # POST /api/generate-topic-cards (Edge runtime)
│   │       └── compile-apkg/
│   │           └── route.js                  # POST /api/compile-apkg (Node.js runtime)
│   └── components/
│       ├── layout/
│       │   └── Navbar.js                     # Sticky header — "Vagabond" logo only
│       ├── generator/
│       │   ├── Step1.js                      # Language selects + topic input + subtopic count slider
│       │   ├── Step2.js                      # Subtopic tag selector + words-per-subtopic slider
│       │   ├── Step3.js                      # Live progress display + funny status rotator
│       │   ├── Step4.js                      # Stats summary + download button + import guide
│       │   └── statuses.js                   # Funny rotating messages (12 languages, 20 each)
│       └── ui/
│           └── WordCloud.js                  # Randomized vocabulary word display
├── package.json
├── jsconfig.json                             # Path alias: @/* → ./src/*
├── next.config.mjs                           # serverExternalPackages config
├── CLAUDE.md                                 # Development execution guide
├── AGENTS.md                                 # Agent execution guide
└── specification.md                          # This file
```

---

## 4. Environment Variables

File: `.env.local` (never committed to git)

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | **Yes** | LLM access via OpenRouter for topic + card text generation |
| `GOOGLE_TTS_API_KEY` | **Yes** | Google Cloud Text-to-Speech API for MP3 audio generation |
| `GEMINI_API_KEY` | **Yes** | Google Gemini Imagen API for contextual image generation |
| `UNSPLASH_ACCESS_KEY` | No | Fallback image source if Gemini is unavailable |

**Checking in API routes:** All routes check for their required key and return `{ error: "...", status: 500 }` if missing.

---

## 5. Configuration Files

### `next.config.mjs`
```js
const nextConfig = {
  serverExternalPackages: ['anki-apkg-export'],
};
export default nextConfig;
```
The `serverExternalPackages` directive prevents Next.js from bundling `anki-apkg-export` into the Edge runtime. It must remain a Node.js-side package because it uses native `Buffer` and SQLite operations.

### `jsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
Enables `@/app/locales`, `@/components/generator/Step1`, etc. as import aliases.

### `src/app/layout.js`
```js
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vagabond",
  description: "AI Powered Immersive Anki Deck Generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

## 6. Design System & CSS

All styles live in `src/app/globals.css` (377 lines). No Tailwind. No CSS modules. No scoped styles.

### 6.1 CSS Custom Properties (Design Tokens)
```css
:root {
  --brand-cyan:         #00E5FF;   /* Accent highlight */
  --brand-teal:         #00B8D4;   /* Primary action color */
  --brand-blue:         #2979FF;   /* Gradient endpoint */
  --brand-deep:         #102A43;   /* Dark navy — headings */
  --brand-white:        #ffffff;
  --brand-bg:           #f8fafc;   /* Page background */
  --brand-text:         #0f172a;   /* Body text */
  --brand-muted:        #64748b;   /* Subtitles, placeholders */
  --brand-border:       #e2e8f0;   /* Input/card borders */
  --brand-primary:      var(--brand-teal);
  --brand-primary-hover: var(--brand-blue);
  --brand-focus:        rgba(0, 184, 212, 0.2);  /* Input focus ring */
}
```

### 6.2 Body / Global Reset
```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--brand-bg);
  background-image:
    radial-gradient(at 0% 0%,   rgba(0, 229, 255, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(41, 121, 255, 0.05) 0px, transparent 50%);
  color: var(--brand-text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 6.3 Layout Classes
| Class | Description |
|---|---|
| `.brand-layout` | Root flex column, `min-height: 100vh` |
| `.container` | Centered content area, `max-width: 680px`, `margin: 2rem auto`, `padding: 0 1.5rem` |

### 6.4 Navbar
```css
.brand-navbar {
  height: 72px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--brand-border);
  display: flex; justify-content: center; align-items: center;
  padding: 0 5%;
  position: sticky; top: 0; z-index: 50;
}

.brand-logo {
  font-size: 1.5rem; font-weight: 800;
  background: linear-gradient(135deg, var(--brand-teal), var(--brand-blue));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.03em;
}
```

### 6.5 Main Card (Glassmorphism)
```css
.brand-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 3rem;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.05),
    0 10px 15px -3px rgb(0 0 0 / 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}
```

### 6.6 Typography
| Selector | Size | Weight | Notes |
|---|---|---|---|
| `h1` | `3rem` | 900 | `letter-spacing: -0.04em`, `line-height: 1`, color `--brand-deep` |
| `h2` | `1.75rem` | 700 | `letter-spacing: -0.02em` |
| `h3` | `1.25rem` | 700 | |
| `p.subtitle` | `1.125rem` | normal | color `--brand-muted`, `line-height: 1.6` |
| `label` | `0.875rem` | 700 | `text-transform: uppercase`, `letter-spacing: 0.05em` |

Mobile override (`max-width: 640px`): `h1` reduces to `2.25rem`.

### 6.7 Form Elements
```css
/* Text input + select */
input[type="text"], select {
  width: 100%; padding: 1rem 1.25rem;
  background: var(--brand-white);
  border: 2px solid var(--brand-border);
  border-radius: 12px;
  font-size: 1rem; font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
input[type="text"]:focus, select:focus {
  border-color: var(--brand-teal);
  box-shadow: 0 0 0 4px var(--brand-focus);
}

/* Select arrow: custom SVG chevron in --brand-teal, background-position: right 1.25rem center */

/* Range slider */
input[type="range"] {
  width: 100%; height: 6px;
  background: var(--brand-border); border-radius: 3px;
}
input[type="range"]::-webkit-slider-thumb {
  width: 20px; height: 20px;
  background: var(--brand-teal);
  border: 4px solid var(--brand-white);
  border-radius: 50%;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: all 0.2s ease;
}
input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1); background: var(--brand-blue);
}
```

### 6.8 Buttons
```css
.brand-btn {
  padding: 1rem 2rem; font-weight: 700; font-size: 1rem;
  border-radius: 12px; border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  margin-top: 1rem;
}
.brand-btn:active:not(:disabled) { transform: scale(0.97); }
.brand-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }

.btn-primary {
  background: linear-gradient(135deg, var(--brand-teal), var(--brand-blue));
  color: var(--brand-white); width: 100%;
  box-shadow: 0 4px 6px -1px rgba(41, 121, 255, 0.2);
}
.btn-primary:hover:not(:disabled) {
  box-shadow: 0 20px 25px -5px rgba(41, 121, 255, 0.3);
  transform: translateY(-2px);
}

.btn-ghost {
  background: transparent; color: var(--brand-muted);
  font-size: 0.9rem; padding: 0.5rem 1rem;
}
.btn-ghost:hover { color: var(--brand-teal); background: rgba(0, 184, 212, 0.05); }
```

### 6.9 Subtopic Tags
```css
.flex-wrap {
  display: flex; flex-wrap: wrap; gap: 0.75rem;
  margin-bottom: 2.5rem; justify-content: center;
}
.topic-tag {
  padding: 10px 20px;
  background: var(--brand-white); color: var(--brand-text);
  border: 1px solid var(--brand-border); border-radius: 9999px;
  cursor: pointer; font-size: 0.95rem; font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.topic-tag:hover { transform: translateY(-2px); border-color: var(--brand-teal); }
.topic-tag.selected {
  background: linear-gradient(135deg, var(--brand-teal), var(--brand-blue));
  color: var(--brand-white); border-color: transparent;
  box-shadow: 0 10px 15px -3px rgba(41, 121, 255, 0.3);
}
```

### 6.10 Word Cloud
```css
.word-cloud-container {
  display: flex; flex-wrap: wrap; gap: 1.5rem;
  justify-content: center; margin: 2.5rem 0;
}
.cloud-item {
  position: relative; display: flex; flex-direction: column;
  align-items: center; gap: 0.5rem;
}
```
Individual word styling is applied inline by `WordCloud.js` (randomized per render — see §8.6).

### 6.11 Progress Loader (Step 3)
```css
.loader-container {
  display: flex; flex-direction: column; gap: 1.5rem;
  margin: 2rem 0; padding: 1.5rem;
  background: rgba(255, 255, 255, 0.5); border-radius: 20px;
}
.spinner-ring {
  width: 24px; height: 24px;
  border: 3px solid rgba(0, 184, 212, 0.1);
  border-top: 3px solid var(--brand-teal);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
```

### 6.12 Summary Box (Step 4)
```css
.summary-box {
  background: var(--brand-white);
  border: 1px solid var(--brand-border);
  border-radius: 20px; padding: 2rem; margin: 2rem 0; text-align: left;
}
```

### 6.13 Modal (unused in v0.1.0 but defined)
```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; animation: fadeIn 0.3s ease-out;
}
.modal-content {
  background: var(--brand-white); padding: 3rem; border-radius: 24px;
  width: 90%; max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 7. Application Architecture

### 7.1 Rendering Model
- `src/app/layout.js` — Server Component (root layout)
- `src/app/page.js` — **Client Component** (`"use client"`) — all state lives here
- All `Step*.js` components — Client Components
- All API routes — Server-side only (no client bundle)

### 7.2 State Architecture (`page.js`)

All application state is managed in `page.js` and passed down as props.

```js
// Navigation
const [step, setStep] = useState(1);            // 1 | 2 | 3 | 4

// API loading / errors
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

// User form inputs
const [formData, setFormData] = useState({
  nativeLanguage: "English",    // from EUROPEAN_LANGUAGES[]
  targetLanguage: "Spanish",    // from EUROPEAN_LANGUAGES[]
  topic: "",                    // free text, e.g. "Coffee Shop"
  subtopicCount: 5,             // int, range 3–10
  wordsPerSubtopic: 15,         // int, range 10–50, step 5
});

// Subtopic flow
const [availableSubtopics, setAvailableSubtopics] = useState([]);  // string[]
const [selectedSubtopics, setSelectedSubtopics] = useState([]);    // string[]

// Generation tracking
const [generationStats, setGenerationStats] = useState({
  cards: 0, audio: 0, images: 0, tokens: 0
});
const [generatingProgress, setGeneratingProgress] = useState([]);
// Each item: { topic: string, status: "pending"|"active"|"done", generatedCards?: Card[] }

// Download
const [downloadUrl, setDownloadUrl] = useState(null);  // ObjectURL string
```

### 7.3 Language Auto-Detection
Runs once on mount via `useEffect`:
```js
useEffect(() => {
  if (typeof window !== 'undefined') {
    const navLang = (navigator.language || navigator.userLanguage).split('-')[0];
    const langMap = {
      'en':'English','es':'Spanish','fr':'French','de':'German',
      'it':'Italian','pt':'Portuguese','ru':'Russian','uk':'Ukrainian',
      'pl':'Polish','nl':'Dutch','el':'Greek','bg':'Bulgarian',
      'cs':'Czech','da':'Danish','fi':'Finnish','hu':'Hungarian',
      'ro':'Romanian','sk':'Slovak','sv':'Swedish','ca':'Catalan',
      'hr':'Croatian','et':'Estonian','ga':'Irish','is':'Icelandic',
      'lv':'Latvian','lt':'Lithuanian','mk':'Macedonian','mt':'Maltese',
      'sr':'Serbian','sl':'Slovenian','sq':'Albanian','be':'Belarusian',
      'bs':'Bosnian','gl':'Galician','cy':'Welsh'
    };
    const detected = langMap[navLang];
    if (detected) setFormData(prev => ({ ...prev, nativeLanguage: detected }));
  }
}, []);
```

### 7.4 Translation Helper
```js
const t = (key, params = {}) => {
  const lang = formData.nativeLanguage || "English";
  const dict = TRANSLATIONS[lang] || TRANSLATIONS["English"];
  let str = dict[key] || TRANSLATIONS["English"][key] || key;
  Object.keys(params).forEach(p => { str = str.replace(`{${p}}`, params[p]); });
  return str;
};
```
Usage: `t("btn_generate", { count: 75 })` → `"Generate 75 Cards"`

### 7.5 Supported Languages List
```js
const EUROPEAN_LANGUAGES = [
  "Albanian","Basque","Belarusian","Bosnian","Bulgarian","Catalan",
  "Croatian","Czech","Danish","Dutch","English","Estonian","Finnish",
  "French","Galician","German","Greek","Hungarian","Icelandic","Irish",
  "Italian","Latvian","Lithuanian","Macedonian","Maltese","Norwegian",
  "Polish","Portuguese","Romanian","Russian","Scottish Gaelic","Serbian",
  "Slovak","Slovenian","Spanish","Swedish","Ukrainian","Welsh"
];  // 38 entries
```

---

## 8. Component Reference

### 8.1 `Navbar.js`
**Path:** `src/components/layout/Navbar.js`
**Props:** `{ t }` (translation function — currently unused in render)
**Renders:**
```jsx
<header className="brand-navbar">
  <div className="brand-logo">Vagabond</div>
</header>
```

---

### 8.2 `Step1.js`
**Path:** `src/components/generator/Step1.js`
**Props:**
```
formData          — full formData object
setFormData       — state setter
handleGenerateTopics — form onSubmit handler (async, calls /api/generate-topics)
loading           — boolean, disables submit button
t                 — translation function
EUROPEAN_LANGUAGES — string[] for both dropdowns
```
**Renders:** `<form onSubmit={handleGenerateTopics}>`
- Native language `<select>` — maps `EUROPEAN_LANGUAGES` to `<option>` elements
- Target language `<select>` — same list
- Topic `<input type="text">` — sets `formData.topic`
- Subtopic count `<input type="range" min="3" max="10" step="1">` — sets `formData.subtopicCount`
- Submit `<button className="brand-btn btn-primary">` — disabled when `loading` is true; text switches between `t("btn_discover")` and `t("btn_discovering")`

---

### 8.3 `Step2.js`
**Path:** `src/components/generator/Step2.js`
**Props:**
```
formData          — full formData object
availableSubtopics — string[] from API response
selectedSubtopics  — string[] of currently selected
toggleSubtopic    — (subtopic: string) => void
handleGenerateDeck — () => void — triggers generation
setFormData       — state setter
t                 — translation function
```
**Renders:**
- `h3` with `t("step2_title")`
- `p.subtitle` with `t("step2_desc", { topic: formData.topic })`
- `.flex-wrap` containing one `.topic-tag` per available subtopic. Tags receive `.selected` class if in `selectedSubtopics`. Click calls `toggleSubtopic(subtopic)`.
- Words-per-subtopic `<input type="range" min="10" max="50" step="5">` — sets `formData.wordsPerSubtopic`
- Generate `<button className="brand-btn btn-primary">` — disabled if `selectedSubtopics.length === 0`. Text: `t("btn_generate", { count: selectedSubtopics.length * formData.wordsPerSubtopic })`

---

### 8.4 `Step3.js`
**Path:** `src/components/generator/Step3.js`
**Props:**
```
generatingProgress  — ProgressItem[] (topic, status, generatedCards?)
setStep             — step setter
setGeneratingProgress — progress setter
t                   — translation function
nativeLanguage      — string — used to pick status message language
```

**ProgressItem type:**
```ts
{
  topic: string;
  status: "pending" | "active" | "done";
  generatedCards?: Card[];
}
```

**Status rotator logic:**
```js
useEffect(() => {
  const list = STATUSES[nativeLanguage] || STATUSES["English"];
  let idx = 0;
  setFunnyStatus(list[0]);
  const interval = setInterval(() => {
    idx = (idx + 1) % list.length;
    setFunnyStatus(list[idx]);
  }, 4000);
  return () => clearInterval(interval);
}, []);
```

**Per-item rendering:**
- `status === "pending"` → `.status-circle` (gray empty circle)
- `status === "active"` → `.spinner-ring` (CSS spin animation)
- `status === "done"` → `.status-done` containing `✓` checkmark
- Once `status === "done"` and `generatedCards` is populated, renders `<WordCloud words={generatedCards} />`

**Cancel button:** `btn-ghost` — calls `setStep(1)` and `setGeneratingProgress([])`

---

### 8.5 `Step4.js`
**Path:** `src/components/generator/Step4.js`
**Props:**
```
generationStats  — { cards, audio, images, tokens }
downloadUrl      — string (blob URL) or null
formData         — full formData object (uses .topic for filename)
setStep          — step setter
setDownloadUrl   — URL setter
t                — translation function
```
**Renders:**
- `h2` with `t("step4_title")` ("Deck Generated!")
- `p.subtitle` with `t("step4_desc")`
- `.summary-box` — 4 stat rows (cards, audio, images, tokens)
- If `downloadUrl`: `<a href={downloadUrl} download="Vagabond-{topic}.apkg">` wrapping a `.btn-primary` button
- If `downloadUrl`: `.summary-box` with Anki import guide (3 localized steps)
- Restart button (`.btn-ghost`) — calls `setStep(1)` and `setDownloadUrl(null)`

---

### 8.6 `WordCloud.js`
**Path:** `src/components/ui/WordCloud.js`
**Props:** `{ words: Card[] }` (uses `.target` field)
**Returns `null` if `words` is empty.**

Per-word rendering (inline styles, randomized on each render):
```js
const fontSize  = 0.8 + Math.random() * 0.5;   // 0.80–1.30rem
const opacity   = 0.6 + Math.random() * 0.4;   // 0.60–1.00
const rotate    = (Math.random() - 0.5) * 15;  // -7.5 to +7.5 deg
```
Inline styles per `<span className="cloud-item">`:
- `fontSize`, `opacity`, `transform: rotate({n}deg)`
- `padding: 4px 8px`, `background: rgba(255,255,255,0.4)`, `borderRadius: 8px`
- `fontWeight: 600`, `color: var(--brand-teal)`
- `border: 1px solid rgba(0, 184, 212, 0.2)`

---

## 9. API Routes

### 9.1 `POST /api/generate-topics`

**File:** `src/app/api/generate-topics/route.js`
**Runtime:** `export const runtime = "edge"`
**Client:** OpenAI SDK with OpenRouter base URL
**Model:** `qwen/qwen-2.5-72b-instruct`

**Request body:**
```json
{
  "nativeLanguage": "English",
  "targetLanguage": "Spanish",
  "topic": "Coffee Shop",
  "subtopicCount": 5
}
```

**Validation:**
- Returns `{ error: "Missing required fields" }` + 400 if `topic`, `nativeLanguage`, or `targetLanguage` are missing
- Returns `{ error: "OPENROUTER_API_KEY is not set..." }` + 500 if key is absent

**OpenAI client configuration:**
```js
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-OpenRouter-Title": "Vagabond AI",
  },
});
```

**Prompt (exact):**
```
You are a language teacher formulating a curriculum. The learner speaks {nativeLanguage} natively and is learning {targetLanguage}.
Topic: "{topic}".
Output a JSON object containing an array of exactly {subtopicCount || 10} subtopics related to this topic.
The subtopics should be in {nativeLanguage} and describe specific areas of vocabulary (e.g., "Engine Parts", "Riding Gear").

Format exactly:
{
  "subtopics": ["subtopic 1", "subtopic 2", "etc..."]
}
```

**API call:**
```js
const completion = await openai.chat.completions.create({
  model: "qwen/qwen-2.5-72b-instruct",
  response_format: { type: "json_object" },
  // NOTE: messages array is MISSING in v0.1.0 — this is a bug (see §17)
});
```

**Success response:**
```json
{ "subtopics": ["string", "string", ...] }
```

---

### 9.2 `POST /api/generate-topic-cards`

**File:** `src/app/api/generate-topic-cards/route.js`
**Runtime:** `export const runtime = "edge"`
**Model:** `qwen/qwen-2.5-72b-instruct` (via OpenRouter)

**Request body:**
```json
{
  "topic": "Coffee Shop",
  "subtopic": "Coffee Equipment",
  "nativeLanguage": "English",
  "targetLanguage": "Spanish",
  "count": 15,
  "previouslyGeneratedWords": ["café", "espresso"]
}
```

**Validation:** Returns 400 if `subtopic`, `nativeLanguage`, `targetLanguage`, or `count` are missing.

#### Phase 1 — Text Generation

**Deduplication exclusion rule (injected into prompt if previouslyGeneratedWords.length > 0):**
```
CRITICAL: DO NOT duplicate any of the following vocabulary items: {word1}, {word2}, ...
```

**Full prompt:**
```
You are a curriculum creator. Topic: "{topic}", Subtopic: "{subtopic}".
Generate {count} completely unique vocabulary words or phrases in {targetLanguage} with their {nativeLanguage} translation.{exclusionRule}
Also provide a short English search term to find a relevant stock photo for each.
Format exactly returning JSON:
{
  "cards": [
    {
      "target": "...",
      "native": "...",
      "imageSearchNode": "..."
    }
  ]
}
```

**API call:**
```js
const textCompletion = await openai.chat.completions.create({
  model: "qwen/qwen-2.5-72b-instruct",
  messages: [{ role: "user", content: prompt }],
  response_format: { type: "json_object" },
});
```

**JSON parsing (with markdown fence stripping):**
```js
const cleanedContent = completionContent
  .replace(/^```json/g, "")
  .replace(/```$/g, "")
  .trim();
const parsedData = JSON.parse(cleanedContent);
```

**Card schema:**
```ts
type Card = {
  target: string;          // Word in target language
  native: string;          // Translation in native language
  imageSearchNode: string; // English keyword for image search
  audioBase64?: string;    // MP3 audio as base64 string
  imageBase64?: string;    // JPEG image as base64 string (Gemini)
  imageUrl?: string;       // HTTPS URL for image (Unsplash fallback)
}
```

#### Phase 2 — Audio + Image Enrichment (Parallel)

All cards are processed concurrently via `Promise.all(cards.map(async (card) => { ... }))`.

**Audio — Google Cloud TTS:**
```
Endpoint: https://texttospeech.googleapis.com/v1/text:synthesize?key={GOOGLE_TTS_API_KEY}
Method: POST
Headers: Content-Type: application/json
Body:
{
  "input": { "text": "{card.target}" },
  "voice": { "languageCode": "{targetCode}" },
  "audioConfig": { "audioEncoding": "MP3" }
}
Response field: ttsData.audioContent (base64 MP3)
```

**Language code mapping (38 entries):**
```
Albanian→sq-AL, Basque→eu-ES, Belarusian→be-BY, Bosnian→bs-BA,
Bulgarian→bg-BG, Catalan→ca-ES, Croatian→hr-HR, Czech→cs-CZ,
Danish→da-DK, Dutch→nl-NL, English→en-US, Estonian→et-EE,
Finnish→fi-FI, French→fr-FR, Galician→gl-ES, German→de-DE,
Greek→el-GR, Hungarian→hu-HU, Icelandic→is-IS, Irish→ga-IE,
Italian→it-IT, Latvian→lv-LV, Lithuanian→lt-LT, Macedonian→mk-MK,
Maltese→mt-MT, Norwegian→nb-NO, Polish→pl-PL, Portuguese→pt-PT,
Romanian→ro-RO, Russian→ru-RU, Scottish Gaelic→gd-GB, Serbian→sr-RS,
Slovak→sk-SK, Slovenian→sl-SI, Spanish→es-ES, Swedish→sv-SE,
Ukrainian→uk-UA, Welsh→cy-GB
```
Default fallback: `"es-ES"`

**Image — Gemini Imagen (Primary):**
```
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-001:predict?key={GEMINI_API_KEY}
Method: POST
Body:
{
  "instances": [{ "prompt": "A detailed photograph showing clearly: {card.target} / {card.imageSearchNode}" }],
  "parameters": { "sampleCount": 1, "aspectRatio": "1:1" }
}
Response field: predictions[0].bytesBase64Encoded || predictions[0].bytes
```

**Image — Gemini Imagen (Fallback, triggered on 404 or missing `predictions`):**
```
Same as above but model: imagen-3.0-generate-001
```

**Image — Unsplash (Fallback if GEMINI_API_KEY absent):**
```
Endpoint: https://api.unsplash.com/search/photos?page=1&query={encoded query}&client_id={UNSPLASH_ACCESS_KEY}
Response field: results[0].urls.regular (HTTPS URL stored as imageUrl)
```

**Success response:**
```json
{
  "cards": [
    {
      "target": "molinillo",
      "native": "milk frother",
      "imageSearchNode": "espresso milk frother",
      "audioBase64": "SUQzBAAAAAAAI...",
      "imageBase64": "iVBORw0KGgoAAAA...",
      "imageUrl": null
    }
  ],
  "tokens": 1240,
  "audioGenerated": 15,
  "imagesGenerated": 14
}
```

---

### 9.3 `POST /api/compile-apkg`

**File:** `src/app/api/compile-apkg/route.js`
**Runtime:** `export const runtime = "nodejs"` (required for `anki-apkg-export`)

**Request body:**
```json
{
  "topic": "Coffee Shop",
  "cards": [
    {
      "target": "molinillo",
      "native": "milk frother",
      "subtopic": "Coffee Equipment",
      "audioBase64": "SUQzBAAAAAAAI...",
      "imageBase64": "iVBORw0KGgoAAAA...",
      "imageUrl": null
    }
  ]
}
```

**Validation:** Returns 400 if `cards` is missing or not an array.

**Processing per card (index `i`):**

1. **Audio** — if `card.audioBase64` exists:
   ```js
   apkg.addMedia(`audio_${i}.mp3`, Buffer.from(card.audioBase64, "base64"));
   ```

2. **Image** — priority order:
   - If `card.imageBase64`: `Buffer.from(card.imageBase64, "base64")`
   - Else if `card.imageUrl`: `fetch(imageUrl)` → `arrayBuffer()` → `Buffer.from()`
   - Sets `hasImage = true` on success

3. **Card HTML (Front):**
   ```html
   <div style="text-align:center; font-family: sans-serif;">
     <h2 style="color: #00E5FF; margin: 40px 0;">{card.native}</h2>
   </div>
   ```

4. **Card HTML (Back):**
   ```html
   <div style="text-align:center; font-family: sans-serif;">
     <h2>{card.target}</h2>
     <br><img src="image_{i}.jpg" style="max-height: 250px; border-radius: 8px;">  <!-- if hasImage -->
     <br>[sound:audio_{i}.mp3]  <!-- if audioBase64 -->
     <hr><p style="color: gray; font-size: 0.8em;">Subtopic: {card.subtopic || topic}</p>
   </div>
   ```

5. **`apkg.addCard(frontText, backText)`**

**Export:**
```js
const zip = await apkg.save();  // Returns Buffer (ZIP containing SQLite + media)
return new NextResponse(zip, {
  status: 200,
  headers: {
    "Content-Type": "application/vnd.anki",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(topic)}.apkg"`,
  },
});
```

**Deck name:** `"Vagabond: {topic}"`

---

## 10. Internationalization (i18n)

**File:** `src/app/locales.js`
**Export:** `TRANSLATIONS` — object keyed by language name

### 10.1 Translation Keys Schema
Each language entry must implement these 28 keys:

| Key | Example (English) |
|---|---|
| `hero_title` | "Learn Faster." |
| `hero_subtitle` | "Deploy immersive Anki flashcards..." |
| `label_native` | "Native Language" |
| `label_target` | "Target Language" |
| `label_topic` | "What do you want to learn?" |
| `label_subtopics` | "Number of Subtopics" |
| `label_words_per_subtopic` | "Words per Subtopic" |
| `btn_discover` | "Discover Subtopics" |
| `btn_discovering` | "Discovering..." |
| `step2_title` | "Customize Your Focus" |
| `step2_desc` | "We've mapped out key concepts for \"{topic}\"..." |
| `btn_generate` | "Generate {count} Cards" |
| `step3_title` | "Crafting Your Syllabus..." |
| `btn_cancel` | "Cancel & Reset" |
| `step4_title` | "Deck Generated!" |
| `step4_desc` | "Your immersive learning deck is ready..." |
| `stat_cards` | "Total Cards" |
| `stat_audio` | "Native Audio" |
| `stat_images` | "Context Images" |
| `stat_tokens` | "AI Tokens" |
| `btn_download` | "Download .apkg" |
| `btn_restart` | "Create another deck" |
| `auth_title` | "Account Setup" *(legacy)* |
| `auth_desc` | *(legacy)* |
| `auth_placeholder` | *(legacy)* |
| `btn_auth` | *(legacy)* |
| `btn_close` | *(legacy)* |
| `placeholder_topic` | "e.g. 'Coffee Shop' or 'Real Estate'" |
| `import_guide_title` | "How to Import into Anki" |
| `import_step_1` | "Open the Anki app on your device." |
| `import_step_2` | "Go to File -> Import (or Ctrl+I)." |
| `import_step_3` | "Select the .apkg file you just downloaded." |

**Parameterized keys** use `{varName}` placeholders:
- `step2_desc` → `{topic}`
- `btn_generate` → `{count}`

### 10.2 Fully Translated Languages
English, Spanish, French, German, Italian, Portuguese, Russian (+ partial: Polish, Dutch, and 29 others fall through to English for missing keys)

### 10.3 Fallback Chain
`TRANSLATIONS[nativeLanguage][key]` → `TRANSLATIONS["English"][key]` → `key` (raw key string)

---

## 11. Status Rotator Messages

**File:** `src/components/generator/statuses.js`
**Export:** `STATUSES` — object keyed by language name
**Rotation interval:** 4000ms
**Theme:** Digital nomad / immigrant humor

### Supported Languages (with message counts)
| Language | Count |
|---|---|
| English | 20 |
| Spanish | 20 |
| Russian | 20 |
| French | 20 |
| German | 20 |
| Italian | 20 |
| Portuguese | 10 |
| Polish | 20 |
| Dutch | 20 |
| Romanian | 20 |
| Bulgarian | 18 |
| Czech | 18 |
| Finnish | 18 |

Fallback for all other languages: `STATUSES["English"]`

### Sample Messages (English)
- "Finding a local SIM card that doesn't require a blood sample..."
- "Explaining to a border agent that 'Digital Nomad' isn't code for spy..."
- "Realizing I've been saying 'I am a pineapple' instead of 'I am a traveler' for 3 days..."
- "Wondering why the post office is only open for 4 minutes on Tuesdays..."
- "Learning the word for 'help' only to realize I'm in the wrong country..."

---

## 12. Data Flow: Full Generation Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1 — User Input                                             │
│  formData: { nativeLanguage, targetLanguage, topic,             │
│              subtopicCount (3-10), wordsPerSubtopic (10-50) }   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ handleGenerateTopics() — form submit
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/generate-topics                                       │
│  → OpenRouter (qwen-2.5-72b-instruct)                           │
│  → Returns: { subtopics: string[] }                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ setAvailableSubtopics(subtopics)
                           │ setSelectedSubtopics(subtopics.slice(0,5))
                           │ setStep(2)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2 — Subtopic Selection                                     │
│  User toggles topic tags, adjusts words-per-subtopic slider     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ handleGenerateDeck()
                           │ setStep(3)
                           │ setGeneratingProgress(selectedSubtopics.map → "pending")
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3 — Sequential Card Generation                             │
│                                                                 │
│  FOR EACH subtopic (sequential, not parallel):                  │
│  1. Set progress[i].status = "active"                           │
│  2. POST /api/generate-topic-cards                              │
│     Body: { topic, subtopic, nativeLanguage, targetLanguage,    │
│             count: wordsPerSubtopic, previouslyGeneratedWords }  │
│                                                                 │
│     Inside the route (parallel per card):                       │
│     ├─ OpenRouter LLM → vocabulary pairs + imageSearchNode       │
│     ├─ Google TTS → MP3 audio (base64)                          │
│     └─ Gemini Imagen (fast-001 → generate-001) → JPEG (base64) │
│        OR Unsplash → imageUrl                                   │
│                                                                 │
│  3. Accumulate cards in allCards[]                              │
│  4. Add card.target words to previouslyGeneratedWords[]         │
│  5. Update generationStats (cards, audio, images, tokens)       │
│  6. Set progress[i].status = "done", progress[i].generatedCards │
│     → WordCloud renders for that subtopic                       │
│                                                                 │
│  AFTER ALL SUBTOPICS:                                           │
│  POST /api/compile-apkg                                         │
│     Body: { topic, cards: allCards (with subtopic field added)} │
│     → anki-apkg-export builds ZIP (SQLite + MP3s + JPEGs)      │
│     → Returns binary .apkg blob                                 │
│                                                                 │
│  setDownloadUrl(URL.createObjectURL(blob))                      │
│  setStep(4)                                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4 — Export                                                 │
│  Stats display + <a download> link + Anki import guide          │
└─────────────────────────────────────────────────────────────────┘
```

**Key subtopic loop detail:** Subtopics are processed **sequentially** (not in parallel) to allow:
1. Progressive UI feedback per subtopic
2. Growing `previouslyGeneratedWords` array to prevent cross-subtopic duplicates

**Within each subtopic**, audio and image generation are processed in **parallel** via `Promise.all`.

---

## 13. External API Integrations

### 13.1 OpenRouter
| Property | Value |
|---|---|
| Base URL | `https://openrouter.ai/api/v1` |
| Auth | `Authorization: Bearer {OPENROUTER_API_KEY}` (handled by OpenAI SDK) |
| Custom Headers | `HTTP-Referer: http://localhost:3000`, `X-OpenRouter-Title: Vagabond AI` |
| Model | `qwen/qwen-2.5-72b-instruct` |
| Response format | `{ type: "json_object" }` |

### 13.2 Google Cloud Text-to-Speech
| Property | Value |
|---|---|
| Endpoint | `https://texttospeech.googleapis.com/v1/text:synthesize` |
| Auth | Query param `?key={GOOGLE_TTS_API_KEY}` |
| Input | `{ text: card.target }` |
| Voice | `{ languageCode: "{BCP47 code}" }` |
| Audio config | `{ audioEncoding: "MP3" }` |
| Response | `{ audioContent: "<base64 MP3>" }` |

### 13.3 Google Gemini Imagen
| Property | Value |
|---|---|
| Primary endpoint | `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-001:predict` |
| Fallback endpoint | `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict` |
| Auth | Query param `?key={GEMINI_API_KEY}` |
| Request | `{ instances: [{ prompt: "..." }], parameters: { sampleCount: 1, aspectRatio: "1:1" } }` |
| Prompt template | `"A detailed photograph showing clearly: {card.target} / {card.imageSearchNode}"` |
| Fallback trigger | HTTP 404 OR missing `predictions` field in response |
| Response | `predictions[0].bytesBase64Encoded \|\| predictions[0].bytes` (base64 JPEG) |

### 13.4 Unsplash (Optional Fallback)
| Property | Value |
|---|---|
| Endpoint | `https://api.unsplash.com/search/photos` |
| Auth | Query param `&client_id={UNSPLASH_ACCESS_KEY}` |
| Params | `page=1&query={encodeURIComponent(card.imageSearchNode)}` |
| Response | `results[0].urls.regular` (HTTPS image URL) |
| Activation | Only used when `GEMINI_API_KEY` is not set |

---

## 14. Anki `.apkg` Format

An `.apkg` file is a ZIP archive with the following internal structure:

```
{topic}.apkg (ZIP)
├── collection.anki2        # SQLite database
│   ├── notes table         # Card front/back content
│   ├── cards table         # Scheduling metadata
│   └── col table           # Deck configuration
├── media                   # JSON mapping: { "0": "audio_0.mp3", "1": "image_0.jpg", ... }
├── audio_0.mp3             # Binary media files
├── audio_1.mp3
├── image_0.jpg
├── image_1.jpg
└── ...
```

`anki-apkg-export` abstracts all of this. The application's responsibilities:
1. `new Exporter("Vagabond: {topic}")` — creates the deck
2. `apkg.addMedia(filename, Buffer)` — registers media
3. `apkg.addCard(frontHTML, backHTML)` — registers the card
4. `await apkg.save()` — returns a `Buffer` (the ZIP)

**Sound tag syntax in back HTML:** `[sound:audio_N.mp3]` — Anki's proprietary syntax for embedded audio playback.

**Image tag:** Standard `<img src="image_N.jpg">` — Anki resolves it from the media folder.

**MIME type for HTTP response:** `application/vnd.anki`

---

## 15. Coding Conventions & Constraints

| Rule | Detail |
|---|---|
| **File size limit** | All component files MUST remain under 200 lines. Immediately refactor any file that exceeds this. |
| **No Tailwind CSS** | All styles in `globals.css` or inline. No `className` with Tailwind utility classes. |
| **Path aliases** | Use `@/` prefix (`@/app/locales`, `@/components/generator/Step1`). Configured in `jsconfig.json`. |
| **CSS isolation** | Global styles in `globals.css`. No CSS modules. No `styled-components`. |
| **Client components** | All interactive components use `"use client"` directive. |
| **Edge runtime** | AI API routes (`generate-topics`, `generate-topic-cards`) use `export const runtime = "edge"`. |
| **Node.js runtime** | APKG compilation route uses `export const runtime = "nodejs"` (required by `anki-apkg-export`). |
| **No TailwindCSS** | Enforced across all files. |
| **Documentation sync** | All core changes must be reflected in `AGENTS.md`, `CLAUDE.md`, and `specification.md`. |

---

## 16. Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Create .env.local at project root with:
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_TTS_API_KEY=AIza...
GEMINI_API_KEY=AIza...
UNSPLASH_ACCESS_KEY=...       # optional

# 3. Start development server
npm run dev
# → http://localhost:3000

# 4. Build for production
npm run build

# 5. Start production server
npm run start

# 6. Lint
npm run lint
```

**Node.js version:** 18+ recommended (required by Next.js 16 and `anki-apkg-export`)
**Deployment target:** Vercel (Next.js-native, zero config)

---

## 17. Known Bugs in v0.1.0

These are defects found in the source code that should be fixed in any rebuild:

| # | File | Bug | Impact |
|---|---|---|---|
| 1 | `generate-topics/route.js:38-41` | `openai.chat.completions.create()` is called **without a `messages` array** — only `response_format` is passed. The prompt string is constructed but never sent. | Topics API likely returns empty or random output. |
| 2 | `generate-topic-cards/route.js:61-68` | `parsedData` is declared with `let` outside the try block, then re-declared with `const` inside — the inner `const` is block-scoped and the outer `parsedData` is never populated. `cards` will always be `[]`. | Zero cards generated for every subtopic. |
| 3 | `generate-topic-cards/route.js:97-101` | The TTS `body` JSON has **two `input` keys**. In JS object literals, duplicate keys result in the last value winning — both are identical so it's non-breaking, but it's a code smell. | No functional impact. |
| 4 | `generate-topic-cards/route.js:148-151` | `imageBase64` assignment is duplicated on two lines (`pred.bytesBase64Encoded \|\| pred.bytes` written twice). | No functional impact (idempotent assignment). |
| 5 | `page.js:146` | `<h1>{t("hero_subtitle")}</p>` — opening `<h1>` tag with closing `</p>` tag. | Invalid HTML; browser will attempt to correct but styles may be inconsistent. |
| 6 | `page.js:33` | `navigator.userLanguage` — this is a non-standard IE property. Should use `navigator.language` only. | Minor: only affects very old browsers. |
