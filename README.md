# 🌍 Vagabond: Anki Card Local Generator

**Vagabond** is a local self-hosted ANKI generator one can run with minimal investments, vibe-coded and free. It generates high-fidelity Anki flashcard decks enriched with native audio and contextual images, tailored to your immediate environment or professional needs.

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

```

### 4. Running the App

```bash
npm run dev
```

Visit `http://localhost:3000` to start generating your syllabus.

---

## 🔑 How to Obtain API Keys

1. **OpenRouter**: Think of this as the "brain" of the app. Go to [OpenRouter.ai](https://openrouter.ai/), sign up, and add a tiny bit of credit (even $1 is plenty). Generate an API key and paste it into your `.env.local`. This lets the AI brainstorm vocabulary and translations for you.
2. **Google Cloud (TTS & Imagen)**: This provides the "voice" and "eyes". Go to the [Google Cloud Console](https://console.cloud.google.com/), create a project, and enable the **Text-to-Speech API** and **Generative AI API (Imagen)**. Create a single API key in the 'Credentials' section and use it—it works for both voice and image generation!

---

## ☕ Support the Project

If you find Vagabond useful and it helps you learn faster, consider supporting my work:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/geneishchuk)

Tips and feedback are always welcome! 🚀

---

## 🛡️ License


Private Copy - All Rights Reserved.
