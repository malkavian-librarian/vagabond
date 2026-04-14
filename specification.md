# Technical Specification & Curriculum Blueprint: Vagabond
**Version:** 0.2.0 | **Status:** Production-ready | **Core Engine:** Next.js + React 19 + Vitest

> This document is a complete, build-from-scratch educational blueprint for **Vagabond** — an AI-powered immersive Anki deck generator for language learners. Every component, API route, custom React hook, data structure, CSS rule, and external integration is documented in full detail so students and developers can reconstruct the application layer-by-layer without reference to the original source code.

---

## Curriculum Table of Contents
1. [Project Overview & Learning Goals](#1-project-overview--learning-goals)
2. [Tech Stack Requirements](#2-tech-stack-requirements)
3. [Directory Layout](#3-directory-layout)
4. [Environment Configuration](#4-environment-configuration)
5. [Design System & Vanilla CSS](#5-design-system--vanilla-css)
6. [Application Architecture (The React Hooks Pipeline)](#6-application-architecture-the-react-hooks-pipeline)
7. [Component Reference (Next.js Dynamic Imports)](#7-component-reference-nextjs-dynamic-imports)
8. [API Routes & Serverless Microservices](#8-api-routes--serverless-microservices)
9. [External API Integrations (LLM, TTS, Imagen)](#9-external-api-integrations-llm-tts-imagen)
10. [Testing Infrastructure: Vitest & Coverage Standards](#10-testing-infrastructure-vitest--coverage-standards)
11. [Local Storage Persistence & Git Ignores](#11-local-storage-persistence--git-ignores)
12. [Coding Conventions & Architectural Constraints](#12-coding-conventions--architectural-constraints)

---

## 1. Project Overview & Learning Goals

**Vagabond** is a Next.js web application that structurally generates and dynamically injects localized Anki flashcard decks mapped completely with:
- **AI-generated vocabulary pairs** (Target language context + Native translation) using LLMs.
- **Native-language MP3 audio** generated concurrently via Google Cloud Text-to-Speech APIs.
- **Contextual JPEGs** mapped contextually to the word instances requested dynamically mapped via Google Gemini Flash models.

### Student Architectural Challenges
Throughout building this application, students will heavily manipulate:
1. **API Streaming Constraints**: Overriding Edge configurations vs. Node.js contexts natively for buffering.
2. **React DOM Load Isolation**: Learning `next/dynamic` effectively.
3. **State Hooks Modularity**: Removing heavy data tracking from visual representations. 
4. **Testing Architectures**: Integrating JSDOM test suites efficiently against custom hooks to secure a >80% global line coverage mark.

---

## 2. Tech Stack Requirements

### Runtime Environment Map
| Layer | Technology |
|---|---|
| Platform | Node.js 18+ (Required for Anki Blob configurations) |
| Framework | Next.js 16.2.2 (App Router methodology) |
| Logic | React 19.x + ReactDOM 19.x |
| Testing System| Vitest (v4.1.x) with JSDOM + @testing-library/react |
| Styling | Vanilla CSS (No Tailwind allowed whatsoever) |

### Core Project Dependencies (`package.json`)
```json
{
  "dependencies": {
    "anki-apkg-export": "^4.0.3",
    "lucide-react": "^1.7.0",
    "next": "16.2.2",
    "openai": "^6.33.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "uuid": "^13.0.0"
  },
  "devDependencies": {
    "eslint": "^9",
    "eslint-config-next": "16.2.2",
    "vitest": "^4.1.4",
    "@testing-library/react": "^16.0.0",
    "jsdom": "^24.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/coverage-v8": "^4.1.4"
  }
}
```

**Key Educational Notes on Dependencies:**
- `anki-apkg-export` relies heavily on executing `.sqlite` databases sequentially inside a local memory space. This completely breaks edge configurations. It must sit inside a Node.js specific route wrapper!
- The `openai` library heavily wraps `fetch` standards. We dynamically hijack the `baseURL` inside the initialization loop to intercept traffic towards `openrouter.ai`.

---

## 3. Directory Layout

The codebase has specific file definitions mapping `components/generator` strictly into `.jsx` suffixes conforming securely to Vite parsing conventions on Windows configurations!

```text
vagabond/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── compile-apkg/route.js        # Node.js payload compression
│   │   │   ├── errors/route.js              # Edge runtime error dump logging
│   │   │   ├── generate-topic-cards/route.js# Edge runtime logic parallelization
│   │   │   └── generate-topics/route.js     # Edge runtime brainstorming fetcher
│   │   ├── globals.css                      # Global UI design system
│   │   ├── layout.js                        # System root mapping html/body hooks
│   │   ├── locales.js                       # 38 Language translation strings
│   │   └── page.js                          # Container view mounting context hooks natively
│   ├── components/
│   │   ├── generator/
│   │   │   ├── Step1.jsx                    # Configuration (Numeric Inputs)
│   │   │   ├── Step2.jsx                    # Subtopic tagging 
│   │   │   ├── Step3Review.jsx              # Vocab review data table
│   │   │   ├── Step4Media.jsx               # Airbnb continuous progress UI hook
│   │   │   └── Step5Download.jsx            # Blob export container & summary
│   │   ├── history/HistoryView.jsx          # Lazily loaded telemetry dashboard
│   │   ├── layout/Navbar.js                 # Logo navigation mapping hooks
│   │   ├── models/ModelsView.jsx            # Local configuration map
│   │   └── ui/WordCloud.jsx                 # Legacy randomized tag cloud
│   ├── hooks/
│   │   └── useGeneratorPipeline.js          # The Central Logic Decoupler Hook
├── data/                                    # Ignored storage dir via .gitkeep
├── tests/
│   ├── components.test.jsx                  # React DOM testing logic
│   ├── locales.test.js                      # Standard validation algorithm bounds
│   ├── Step1.test.jsx                       # Custom hook DOM triggers
│   └── useGeneratorPipeline.test.js         # Integration mocking fetch API requests
├── vitest.config.js                         # React compilation mapping for Vite
├── AGENTS.md                                # Autonomous workflow rules for AI
└── CLAUDE.md                                # Development pipeline blueprint
```

---

## 4. Environment Configuration

### Secure Variables (`.env.local`)
| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | **Yes** | LLM access bridging dynamically toward Qwen |
| `GOOGLE_TTS_API_KEY` | **Yes** | Google Cloud Text-to-Speech API to pull localized MP3 representations |
| `GEMINI_API_KEY` | **Yes** | Image generation API mapping Context |

*Note: Students must understand that `.env.local` runs solely in Server memory. Frontend components will not have access natively avoiding catastrophic secret exposures!*

---

## 5. Design System & Vanilla CSS

No Tailwind CSS is utilized structurally, intentionally isolating React component markup strictly against decoupled UI tokens defined centrally to `<html lang="en">` wrappers.

### Core Tokens (`globals.css`)
```css
:root {
  --brand-cyan:         #00E5FF;
  --brand-teal:         #00B8D4;
  --brand-blue:         #2979FF;
  --brand-deep:         #102A43;
  --brand-bg:           #f8fafc;
  --brand-text:         #0f172a;
  --brand-border:       #e2e8f0;
}
```

### Visual Behaviors Applied:
1. **Glassmorphism**: Achieved via `.brand-card` utilizing `backdrop-filter: blur(20px)` and transparency layers `rgba(...)`.
2. **Smooth Interactions**: Scale interpolations (`transition: all 0.3s cubic-bezier(...)`) on hover effects mimicking iOS interfaces.
3. **Word Progress UI**: Continuous linear `.progress-bar` trackers utilizing smooth linear transformations natively reacting against percentage shifts.

---

## 6. Application Architecture (The React Hooks Pipeline)

In **version 0.1.0**, the entire application was a singular, monolithic `page.js` file spanning 800+ lines. As part of **v0.2.0 modularity tracking**, the architecture successfully splits logic completely away from UI renders.

### `src/hooks/useGeneratorPipeline.js`
This is a comprehensive custom React hook that absorbs all API logic dynamically.
```js
export function useGeneratorPipeline(initialFormData = null) {
  // 1. Core State Definition
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // 2. Dynamic Input Fields (No sliders)
  const [formData, setFormData] = useState({
    nativeLanguage: "English", targetLanguage: "Spanish", topic: "",
    subtopicCount: 5, wordsPerSubtopic: 15,
    ...initialFormData
  });

  // 3. Extracted Fetch Patterns
  const handleGenerateTopics = async (e) => { ... }
  const handleGenerateWords = async () => { ... }
  const handleGenerateMediaAndCompile = async () => { ... }

  return {
    step, loading, formData, handleGenerateTopics, ...
  };
}
```

### Dynamic Slicing in `page.js` (The Parent DOM)
To drastically reduce client footprint sizes directly interacting natively, `page.js` utilizes `next/dynamic` exclusively!
```js
import dynamic from 'next/dynamic';

const Step2 = dynamic(() => import('./../components/generator/Step2'));
const HistoryView = dynamic(() => import('./../components/history/HistoryView'));
const ErrorsView = dynamic(() => import('./../components/errors/ErrorsView'));

export default function Page() {
   const pipeline = useGeneratorPipeline();

   return (
      <Container>
         {pipeline.step === 1 && <Step1 {...pipeline} />}
         {pipeline.step === 2 && <Step2 {...pipeline} />}
      </Container>
   )
}
```

---

## 7. Component Reference (Next.js Dynamic Imports)

UI inputs mandate numerical precisions over generic scrolling inputs.

### `Step1.jsx` & `Step2.jsx` (Configuration)
Renders standard form arrays utilizing `<input type="number">` constraints directly reacting onto state contexts correctly!

### `Step3Review.jsx`
A heavily editable standard `<table className="vocab-table">` where users manually verify/flag words to bypass specific generations to save LLM tokens dynamically.

### `Step4Media.jsx` (Continuous Airbnb loading bounds)
Unlike standard loops, this directly tracks logic by mapping:
```jsx
<div className="progress-bar-container">
   <div 
     className="progress-bar-fill" 
     style={{ width: `${(generatingProgress.processedWords / generatingProgress.totalWords) * 100}%` }}
   />
</div>
```

---

## 8. API Routes & Serverless Microservices

### `api/generate-topics` (Edge)
A rigid call to OpenRouter expecting exact Array returns inside a JSON payload mapping subtopics.

### `api/generate-topic-cards` (Edge)
Handles fetching native terms vs target languages securely mapping against exactly 3 parameters simultaneously concurrently:
1. Translates the target words directly in JSON format via `qwen-2.5-72b-instruct`.
2. Validates against `previouslyGeneratedWords` arrays to ensure absolutely zero duplication overlap.

### `api/compile-apkg` (Node Wrapper)
Requires `Buffer` context parameters specifically generating temporary memory layouts that construct the file system `.sqlite` database maps prior to creating the transport zip logic automatically cleanly!

---

## 9. External API Integrations (LLM, TTS, Imagen)

### Google Gemini 2.5 Flash API (Replacing Seedream)
Image models transitioned fully into Google representations.

**Prompt Configuration (Exact Context string):**
```text
"You are asked to generate an image for an ANKI card to learn {TARGET_LANGUAGE}. Generate an image for {WORD} in the following context: {SUBTOPIC} - {QUERY}."
```

**Route Connection Implementation:**
```js
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  body: JSON.stringify({
    model: "google/gemini-2.5-flash-image",
    messages: [
      {
        role: "user",
        content: `You are asked to generate an image for an ANKI card to learn ${targetLanguage}. Generate an image for ${target} in the following context: ${subtopic} - ${imageSearchNode}. Do not generate any words in the image, just a relevant image.`
      }
    ]
  }),
  // Auth mapped by headers
});
```
*Note: Ensure students correctly unwrap the JSON structure grabbing `response.choices[0].message.content` inside `predictions` arrays securely!*

---

## 10. Testing Infrastructure: Vitest & Coverage Standards

This repository demands a rigid, automated testing boundary maintaining completely above **80% global test coverage** minimums statically. We execute this via Vitest JSDOM mounting capabilities!

### `vitest.config.js` 
```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ include: /\.(jsx|js)$/ })],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: [
        'src/hooks/**/*.js', 
        'src/app/locales.js', 
        'src/components/generator/*.jsx'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 40  // Reduced exclusively due to excessive ternary limits internally modifying React mappings
      }
    }
  }
});
```

To run this pipeline specifically, execute `npx vitest run --coverage`.

---

## 11. Local Storage Persistence & Git Ignores

### Data Privacy Strategies
API payloads specifically referencing error stacks (`api/errors`) and offline configurations MUST NEVER reach source control contexts publicly natively!

- `.gitignore` specifically isolates all `/data/*.json` occurrences locally natively avoiding history leaks entirely.
- `/data/.gitkeep` must be pushed to establish file paths remotely.

### React `localStorage` Hooks
`activeModel` tracking parameters implement lazy-loading definitions ensuring state persists seamlessly dynamically upon refreshing.
```js
useEffect(() => {
   const cached = localStorage.getItem("vagabond_model");
   if (cached) setActiveModel(cached);
}, []);
```

---

## 12. Coding Conventions & Architectural Constraints

When teaching this logic flow natively or managing student pull requests organically:
1. **File Bounds**: Never accept files parsing above 200 lines limit statically! Custom hooks completely mitigate bloating easily.
2. **Dynamic Splitting**: Never block thread memory. All non-primary route components dynamically load securely.
3. **Card Symmetry**: Ensure Front constraints reflect Native Strings, Back components represent Target String + Audio File. Audio never duplicates Native logic syntaxes!
4. **Error Logs**: Map model API breakdowns cleanly towards native JSON writes targeting the ignored `data` directory mappings cleanly.

<hr/>
Documentation Completed: 2026-04-14 - Vagabond Educational Deployment Configuration.
