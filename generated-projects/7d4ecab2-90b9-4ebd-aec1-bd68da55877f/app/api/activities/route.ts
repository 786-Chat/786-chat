import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/server/tenant";
import { activitySchema } from "@/lib/server/validation";

const activities: any[] = [];
const tasks: any[] = [];

export async function GET(req: NextRequest) {
  const { companyId } = requireTenant(req);
  const tenantActivities = activities.filter(a => a.company_id === companyId);
  return NextResponse.json(tenantActivities);
}

export async function POST(req: NextRequest) {
  const { companyId, userId } = requireTenant(req);
  const body = await req.json();
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const activity = {
    id: crypto.randomUUID(),
    company_id: companyId,
    ...parsed.data,
    completed: false,
    created_at: new Date().toISOString(),
  };
  activities.push(activity);

  // Create a follow-up task and notification if type is follow-up
  if (parsed.data.type === "follow-up") {
    const task = {
      id: crypto.randomUUID(),
      company_id: companyId,
      activity_id: activity.id,
      assigned_to: userId,
      status: "pending",
    };
    tasks.push(task);
    // In a real app, send notification (e.g., email, push) here
  }

  // Audit log
  const audit = {
    id: crypto.randomUUID(),
    company_id: companyId,
    user_id: userId,
    action: "CREATE",
    entity: "activity",
    entity_id: activity.id,
    timestamp: new Date().toISOString(),
  };
  // In real DB, insert audit log

  return NextResponse.json(activity, { status: 201 });
}
