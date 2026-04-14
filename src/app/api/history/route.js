import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "history.json");

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  fs.mkdirSync(dirname, { recursive: true });
}

export async function GET() {
  try {
    if (!fs.existsSync(DATA_PATH)) return NextResponse.json([]);
    const data = fs.readFileSync(DATA_PATH, "utf8");
    return NextResponse.json(JSON.parse(data || "[]"));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const newEntries = await req.json();
    ensureDirectoryExistence(DATA_PATH);
    
    let history = [];
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, "utf8");
      history = JSON.parse(data || "[]");
    }
    
    const updatedHistory = [...history, ...newEntries];
    fs.writeFileSync(DATA_PATH, JSON.stringify(updatedHistory, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    fs.writeFileSync(DATA_PATH, "[]");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
