import { NextRequest, NextResponse } from "next/server";
import { requireTenant, requireCompany } from "@/lib/server/tenant";
import { activitySchema } from "@/lib/server/validation";

const activities: any[] = [];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId } = requireTenant(req);
  const activity = activities.find(a => a.id === params.id);
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, activity.company_id);
  return NextResponse.json(activity);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId, userId } = requireTenant(req);
  const activity = activities.find(a => a.id === params.id);
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, activity.company_id);
  const body = await req.json();
  const parsed = activitySchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  Object.assign(activity, parsed.data);
  // Audit log
  return NextResponse.json(activity);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { companyId, userId } = requireTenant(req);
  const index = activities.findIndex(a => a.id === params.id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireCompany(companyId, activities[index].company_id);
  activities.splice(index, 1);
  // Audit log
  return NextResponse.json({ success: true });
}
