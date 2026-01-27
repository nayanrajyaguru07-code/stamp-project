import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    const userId = decoded.sub;

    await query("BEGIN");

    // Check credits
    const userRes = await query("SELECT credits FROM users WHERE id = $1", [
      userId,
    ]);

    if (userRes.rowCount === 0) {
      await query("ROLLBACK");
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const currentCredits = userRes.rows[0].credits || 0;

    if (currentCredits <= 0) {
      await query("ROLLBACK");
      return NextResponse.json(
        { message: "Insufficient credits" },
        { status: 403 }
      );
    }

    // Deduct credit
    const newCredits = currentCredits - 1;
    await query("UPDATE users SET credits = $1 WHERE id = $2", [
      newCredits,
      userId,
    ]);

    await query("COMMIT");

    return NextResponse.json({ success: true, credits: newCredits });
  } catch (err) {
    await query("ROLLBACK");
    console.error("Deduct credit error:", err);
    return NextResponse.json(
      { message: "Failed to deduct credit" },
      { status: 500 }
    );
  }
}
