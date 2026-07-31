export type SystemAcceptanceContract = {
  entities: readonly string[]
  apiResources: readonly string[]
  workflows: readonly string[]
  tenantScoped: boolean
  platforms: readonly string[]
}

export type SystemAcceptanceResult = {
  valid: boolean
  errors: string[]
  checks: {
    schemaEntities: boolean
    tenantSchema: boolean
    crudContracts: boolean
    tenantApis: boolean
    validatedMutations: boolean
    auditedMutations: boolean
    mobileContract: boolean
  }
}

function normalizedIdentifier(value: string) {
  return value.toLowerCase().replace(/-/g, "_")
}

function source(files: Record<string, string>) {
  return Object.values(files).join("\n")
}

export function assessGeneratedSystem(
  contract: SystemAcceptanceContract,
  files: Record<string, string>,
): SystemAcceptanceResult {
  const errors: string[] = []
  const schema = files["sql/schema.sql"] || ""
  const combined = source(files)
  const missingEntities = contract.entities.filter((entity) => {
    const name = normalizedIdentifier(entity)
    return !new RegExp(`CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+(?:public\\.)?["']?${name}["']?\\b`, "i").test(schema)
  })
  if (missingEntities.length) {
    errors.push(`Database schema is missing entities: ${missingEntities.join(", ")}`)
  }

  const tenantSchema = !contract.tenantScoped || (
    /\bcompany_id\b/i.test(schema) &&
    /\bcompany_id\b[\s\S]{0,180}\bREFERENCES\b[\s\S]{0,80}\bcompanies\b/i.test(schema) &&
    /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b[\s\S]{0,200}\bcompany_id\b/i.test(schema)
  )
  if (!tenantSchema) {
    errors.push("Tenant schema must reference companies and index company_id.")
  }

  let crudContracts = true
  let tenantApis = true
  let validatedMutations = true
  let auditedMutations = true
  for (const resource of contract.apiResources) {
    const collection = files[`app/api/${resource}/route.ts`] || ""
    const item = files[`app/api/${resource}/[id]/route.ts`] || ""
    if (!/function\s+GET\b/.test(collection) ||
        !/function\s+POST\b/.test(collection) ||
        !/function\s+GET\b/.test(item) ||
        !/function\s+PATCH\b/.test(item) ||
        !/function\s+DELETE\b/.test(item)) {
      crudContracts = false
      errors.push(`CRUD contract is incomplete: ${resource}`)
    }
    const hasTenantScope = (value: string) =>
      /company[_-]?id/i.test(value) &&
      /requireTenant|requireCompany|tenantGuard|assertTenant|company_id\s*=/i.test(value)
    if (contract.tenantScoped &&
        (!hasTenantScope(collection) || !hasTenantScope(item))) {
      tenantApis = false
      errors.push(`API does not enforce tenant ownership: ${resource}`)
    }
    const validates = /safeParse|\.parse\(|validate[A-Z_(]/
    if (!validates.test(collection) || !validates.test(item)) {
      validatedMutations = false
      errors.push(`API mutations do not validate input: ${resource}`)
    }
    const audits = /audit|recordActivity|activityLog|event_log/i
    if (!audits.test(collection) || !audits.test(item)) {
      auditedMutations = false
      errors.push(`API mutations do not record an audit event: ${resource}`)
    }
  }

  const mobileContract = !contract.platforms.includes("mobile") || (
    Boolean(files["mobile/app/index.tsx"]) &&
    Boolean(files["mobile/services/api.ts"]) &&
    /token|authorization|bearer/i.test(files["mobile/services/api.ts"] || "") &&
    !/localhost|127\.0\.0\.1/i.test(files["mobile/services/api.ts"] || "")
  )
  if (!mobileContract) {
    errors.push("Mobile API client must use external configuration and authenticated requests.")
  }

  if (contract.workflows.length && !/workflow|status|transition|transaction/i.test(combined)) {
    errors.push("Operational workflows have no implemented state transition evidence.")
  }

  return {
    valid: errors.length === 0,
    errors,
    checks: {
      schemaEntities: missingEntities.length === 0,
      tenantSchema,
      crudContracts,
      tenantApis,
      validatedMutations,
      auditedMutations,
      mobileContract,
    },
  }
}
