import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireTenant } from "@/lib/server/tenant";
import { logAuditEvent } from "@/lib/server/audit";
import { z } from "zod";

const updateSchema = z.object({
  status: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = requireTenant(req);
    const sql = neon(process.env.DATABASE_URL!);
    const orders = await sql`
      SELECT * FROM orders WHERE id = ${params.id} AND company_id = ${companyId}
    `;
    if (orders.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ order: orders[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = requireTenant(req);
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      UPDATE orders SET status = ${parsed.data.status} WHERE id = ${params.id} AND company_id = ${companyId}
      RETURNING id
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await logAuditEvent({
      companyId,
      action: "UPDATE",
      entityType: "order",
      entityId: params.id,
      metadata: { status: parsed.data.status },
    });
    return NextResponse.json({ order: { id: result[0].id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = requireTenant(req);
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      DELETE FROM orders WHERE id = ${params.id} AND company_id = ${companyId}
      RETURNING id
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await logAuditEvent({
      companyId,
      action: "DELETE",
      entityType: "order",
      entityId: params.id,
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
