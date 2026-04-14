import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "models.json");

const INITIAL_MODELS = [
  { modelId: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", custom: false },
  { modelId: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super", custom: false },
  { modelId: "qwen/qwen3.6-plus:free", name: "Qwen 3.6 Plus", custom: false },
];

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  fs.mkdirSync(dirname, { recursive: true });
}

export async function GET() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      ensureDirectoryExistence(DATA_PATH);
      fs.writeFileSync(DATA_PATH, JSON.stringify(INITIAL_MODELS, null, 2));
      return NextResponse.json(INITIAL_MODELS);
    }
    const data = fs.readFileSync(DATA_PATH, "utf8");
    return NextResponse.json(JSON.parse(data || "[]"));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { modelId, name } = await req.json();
    ensureDirectoryExistence(DATA_PATH);
    
    let models = [];
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, "utf8");
      models = JSON.parse(data || "[]");
    }
    
    if (models.some(m => m.modelId === modelId)) {
       return NextResponse.json({ success: true });
    }

    const updatedModels = [...models, { modelId, name: name || modelId, custom: true }];
    fs.writeFileSync(DATA_PATH, JSON.stringify(updatedModels, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { modelId } = await req.json();
    if (!fs.existsSync(DATA_PATH)) return NextResponse.json({ success: true });
    
    const data = fs.readFileSync(DATA_PATH, "utf8");
    let models = JSON.parse(data || "[]");
    
    const updatedModels = models.filter(m => m.modelId !== modelId);
    fs.writeFileSync(DATA_PATH, JSON.stringify(updatedModels, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
