import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch Income Stats (Traffic Data)
    const incomeRes = await query(`
  SELECT 
    month_name AS name,
    income_amount AS income
  FROM income_stats
  WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
  ORDER BY id ASC
`);

    // 2. Fetch Recent Plan Requests
    // 2. Fetch Recent Plan Requests (INCLUDE EMAIL)
    const requestsRes = await query(`
  SELECT 
    pr.id,
    pr.user_name AS user,
    pr.email,                           
    pr.plan_name AS plan,
    pr.amount,
    to_char(pr.created_at, 'YYYY-MM-DD') AS date,
    pr.status,
    u.phone_no
  FROM plan_requests pr
  LEFT JOIN users u ON pr.email = u.email
  ORDER BY pr.created_at DESC
  LIMIT 5
`);

    // 3. Fetch Recent Users
    const usersRes = await query(`
        SELECT id, name, email, phone_no, role 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
    `);

    // 4. Calculate Aggregate Stats
    const totalRevenueRes = await query(
      "SELECT SUM(income_amount) as total FROM income_stats",
    );
    const totalUsersRes = await query("SELECT COUNT(*) as count FROM users");
    const totalRequestsRes = await query(
      "SELECT COUNT(*) as count FROM plan_requests",
    );
    // For "Active Now" we can simulate or query recent logins if we had that, I'll just keep it somewhat static or derived for now,
    // but let's make it look dynamic based on user count if possible, or just fetch count.

    // Formatting currency
    const totalRevenue = parseFloat(
      totalRevenueRes.rows[0].total || "0",
    ).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

    const stats = {
      trafficData: incomeRes.rows,
      recentRequests: requestsRes.rows,
      recentUsers: usersRes.rows,
      aggregates: {
        revenue: totalRevenue,
        users: totalUsersRes.rows[0].count,
        requests: totalRequestsRes.rows[0].count,
        activeNow: Math.floor(Math.random() * 50) + 10, // Mock active users for now
      },
    };

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("Dashboard Stats error:", err);
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats", error: err.message },
      { status: 500 },
    );
  }
}
