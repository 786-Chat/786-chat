import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/server/tenant";

export async function GET(req: NextRequest) {
  const { companyId } = requireTenant(req);
  // In real app, query DB for counts
  return NextResponse.json({
    customers: 12,
    opportunities: 5,
    activities: 8,
    revenue: 25000,
    pendingFollowUps: 3,
  });
}
