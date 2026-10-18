import { NextRequest, NextResponse } from "next/server";
import { requireTenant, requireCompany } from "@/lib/server/tenant";
import { opportunitySchema } from "@/lib/server/validation";

const opportunities: any[] = [];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId } = requireTenant(req);
  const opp = opportunities.find(o => o.id === params.id);
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, opp.company_id);
  return NextResponse.json(opp);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId, userId } = requireTenant(req);
  const opp = opportunities.find(o => o.id === params.id);
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, opp.company_id);
  const body = await req.json();
  const parsed = opportunitySchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  Object.assign(opp, parsed.data);
  // Audit log
  return NextResponse.json(opp);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId, userId } = requireTenant(req);
  const index = opportunities.findIndex(o => o.id === params.id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, opportunities[index].company_id);
  opportunities.splice(index, 1);
  // Audit log
  return NextResponse.json({ success: true });
}
