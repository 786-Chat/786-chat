import { NextRequest, NextResponse } from "next/server";
import { requireTenant, requireCompany } from "@/lib/server/tenant";
import { customerSchema } from "@/lib/server/validation";

// In-memory store for demo (replace with Neon queries)
const customers: any[] = [];

export async function GET(req: NextRequest) {
  const { companyId } = requireTenant(req);
  const tenantCustomers = customers.filter(c => c.company_id === companyId);
  return NextResponse.json(tenantCustomers);
}

export async function POST(req: NextRequest) {
  const { companyId, userId } = requireTenant(req);
  const body = await req.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const customer = {
    id: crypto.randomUUID(),
    company_id: companyId,
    ...parsed.data,
    created_at: new Date().toISOString(),
  };
  customers.push(customer);
  // Audit log
  const audit = {
    id: crypto.randomUUID(),
    company_id: companyId,
    user_id: userId,
    action: "CREATE",
    entity: "customer",
    entity_id: customer.id,
    timestamp: new Date().toISOString(),
  };
  // In real DB, insert audit log
  return NextResponse.json(customer, { status: 201 });
}
