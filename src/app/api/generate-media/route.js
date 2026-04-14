import { NextResponse } from "next/server";

export const runtime = "edge";

const TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

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

async function generateTTS(text, lang, reqUrl) {
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
    if (data.error) {
       await fetch(new URL("/api/errors", reqUrl), {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ model: "Google TTS", error_code: data.error.code, message: data.error.message, context: "Audio Generation" })
       }).catch(() => {});
    }
    return data.audioContent || null;
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
}

async function enhancePrompt(card, targetLanguage, topic, llmModel, reqUrl) {
  if (!process.env.OPENROUTER_API_KEY || !llmModel) return null;
  const instruction = `You are a prompt enhancer. Your task is to output ONLY a highly descriptive image generation prompt.\nBase request: Generate an image for an ANKI card to learn ${targetLanguage}. Generate an image for the word "${card.target}" in the following context: ${card.subtopic || ""} - ${topic}.\nRules for the enhanced prompt: Do not use text on the image, just the picture. Make it funny and memorable. Use the pirate theme if possible (our application is called Vagabond). Describe the visual scene in detail.\nOutput ONLY the final descriptive string.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [{ role: "user", content: instruction }]
        })
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2000));
        continue;
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.error("Enhance Prompt Error:", e);
      if (attempt === 2) return null;
    }
  }
  return null;
}

async function generateImage(card, targetLanguage, topic, model, reqUrl) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  
  const basePrompt = `You are asked to generate an image for an ANKI card to learn ${targetLanguage}. Generate an image for ${card.target} in the following context: ${card.subtopic || ""} - ${topic}.`;
  
  const enhancedPrompt = model ? await enhancePrompt(card, targetLanguage, topic, model, reqUrl) : null;
  const prompt = enhancedPrompt || basePrompt;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
          image_config: { aspect_ratio: "1:1" }
        })
      });
      
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2500));
        continue;
      }

      const data = await res.json();

      if (data.error) {
         if (attempt === 2) {
           await fetch(new URL("/api/errors", reqUrl), {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ model: "google/gemini-2.5-flash-image", error_code: data.error.code, message: data.error.message, context: "Image Generation" })
           }).catch(() => {});
           return null;
         }
         continue; // retry if another error and attempts remain
      }

      const message = data?.choices?.[0]?.message;
      if (message?.images && message.images.length > 0) {
        const dataUrl = message.images[0].image_url?.url || message.images[0].url;
        if (dataUrl && dataUrl.includes(";base64,")) {
          return dataUrl.split(";base64,")[1];
        }
      }

      const content = message?.content || "";
      const urlMatch = content.match(/https?:\/\/[^\s)"]+/);
      if (urlMatch) {
        const imgRes = await fetch(urlMatch[0]);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          return Buffer.from(arrayBuffer).toString("base64");
        }
      }
      
      return null;
    } catch (e) {
      console.error("OpenRouter Image Error:", e);
      if (attempt === 2) return null;
    }
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
    const { cards, targetLanguage, topic, model } = await req.json();

    if (!cards || !Array.isArray(cards) || !targetLanguage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const enrichedCards = await Promise.all(
      cards.map(async (card) => {
        const [audio, image] = await Promise.all([
          generateTTS(card.target, targetLanguage, req.url),
          generateImage(card, targetLanguage, topic, model, req.url)
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
      audioGenerated: enrichedCards.filter(c => c.audioBase64).length,
      imagesGenerated: enrichedCards.filter(c => c.imageBase64).length
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Generate Media Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
