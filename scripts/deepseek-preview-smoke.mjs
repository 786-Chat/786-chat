// One-shot, read-only diagnostic. NEVER publish this script in production.
import { parseProviderJson, normalizeExistingProjectJson } from "../lib/786-chat/provider-json-recovery.js";

if (process.env.VERCEL_ENV !== "preview") {
  console.log("DEEPSEEK_SMOKE skipped outside Vercel preview");
  process.exit(0);
}
if (!process.env.DEEPSEEK_API_KEY) {
  console.error("DEEPSEEK_SMOKE failed: missing preview API configuration");
  process.exit(1);
}

const existing = { title: "Smoke test", description: "Isolated diagnostic" };
const request = {
  model: "deepseek-v4-flash",
  messages: [
    { role: "system", content: 'Return exactly one complete JSON object: {"title":"Smoke test","description":"Isolated diagnostic","reply":"Done","files":[{"path":"app/page.tsx","content":"export default function Page() { return <main>OK</main> }"}]}. No markdown. Do not use extra fields.' },
    { role: "user", content: 'For this safe diagnostic, return exactly the specified JSON object, with one complete file. This test does not edit any website.' },
  ],
  response_format: { type: "json_object" },
  thinking: { type: "disabled" },
  temperature: 0,
  max_tokens: 650,
  stream: false,
};
try {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(25000),
  });
  // Never print provider response bodies, tokens or keys in diagnostic logs.
  if (!res.ok) {
    console.error("DEEPSEEK_SMOKE HTTP status=" + res.status);
    process.exit(2);
  }
  const payload = await res.json();
  const choice = payload?.choices?.[0];
  const content = choice?.message?.content || "";
  const parsed = normalizeExistingProjectJson(parseProviderJson(content), existing);
  const ok = choice?.finish_reason === "stop" &&
    Array.isArray(parsed.files) &&
    parsed.files.length === 1 &&
    parsed.files[0]?.path === "app/page.tsx" &&
    typeof parsed.files[0]?.content === "string" &&
    parsed.files[0].content.includes("export default");
  console.log("DEEPSEEK_SMOKE " + JSON.stringify({
    http: res.status,
    model: payload.model,
    finishReason: choice?.finish_reason,
    schemaValid: ok,
    files: parsed.files?.length || 0,
    tokens: payload.usage?.total_tokens || 0,
  }));
  if (!ok) process.exit(3);
} catch (error) {
  console.error("DEEPSEEK_SMOKE failed: " + (error instanceof Error ? error.name : "UnexpectedError"));
  process.exit(4);
}
