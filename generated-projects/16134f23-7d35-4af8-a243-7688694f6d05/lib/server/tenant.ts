import 'server-only';

export function assertTenant(companyId: string | null | undefined) {
  if (!companyId) {
    throw new Error('Forbidden: missing companyId');
  }
  return companyId;
}
