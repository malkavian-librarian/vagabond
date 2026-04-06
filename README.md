# 🌍 Vagabond: Immersive Anki Deck Generator

**Vagabond** is a premium, AI-powered tool for digital nomads and language learners who want to hit the ground running. It generates high-fidelity Anki flashcard decks enriched with native audio and contextual images, tailored to your immediate environment or professional needs.

---

## ✨ Features

- **AI-Powered Discovery**: Brainstorm specialized subtopics for any theme (e.g., "Renting an Apartment", "At the Barbershop") using Qwen-2.5-72B.
- **Native Audio**: High-quality MP3 pronunciation for every card via Google Cloud Text-to-Speech.
- **Contextual Images**: Photorealistic image generation using Google Gemini Imagen 3.0.
- **Dynamic Translation**: Real-time UI internationalization across 38 European languages.
- **Anki-Native Export**: Direct `.apkg` downloads for seamless import into the Anki desktop app.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Modular Vanilla CSS (Cyprus Glassmorphism palette)
- **Runtimes**: Hybrid Edge (AI generation) + Node.js (Anki compilation)
- **AI Models**: Qwen-2.5 (OpenRouter), Gemini Imagen 3.0, Google TTS.

---

## 🚀 Getting Started

### 1. Requirements

- [Node.js](https://nodejs.org/) 18.x or later.
- [Anki](https://apps.ankiweb.net/) for deck import.

### 2. Installation

```bash
git clone https://github.com/your-username/vagabond.git
cd vagabond
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory (refer to `.env.example`):

```bash
# LLM Generation
OPENROUTER_API_KEY=your_key

# Google Cloud Services
GOOGLE_TTS_API_KEY=your_key
GEMINI_API_KEY=your_key

# Optional
UNSPLASH_ACCESS_KEY=your_key
```

### 4. Running the App

```bash
npm run dev
```

Visit `http://localhost:3000` to start generating your syllabus.

---

## 🔑 How to Obtain API Keys

1. **OpenRouter**: Visit [OpenRouter.ai](https://openrouter.ai/) to create an account and generate a key. This provides access to the Qwen-2.5 models used for vocabulary generation.
2. **Google Cloud TTS/Gemini**: Visit the [Google Cloud Console](https://console.cloud.google.com/), enable the **Text-to-Speech API** and **Generative AI API (Imagen)**, and create a standard API key in the Credentials section.

---

## 🛡️ License

Private Copy - All Rights Reserved.
