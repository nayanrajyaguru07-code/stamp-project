// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "@/lib/db";

interface LoginBody {
  email: string;
  password: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<LoginBody>;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 🔐 SPECIAL ADMIN LOGIN
    if (email === "admin" && password === "admin") {
      const adminToken = jwt.sign(
        {
          sub: "admin",
          email: "admin",
          name: "Admin",
          role: "admin",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = NextResponse.json({
        token: adminToken,
        user: {
          id: "admin",
          name: "Admin",
          email: "admin",
          role: "admin",
        },
      });

      // 🍪 Store token in cookie (7 days)
      res.cookies.set("adminAccessToken", adminToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      });

      return res;
    }

    // -------------------------
    // NORMAL USER LOGIN FLOW
    // -------------------------

    const result = await query<{
      id: number;
      name: string;
      email: string;
      password_hash: string;
      phone_no: string | null;
      credits: number | null;
    }>(
      `
      SELECT id, name, email, password_hash, phone_no, credits
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_no: user.phone_no,
        credits: user.credits || 0,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Failed to login" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({});

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userRes = await query(
      "SELECT id, name, email, phone_no, credits FROM users WHERE id=$1",
      [(decoded as any).sub]
    );

    const user = userRes.rows[0];
    if (user) {
      return NextResponse.json({
        user: { ...user, credits: user.credits || 0 },
      });
    }
    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!);

    const body = await req.json();
    const { name, password } = body;

    let passwordHash = null;
    if (password) passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `
      UPDATE users 
      SET name = COALESCE($1, name),
          password_hash = COALESCE($2, password_hash)
      WHERE id = $3
      RETURNING id, name, email,phone_no
      `,
      [name ?? null, passwordHash, (decoded as any).sub]
    );

    return NextResponse.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const decoded = jwt.verify(token!, process.env.JWT_SECRET!);

  await query("DELETE FROM users WHERE id=$1", [(decoded as any).sub]);

  return NextResponse.json({ success: true });
}
