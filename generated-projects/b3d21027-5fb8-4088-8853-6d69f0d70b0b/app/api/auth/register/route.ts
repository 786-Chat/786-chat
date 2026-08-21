import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { hash } from "bcryptjs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, password, companyId } = parsed.data;
    const sql = neon(process.env.DATABASE_URL!);
    const hashed = await hash(password, 10);
    const result = await sql`
      INSERT INTO users (email, password_hash, company_id)
      VALUES (${email}, ${hashed}, ${companyId})
      RETURNING id
    `;
    return NextResponse.json({ user: { id: result[0].id } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
