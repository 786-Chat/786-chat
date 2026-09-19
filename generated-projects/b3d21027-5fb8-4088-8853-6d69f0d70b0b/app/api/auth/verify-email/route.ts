import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, code } = parsed.data;
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT id FROM users WHERE email = ${email} AND verification_code = ${code}
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    await sql`
      UPDATE users SET email_verified = true WHERE email = ${email}
    `;
    return NextResponse.json({ message: "Email verified." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
