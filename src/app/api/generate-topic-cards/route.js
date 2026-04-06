import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-OpenRouter-Title": "Vagabond AI",
  },
});

const TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-001:predict";
const GEMINI_FALLBACK = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict";

const LANG_MAPPING = {
  English: "en-US", Spanish: "es-ES", French: "fr-FR", German: "de-DE",
  Italian: "it-IT", Portuguese: "pt-PT", Russian: "ru-RU", Ukrainian: "uk-UA",
  Polish: "pl-PL", Dutch: "nl-NL", Greek: "el-GR", Bulgarian: "bg-BG",
  Czech: "cs-CZ", Danish: "da-DK", Finnish: "fi-FI", Hungarian: "hu-HU",
  Romanian: "ro-RO", Slovak: "sk-SK", Swedish: "sv-SE", Catalan: "ca-ES",
  Croatian: "hr-HR", Estonian: "et-EE", Irish: "ga-IE", Icelandic: "is-IS",
  Latvian: "lv-LV", Lithuanian: "lt-LT", Macedonian: "mk-MK", Maltese: "mt-MT",
  Serbian: "sr-RS", Slovenian: "sl-SI", Albanian: "sq-AL", Belarusian: "be-BY",
  Bosnian: "bs-BA", Galician: "gl-ES", Welsh: "cy-GB", "Basque": "eu-ES",
  "Scottish Gaelic": "gd-GB"
};

async function generateTTS(text, lang) {
  if (!process.env.GOOGLE_TTS_API_KEY) return null;
  try {
    const res = await fetch(`${TTS_URL}?key=${process.env.GOOGLE_TTS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: LANG_MAPPING[lang] || "en-US" },
        audioConfig: { audioEncoding: "MP3" }
      })
    });
    const data = await res.json();
    return data.audioContent;
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
}

async function generateImage(text, searchNode) {
  if (!process.env.GEMINI_API_KEY) return null;
  const prompt = `A detailed photograph showing clearly: ${text} / ${searchNode}`;
  const body = {
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio: "1:1" }
  };
  
  try {
    let res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    if (res.status === 404) {
      res = await fetch(`${GEMINI_FALLBACK}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }
    
    const data = await res.json();
    const pred = data?.predictions?.[0];
    return pred?.bytesBase64Encoded || pred?.bytes || null;
  } catch (e) {
    console.error("Gemini Image Error:", e);
    return null;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const { topic, subtopic, nativeLanguage, targetLanguage, count, previouslyGeneratedWords } = await req.json();

    if (!subtopic || !nativeLanguage || !targetLanguage || !count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const exclusionRule = previouslyGeneratedWords?.length ? `\nCRITICAL: DO NOT duplicate any of the following vocabulary items: ${previouslyGeneratedWords.join(", ")}` : "";

    const prompt = `You are a curriculum creator. Topic: "${topic}", Subtopic: "${subtopic}".
Generate ${count} completely unique vocabulary words or phrases in ${targetLanguage} with their ${nativeLanguage} translation.${exclusionRule}
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
}`;

    const textCompletion = await openai.chat.completions.create({
      model: "qwen/qwen-2.5-72b-instruct",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = textCompletion.choices[0].message.content;
    const parsedData = JSON.parse(content); // FIX: Bug #2 - Corrected block scope logic

    const enrichedCards = await Promise.all(
      parsedData.cards.map(async (card) => {
        const [audio, image] = await Promise.all([
          generateTTS(card.target, targetLanguage),
          generateImage(card.target, card.imageSearchNode)
        ]);
        return {
          ...card,
          audioBase64: audio,
          imageBase64: image
        };
      })
    );

    return NextResponse.json({
      cards: enrichedCards,
      tokens: textCompletion.usage.total_tokens || 0,
      audioGenerated: enrichedCards.filter(c => c.audioBase64).length,
      imagesGenerated: enrichedCards.filter(c => c.imageBase64).length
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Generate Topic Cards Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

