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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const { targetLanguage, baseDictionary } = await req.json();

    if (!targetLanguage || !baseDictionary) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const prompt = `You are a professional translator. Translate the following UI dictionary into ${targetLanguage}.
Maintain the exact JSON structure and keys. Only translate the values.
Ensure the tone is helpful, modern, and nomadic (inspired by the branding "Vagabond").
Handle placeholders like {topic} or {count} by keeping them exactly as they are in the translated string.

JSON to translate:
${JSON.stringify(baseDictionary, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "qwen/qwen-2.5-72b-instruct",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    const translatedDictionary = JSON.parse(content);

    return NextResponse.json({ translation: translatedDictionary }, { headers: corsHeaders });
  } catch (error) {
    console.error("Translate UI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
