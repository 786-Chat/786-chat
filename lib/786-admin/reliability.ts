export type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  timeoutMs?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  label = "operation",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const baseDelayMs = Math.max(10, options.baseDelayMs ?? 250)
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 4_000)
  const timeoutMs = Math.max(100, options.timeoutMs ?? 30_000)
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await withTimeout(operation(attempt), timeoutMs, `attempt ${attempt}`)
    } catch (error) {
      lastError = error
      const canRetry = attempt < attempts && (options.shouldRetry?.(error, attempt) ?? true)
      if (!canRetry) throw error
      const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
      const jitter = Math.floor(Math.random() * Math.max(1, exponential * 0.2))
      await sleep(exponential + jitter)
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Operation failed")
}

type CircuitState = {
  failures: number
  openedAt: number | null
}

const circuits = new Map<string, CircuitState>()

export async function withCircuitBreaker<T>(input: {
  key: string
  operation: () => Promise<T>
  failureThreshold?: number
  resetAfterMs?: number
}): Promise<T> {
  const failureThreshold = Math.max(1, input.failureThreshold ?? 5)
  const resetAfterMs = Math.max(1_000, input.resetAfterMs ?? 30_000)
  const state = circuits.get(input.key) ?? { failures: 0, openedAt: null }

  if (state.openedAt && Date.now() - state.openedAt < resetAfterMs) {
    throw new Error(`Circuit ${input.key} is temporarily open`)
  }
  if (state.openedAt) {
    state.openedAt = null
    state.failures = 0
  }

  try {
    const result = await input.operation()
    circuits.set(input.key, { failures: 0, openedAt: null })
    return result
  } catch (error) {
    state.failures += 1
    if (state.failures >= failureThreshold) state.openedAt = Date.now()
    circuits.set(input.key, state)
    throw error
  }
}
