import { jsonError } from './response';

export function requireTenant(companyId: string | null | undefined) {
  if (!companyId) {
    return jsonError('Missing companyId', 403);
  }
  return null;
}
