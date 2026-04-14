import { NextResponse } from "next/server";
import Exporter from "anki-apkg-export";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    const { topic, cards } = await req.json();

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: "Missing cards array" }, { status: 400, headers: corsHeaders });
    }

    const apkg = new Exporter(`Vagabond: ${topic}`);

    cards.forEach((card, i) => {
      let hasImage = false;
      let hasAudio = false;

      if (card.audioBase64) {
        apkg.addMedia(`audio_${i}.mp3`, Buffer.from(card.audioBase64, "base64"));
        hasAudio = true;
      }

      if (card.imageBase64) {
        apkg.addMedia(`image_${i}.jpg`, Buffer.from(card.imageBase64, "base64"));
        hasImage = true;
      }

      const frontText = `
        <div style="text-align:center; font-family: sans-serif; padding: 20px;">
          <h2 style="color: #00B8D4; margin: 40px 0; font-size: 24px;">${card.native}</h2>
        </div>
      `;

      const backText = `
        <div style="text-align:center; font-family: sans-serif; padding: 20px;">
          <h2 style="font-size: 28px; color: #00B8D4;">${card.target}</h2>
          <br>
          ${hasImage ? `<img src="image_${i}.jpg" style="max-width: 100%; max-height: 250px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">` : ""}
          <br>
          ${hasAudio ? `[sound:audio_${i}.mp3]` : ""}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 14px;">Subtopic: ${card.subtopic || topic}</p>
        </div>
      `;

      apkg.addCard(frontText, backText);
    });

    const zip = await apkg.save();

    return new NextResponse(zip, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.anki",
        "Content-Disposition": `attachment; filename="Vagabond-${encodeURIComponent(topic)}.apkg"`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Compile APKG Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
