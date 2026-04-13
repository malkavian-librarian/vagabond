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
    const { nativeLanguage, targetLanguage, topic, subtopicCount } = await req.json();

    if (!topic || !nativeLanguage || !targetLanguage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not set" }, { status: 500, headers: corsHeaders });
    }

    const prompt = `You are a language teacher formulating a curriculum. The learner speaks ${nativeLanguage} natively and is learning ${targetLanguage}.
Topic: "${topic}".
Output a JSON object containing an array of exactly ${subtopicCount || 10} subtopics related to this topic.
The subtopics should be in ${nativeLanguage} and describe specific areas of vocabulary (e.g., "Engine Parts", "Riding Gear").

Format exactly:
{
  "subtopics": ["subtopic 1", "subtopic 2", "etc..."]
}`;

    const completion = await openai.chat.completions.create({
      model: "qwen/qwen-2.5-72b-instruct",
      messages: [{ role: "user", content: prompt }], // FIX: Bug #1 - added messages
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    const parsedData = JSON.parse(content);

    return NextResponse.json(parsedData, { headers: corsHeaders });
  } catch (error) {
    console.error("Generate Topics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

