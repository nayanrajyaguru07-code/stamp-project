import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const PLAN_CREDITS: Record<string, number> = {
  "Basic Pack": 10,
  "Starter Pack": 50,
  "Advanced ": 100,
  "Pro – Annual": 10000,
  "Business – Annual": 10000,
};

const PLAN_PRICES: Record<string, number> = {
  "Basic Pack": 100,
  "Starter Pack": 500,
  "Advanced ": 700,
  "Pro – Annual": 1000,
  "Business – Annual": 2500,
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status, email } = await req.json();

    if (!["Accepted", "Denied"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    await query("BEGIN");

    // 1️⃣ Get request
    const requestRes = await query(
      "SELECT * FROM plan_requests WHERE id = $1",
      [id],
    );

    if (requestRes.rowCount === 0) {
      await query("ROLLBACK");
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    const request = requestRes.rows[0];

    // 2️⃣ Update request status
    await query("UPDATE plan_requests SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);

    if (status === "Accepted") {
      const creditsToAdd = PLAN_CREDITS[request.plan_name] ?? 10;
      const revenueToAdd = PLAN_PRICES[request.plan_name] ?? 0;

      // 3️⃣ Find user by EMAIL (safe + unique)
      const userRes = await query("SELECT id FROM users WHERE email = $1", [
        email,
      ]);

      if (userRes.rowCount === 0) {
        throw new Error(`User not found with email: ${email}`);
      }

      const userId = userRes.rows[0].id;

      // 4️⃣ Add credits
      await query(
        "UPDATE users SET credits = COALESCE(credits, 0) + $1 WHERE id = $2",
        [creditsToAdd, userId],
      );

      // 5️⃣ Add income (auto month + year)
      const now = new Date();
      const monthName = now.toLocaleString("en-US", { month: "short" });
      const year = now.getFullYear();

      await query(
        `
        INSERT INTO income_stats (month_name, income_amount , year)
        VALUES ($1, $2, $3)
        ON CONFLICT (month_name, year)
        DO UPDATE SET income_amount = income_stats.income_amount + EXCLUDED.income_amount
        `,
        [monthName, revenueToAdd, year],
      );
    }

    await query("COMMIT");

    return NextResponse.json({ message: `Request ${status}` });
  } catch (err: any) {
    await query("ROLLBACK");
    console.error("Update request error:", err);
    return NextResponse.json(
      { message: "Failed to update request", error: err.message },
      { status: 500 },
    );
  }
}
