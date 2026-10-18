import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/server/tenant";
import { opportunitySchema } from "@/lib/server/validation";

const opportunities: any[] = [];

export async function GET(req: NextRequest) {
  const { companyId } = requireTenant(req);
  const tenantOpps = opportunities.filter(o => o.company_id === companyId);
  return NextResponse.json(tenantOpps);
}

export async function POST(req: NextRequest) {
  const { companyId, userId } = requireTenant(req);
  const body = await req.json();
  const parsed = opportunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const opp = {
    id: crypto.randomUUID(),
    company_id: companyId,
    ...parsed.data,
    created_at: new Date().toISOString(),
  };
  opportunities.push(opp);
  // Audit log
  return NextResponse.json(opp, { status: 201 });
}
