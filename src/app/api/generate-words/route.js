import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-OpenRouter-Title": "Vagabond: Anki Card Local Generator",
  },
});

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
    const { topic, subtopic, nativeLanguage, targetLanguage, count, previouslyGeneratedWords, model } = await req.json();

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
      model: model || "qwen/qwen-2.5-72b-instruct",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = textCompletion.choices[0].message.content;
    const parsedData = JSON.parse(content); 

    // Add a unique ID and tracking subtopic to each card to help with the UI Table
    const formattedCards = parsedData.cards.map(card => ({
      ...card,
      subtopic,
      id: Math.random().toString(36).substring(7)
    }));

    return NextResponse.json({
      cards: formattedCards,
      tokens: textCompletion.usage.total_tokens || 0
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Generate Words Error:", error);
    await fetch(new URL("/api/errors", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "Unknown/OpenRouter", error_code: error.code || "unknown", message: error.message, context: "Text Generation" })
    }).catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
