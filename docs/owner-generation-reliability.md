# Owner generation reliability

For long owner full-stack generations, providers can hit output truncation or return no structured output. The generator must retry with a compact project prompt before failing over to the other Flash provider. Gemini is intentionally parsed from plain JSON text rather than requiring provider-native structured-output mode, because some gateway/model combinations can return `No output generated` while a normal text response is available.

Production deployment must include this provider retry path before owner generation is considered ready.
