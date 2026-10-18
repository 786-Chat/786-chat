import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/server/tenant";

export async function GET(req: NextRequest) {
  const { companyId } = requireTenant(req);
  // In real app, aggregate from DB
  return NextResponse.json([
    { campaign: "Q1 Launch", conversions: 3, revenue: 15000 },
    { campaign: "Referral", conversions: 2, revenue: 10000 },
  ]);
}
