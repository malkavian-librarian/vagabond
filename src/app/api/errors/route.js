import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const errorsFilePath = path.join(process.cwd(), "data", "errors.json");

export async function GET() {
  try {
    if (!fs.existsSync(errorsFilePath)) return NextResponse.json([]);
    const data = fs.readFileSync(errorsFilePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (e) {
    return NextResponse.json({ error: "Failed to read errors" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const errorData = await req.json();
    
    let errors = [];
    if (fs.existsSync(errorsFilePath)) {
      errors = JSON.parse(fs.readFileSync(errorsFilePath, "utf-8"));
    }

    const newError = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...errorData
    };

    errors.unshift(newError);
    // Keep last 100 errors to avoid bloat
    if (errors.length > 100) errors = errors.slice(0, 100);

    fs.writeFileSync(errorsFilePath, JSON.stringify(errors, null, 2));

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to write error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    fs.writeFileSync(errorsFilePath, JSON.stringify([]));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to clear errors" }, { status: 500 });
  }
}
