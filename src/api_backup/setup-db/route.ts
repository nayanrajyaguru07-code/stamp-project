import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await query(`
      ALTER TABLE plan_requests 
      ADD COLUMN IF NOT EXISTS amount VARCHAR(50);
    `);
    return NextResponse.json({ message: "Migration successful: Added 'amount' column." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
