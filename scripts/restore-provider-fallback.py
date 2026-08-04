from pathlib import Path

path = Path("lib/786-admin/codegen.ts")
text = path.read_text(encoding="utf-8")
old = '''  try {
    result = await run(picked.model)
  } catch (firstError) {
    if (!isStructuredOutputError(firstError)) throw firstError
    usedReason = `${picked.reason} The first DeepSeek structured response could not be parsed, so DeepSeek retried once with stricter output rules.`
    result = await run(usedModel, true)
  }
'''
new = '''  try {
    result = await run(picked.model)
  } catch (firstError) {
    if (isStructuredOutputError(firstError)) {
      usedReason = `${picked.reason} The first DeepSeek structured response could not be parsed, so DeepSeek retried once with stricter output rules.`
      result = await run(usedModel, true)
    } else {
      const geminiFallbackConfigured = Boolean(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
        process.env.GEMINI_API_KEY?.trim() ||
        gatewayConfigured(),
      )
      if (!geminiFallbackConfigured) throw firstError

      usedModel = BUILDER_MODELS["gemini-flash"]
      usedReason = `${picked.reason} DeepSeek was unavailable, so generation continued automatically with Gemini Flash.`
      try {
        result = await run(usedModel)
      } catch (geminiError) {
        if (!isStructuredOutputError(geminiError)) throw geminiError
        usedReason = `${usedReason} The first Gemini response could not be parsed, so Gemini retried once with stricter output rules.`
        result = await run(usedModel, true)
      }
    }
  }
'''
if old not in text:
    raise SystemExit("Expected DeepSeek-only catch block was not found")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
