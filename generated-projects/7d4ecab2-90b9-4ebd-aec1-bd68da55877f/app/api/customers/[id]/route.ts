import { NextRequest, NextResponse } from "next/server";
import { requireTenant, requireCompany } from "@/lib/server/tenant";
import { customerSchema } from "@/lib/server/validation";

// In-memory store (same as collection)
const customers: any[] = [];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId } = requireTenant(req);
  const customer = customers.find(c => c.id === params.id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, customer.company_id);
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId, userId } = requireTenant(req);
  const customer = customers.find(c => c.id === params.id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, customer.company_id);
  const body = await req.json();
  const parsed = customerSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  Object.assign(customer, parsed.data);
  // Audit log
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId, userId } = requireTenant(req);
  const index = customers.findIndex(c => c.id === params.id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, customers[index].company_id);
  customers.splice(index, 1);
  // Audit log
  return NextResponse.json({ success: true });
}
