import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireTenant } from "@/lib/server/tenant";
import { logAuditEvent } from "@/lib/server/audit";
import { z } from "zod";

const orderSchema = z.object({
  items: z.array(z.object({ productId: z.number(), quantity: z.number() })),
  total: z.number(),
});

export async function GET(req: NextRequest) {
  try {
    const companyId = requireTenant(req);
    const sql = neon(process.env.DATABASE_URL!);
    const orders = await sql`
      SELECT * FROM orders WHERE company_id = ${companyId}
    `;
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = requireTenant(req);
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      INSERT INTO orders (company_id, items, total)
      VALUES (${companyId}, ${JSON.stringify(parsed.data.items)}, ${parsed.data.total})
      RETURNING id
    `;
    await logAuditEvent({
      companyId,
      action: "CREATE",
      entityType: "order",
      entityId: result[0].id,
      metadata: { total: parsed.data.total },
    });
    return NextResponse.json({ order: { id: result[0].id } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
