import { NextRequest } from "next/server";

export function requireTenant(req: NextRequest): { companyId: string; userId: string; role: string } {
  // In production, this would verify JWT and extract company_id.
  // For demo, we use a fixed tenant.
  const companyId = req.headers.get("x-company-id") || "demo-company";
  const userId = req.headers.get("x-user-id") || "demo-user";
  const role = req.headers.get("x-role") || "company-owner";
  return { companyId, userId, role };
}

export function requireCompany(companyId: string, recordCompanyId: string) {
  if (companyId !== recordCompanyId) {
    throw new Error("Forbidden: tenant mismatch");
  }
}

export function tenantGuard(companyId: string, recordCompanyId: string) {
  if (companyId !== recordCompanyId) {
    throw new Error("Unauthorized");
  }
}

export function assertTenant(companyId: string, recordCompanyId: string) {
  if (companyId !== recordCompanyId) {
    throw new Error("Unauthorized");
  }
}
