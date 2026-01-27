// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

interface RequestBody {
  name: string;
  email: string;
  password: string;
  phone_no: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RequestBody>;
    const { name, phone_no, email, password } = body;

    if (!name || !phone_no || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query<{
      id: number;
      name: string;
      email: string;
      phone_no: string;
      created_at: string;
    }>(
      `
      INSERT INTO users (name, email,phone_no, password_hash)
      VALUES ($1, $2, $3,$4)
      RETURNING id, name,phone_no, email, created_at
      `,
      [name, email, phone_no, passwordHash]
    );

    const user = result.rows[0];

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_no: user.phone_no,
        createdAt: user.created_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { message: "Failed to register user" },
      { status: 500 }
    );
  }
}
