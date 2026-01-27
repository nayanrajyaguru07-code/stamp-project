import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_name, email, plan_name, amount } = body;

    if (!user_name || !email || !plan_name) {
      return NextResponse.json(
        { message: "Missing required fields (user_name, email, plan_name)" },
        { status: 400 },
      );
    }

    // 🔒 Ensure user exists
    const userRes = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { message: "User not found for provided email" },
        { status: 404 },
      );
    }

    // 🔁 Prevent duplicate pending requests for same plan
    const existingReq = await query(
      `
      SELECT id FROM plan_requests 
      WHERE email = $1 
        AND plan_name = $2 
        AND status = 'Pending'
      `,
      [email, plan_name],
    );

    if (existingReq.rows.length > 0) {
      return NextResponse.json(
        { message: "You already have a pending request for this plan" },
        { status: 409 },
      );
    }

    // ✅ Insert new request (EMAIL IS NOW STORED)
    await query(
      `
      INSERT INTO plan_requests (user_name, email, plan_name, amount, status, created_at)
      VALUES ($1, $2, $3, $4, 'Pending', NOW())
      `,
      [user_name, email, plan_name, amount || null],
    );

    return NextResponse.json(
      { message: "Request created successfully" },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Create request error:", err);
    return NextResponse.json(
      { message: "Failed to create request", error: err.message },
      { status: 500 },
    );
  }
}
