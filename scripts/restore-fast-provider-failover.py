from pathlib import Path

# This script is intentionally run by the repair workflow after every change.
path = Path('lib/786-chat/provider-controller.ts')
source = path.read_text()
source = source.replace('const PRIMARY_ATTEMPT_TIMEOUT_MS = 170_000', 'const DEEPSEEK_ATTEMPT_TIMEOUT_MS = 45_000\nconst GEMINI_ATTEMPT_TIMEOUT_MS = 75_000')
source = source.replace('function attemptTimeout() {\n  return PRIMARY_ATTEMPT_TIMEOUT_MS\n}', 'function attemptTimeout(mode: CodegenMode) {\n  return providerForMode(mode) === "deepseek"\n    ? DEEPSEEK_ATTEMPT_TIMEOUT_MS\n    : GEMINI_ATTEMPT_TIMEOUT_MS\n}')
source = source.replace('''  // DeepSeek owns all text/code generation. When attachments exist, codegen\n  // performs a short Gemini analysis first and passes that text to DeepSeek.\n  // Do not fall back to Gemini for text generation.\n  const primaryMode: CodegenMode = requestedMode === "deepseek-pro" ? "deepseek-pro" : "deepseek-flash"\n  const candidateModes: CodegenMode[] = [primaryMode]''', '''  // DeepSeek is primary for text/code generation, but Gemini Flash must be a\n  // real fallback so a timeout, truncated JSON response, quota error or other\n  // provider failure cannot leave the customer waiting without a project.\n  const primaryMode: CodegenMode = requestedMode === "gemini-pro"\n    ? "gemini-pro"\n    : requestedMode === "gemini-flash"\n      ? "gemini-flash"\n      : requestedMode === "deepseek-pro"\n        ? "deepseek-pro"\n        : "deepseek-flash"\n  const fallbackMode: CodegenMode = providerForMode(primaryMode) === "deepseek" ? "gemini-flash" : "deepseek-flash"\n  const candidateModes: CodegenMode[] = [primaryMode, fallbackMode]''')
source = source.replace('''  // Run the one direct DeepSeek generation attempt. Gemini image analysis is\n  // performed inside codegen only when the request contains attachments.''', '''  // Try providers sequentially with bounded time budgets. Truncated JSON is a\n  // normal provider failure and must immediately continue to the fallback.''')
source = source.replace('runAttempt(request, payload, mode, compact, attemptTimeout())', 'runAttempt(request, payload, mode, compact, attemptTimeout(mode))')
required = [
    'const DEEPSEEK_ATTEMPT_TIMEOUT_MS = 45_000',
    'const candidateModes: CodegenMode[] = [primaryMode, fallbackMode]',
    'attemptTimeout(mode)',
]
for marker in required:
    if marker not in source:
        raise SystemExit(f'repair marker missing: {marker}')
path.write_text(source)
