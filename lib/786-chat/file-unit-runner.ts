export type FileGenerationUnit = { name: string; files: readonly [string] }

export async function runFileGenerationUnits<Provider>(input: {
  units: readonly FileGenerationUnit[]
  providers: readonly Provider[]
  initialFiles?: Readonly<Record<string, string>>
  generate: (unit: FileGenerationUnit, provider: Provider, completedFiles: Readonly<Record<string, string>>) => Promise<string>
  onFailure?: (unit: FileGenerationUnit, provider: Provider, error: unknown) => void
}) {
  const completedFiles: Record<string, string> = { ...(input.initialFiles || {}) }

  for (const unit of input.units) {
    const target = unit.files[0]
    let completed = false
    let lastError: unknown

    for (const provider of input.providers) {
      try {
        const content = await input.generate(unit, provider, Object.freeze({ ...completedFiles }))
        if (!content?.trim()) throw new Error(`Generation unit ${unit.name} returned an empty file.`)
        completedFiles[target] = content
        completed = true
        break
      } catch (error) {
        lastError = error
        input.onFailure?.(unit, provider, error)
      }
    }

    if (!completed) {
      throw lastError instanceof Error
        ? lastError
        : new Error(`Generation unit ${unit.name} failed with all configured providers.`)
    }
  }

  return completedFiles
}
