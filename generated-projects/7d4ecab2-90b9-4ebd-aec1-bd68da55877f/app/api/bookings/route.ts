import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/server/tenant";
import { bookingSchema } from "@/lib/server/validation";

export async function POST(req: NextRequest) {
  const { companyId, userId } = requireTenant(req);
  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  // In real app, create booking and update opportunity to closed_won
  // Audit log
  return NextResponse.json({ success: true, message: "Booking recorded" }, { status: 201 });
}
