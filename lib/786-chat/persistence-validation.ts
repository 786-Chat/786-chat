import type { ProjectSpecification } from "./specification"
import { validateGeneratedProject, type ProjectValidation } from "./validation"

export function validatePersistedGeneration(
  metadata: Record<string, unknown>,
  files: Record<string, string>,
): ProjectValidation | null {
  const candidate = metadata.specification
  if (!candidate || typeof candidate !== "object") return null

  const specification = candidate as Partial<ProjectSpecification>
  if (
    !Array.isArray(specification.routes) ||
    !specification.routes.every((route) => typeof route === "string") ||
    !Array.isArray(specification.requiredComponents) ||
    !specification.requiredComponents.every((component) => typeof component === "string")
  ) {
    return {
      valid: false,
      errors: ["Stored project specification is invalid."],
      warnings: [],
    }
  }

  return validateGeneratedProject(
    specification as ProjectSpecification,
    files,
  )
}
