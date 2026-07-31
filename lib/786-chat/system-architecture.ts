import type { ProjectSpecification } from "./specification"

export type ModuleDependency = {
  module: string
  dependsOn: string[]
}

export type SystemArchitecturePlan = {
  applicationType: ProjectSpecification["projectType"]
  platforms: ProjectSpecification["platforms"]
  moduleGraph: ModuleDependency[]
  databaseTables: string[]
  apiContracts: Array<{
    resource: string
    collectionMethods: ["GET", "POST"]
    itemMethods: ["GET", "PATCH", "DELETE"]
  }>
  roles: string[]
  tenantIsolation: boolean
  migrationsRequired: boolean
}

export function createSystemArchitecturePlan(
  specification: ProjectSpecification,
): SystemArchitecturePlan {
  const blueprint = specification.systemBlueprint
  const modules = blueprint?.modules || []
  return {
    applicationType: specification.projectType,
    platforms: specification.platforms,
    moduleGraph: modules.map((module, index) => ({
      module,
      dependsOn: index === 0 ? [] : [modules[0]],
    })),
    databaseTables: blueprint?.entities || [],
    apiContracts: (blueprint?.apiResources || []).map((resource) => ({
      resource,
      collectionMethods: ["GET", "POST"],
      itemMethods: ["GET", "PATCH", "DELETE"],
    })),
    roles: blueprint?.roles || [],
    tenantIsolation: Boolean(blueprint?.tenantScoped),
    migrationsRequired: specification.platforms.includes("database"),
  }
}

export function systemArchitectureBrief(
  specification: ProjectSpecification,
): string[] {
  const plan = createSystemArchitecturePlan(specification)
  return [
    `Application type: ${plan.applicationType}`,
    `Required platforms: ${plan.platforms.join(", ")}`,
    `Module dependency graph: ${plan.moduleGraph.map((item) =>
      `${item.module}->${item.dependsOn.join("+") || "root"}`
    ).join(", ") || "none"}`,
    `Database tables: ${plan.databaseTables.join(", ") || "none"}`,
    `API contracts: ${plan.apiContracts.map((item) =>
      `${item.resource}[${item.collectionMethods.join("/")};${item.itemMethods.join("/")}]`
    ).join(", ") || "none"}`,
    `Authorization roles: ${plan.roles.join(", ") || "none"}`,
    plan.tenantIsolation
      ? "Tenant isolation: mandatory company ownership checks in every server query and mutation"
      : "Tenant isolation: not requested",
    plan.migrationsRequired
      ? "Database migration: emit Neon/PostgreSQL SQL with keys, foreign keys, tenant indexes, timestamps and audit storage"
      : "Database migration: not requested",
  ]
}
