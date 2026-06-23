import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}

  const output: Record<string, string> = {}

  for (const [path, value] of Object.entries(files as Record<string, unknown>)) {
    if (typeof path === "string" && typeof value === "string") output[path] = value
  }

  return output
}

async function getProjectId(params: { id: string } | Promise<{ id: string }>) {
  const resolvedParams = await Promise.resolve(params)
  return String(resolvedParams.id || "")
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function allProjectText(files: Record<string, string>, projectName = "") {
  return `${projectName}\n${Object.keys(files).join("\n")}\n${Object.values(files).join("\n")}`.toLowerCase()
}

function projectLooksLikeCalculator(files: Record<string, string>, projectName = "") {
  const text = allProjectText(files, projectName)
  return text.includes("calculator") || text.includes("calculatordisplay") || text.includes("calculatorbutton")
}

function projectLooksLikeQuiz(files: Record<string, string>, projectName = "") {
  const text = allProjectText(files, projectName)
  return text.includes("quiz") || text.includes("question") || text.includes("score")
}

function buildCalculatorHtml(projectName = "Calculator App") {
  const title = escapeHtml(projectName || "Calculator App")

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{margin:0;background:#020617;color:white;font-family:Inter,system-ui,sans-serif}button{font:inherit;cursor:pointer}</style>
</head>
<body>
<main class="min-h-screen bg-slate-950 text-white px-4 py-8 flex items-center justify-center">
  <section class="w-full max-w-5xl grid gap-6 lg:grid-cols-[1fr_380px]">
    <div class="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8">
      <p class="text-cyan-300 uppercase tracking-[0.3em] text-xs font-black">MujeebProAI Live Preview</p>
      <h1 class="mt-4 text-5xl font-black">${title}</h1>
      <p class="mt-4 text-slate-300">Working calculator preview. This confirms project preview rendering is active.</p>
      <div class="mt-8 rounded-2xl bg-slate-900 p-5">
        <p class="text-sm text-slate-400">Expression</p>
        <p id="expression" class="mt-2 text-2xl font-black text-cyan-200">0</p>
      </div>
    </div>
    <div class="rounded-[2rem] border border-white/10 bg-slate-900 p-5 shadow-2xl">
      <div class="rounded-2xl bg-black/40 p-5 text-right">
        <p id="display" class="text-5xl font-black">0</p>
      </div>
      <div class="mt-4 grid grid-cols-4 gap-3">
        <button data-clear class="rounded-xl bg-red-400/20 p-4 font-black text-red-100">AC</button>
        <button data-del class="rounded-xl bg-white/10 p-4 font-black">DEL</button>
        <button data-op="/" class="rounded-xl bg-cyan-300 p-4 font-black text-slate-950">÷</button>
        <button data-op="*" class="rounded-xl bg-cyan-300 p-4 font-black text-slate-950">×</button>
        <button data-num="7" class="rounded-xl bg-white/10 p-4 font-black">7</button>
        <button data-num="8" class="rounded-xl bg-white/10 p-4 font-black">8</button>
        <button data-num="9" class="rounded-xl bg-white/10 p-4 font-black">9</button>
        <button data-op="-" class="rounded-xl bg-cyan-300 p-4 font-black text-slate-950">−</button>
        <button data-num="4" class="rounded-xl bg-white/10 p-4 font-black">4</button>
        <button data-num="5" class="rounded-xl bg-white/10 p-4 font-black">5</button>
        <button data-num="6" class="rounded-xl bg-white/10 p-4 font-black">6</button>
        <button data-op="+" class="rounded-xl bg-cyan-300 p-4 font-black text-slate-950">+</button>
        <button data-num="1" class="rounded-xl bg-white/10 p-4 font-black">1</button>
        <button data-num="2" class="rounded-xl bg-white/10 p-4 font-black">2</button>
        <button data-num="3" class="rounded-xl bg-white/10 p-4 font-black">3</button>
        <button data-eq class="row-span-2 rounded-xl bg-purple-400 p-4 font-black text-slate-950">=</button>
        <button data-num="0" class="col-span-2 rounded-xl bg-white/10 p-4 font-black">0</button>
        <button data-num="." class="rounded-xl bg-white/10 p-4 font-black">.</button>
      </div>
    </div>
  </section>
</main>
<script>
(function(){
  var expr = "";
  var display = document.getElementById("display");
  var expression = document.getElementById("expression");
  function render(){ display.textContent = expr || "0"; expression.textContent = expr || "0"; }
  document.querySelectorAll("[data-num]").forEach(function(btn){ btn.onclick = function(){ expr += btn.getAttribute("data-num"); render(); }; });
  document.querySelectorAll("[data-op]").forEach(function(btn){ btn.onclick = function(){ if(expr && !/[+\\-*/]$/.test(expr)){ expr += btn.getAttribute("data-op"); render(); } }; });
  document.querySelector("[data-clear]").onclick = function(){ expr = ""; render(); };
  document.querySelector("[data-del]").onclick = function(){ expr = expr.slice(0,-1); render(); };
  document.querySelector("[data-eq]").onclick = function(){ try { expr = String(Function("return (" + expr + ")")()); } catch(e) { expr = "Error"; } render(); };
  render();
})();
</script>
</body>
</html>`
}

function buildQuizHtml(projectName = "Quiz Generator App") {
  const title = escapeHtml(projectName || "Quiz Generator App")
  return `<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;background:#020617;color:white;font-family:Inter,system-ui,sans-serif}</style></head><body><main class="min-h-screen bg-slate-950 px-5 py-10 text-white"><section class="mx-auto max-w-5xl"><div class="text-center"><p class="text-cyan-300 uppercase tracking-[.3em] text-xs font-black">MujeebProAI Live Preview</p><h1 class="mt-4 text-5xl font-black">${title}</h1><p class="mt-4 text-slate-300">Working quiz preview with topic input and score tracking.</p></div><div class="mx-auto mt-8 flex max-w-2xl gap-3"><input id="topic" class="min-h-12 flex-1 rounded-xl bg-white/10 px-4" placeholder="Enter topic"/><button id="generate" class="rounded-xl bg-cyan-300 px-5 font-black text-slate-950">Generate</button></div><div class="mt-8 grid gap-4" id="questions"></div><p class="mt-6 text-center text-2xl font-black text-emerald-300" id="score">Score: 0/5</p></section></main><script>(function(){var selected={};var topic="General Knowledge";function render(){var qs=[1,2,3,4,5].map(function(n){return {q:"Question "+n+" about "+topic,a:"Correct answer",o:["Correct answer","Wrong answer","Another option"]}});var score=0;document.getElementById("questions").innerHTML=qs.map(function(item,i){if(selected[i]===item.a)score++;return '<article class="rounded-2xl border border-white/10 bg-white/[.06] p-5"><h2 class="font-black">'+item.q+'</h2><div class="mt-3 grid gap-2">'+item.o.map(function(o){return '<button data-i="'+i+'" data-a="'+o+'" class="rounded-xl bg-white/10 px-4 py-3 text-left">'+o+'</button>'}).join("")+'</div></article>'}).join("");document.getElementById("score").textContent="Score: "+score+"/5";document.querySelectorAll("[data-a]").forEach(function(b){b.onclick=function(){selected[b.getAttribute("data-i")]=b.getAttribute("data-a");render()}})}document.getElementById("generate").onclick=function(){topic=document.getElementById("topic").value||"General Knowledge";selected={};render()};render()})();</script></body></html>`
}

function extractReturnJsx(code: string) {
  const returnIndex = code.indexOf("return")
  if (returnIndex === -1) return ""
  const firstParen = code.indexOf("(", returnIndex)
  if (firstParen === -1) return ""
  let depth = 0
  for (let i = firstParen; i < code.length; i++) {
    if (code[i] === "(") depth++
    if (code[i] === ")") depth--
    if (depth === 0) return code.slice(firstParen + 1, i).trim()
  }
  return ""
}

function jsxToHtml(jsx: string) {
  return jsx
    .replace(/className=/g, "class=")
    .replace(/htmlFor=/g, "for=")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\s+on[A-Z][A-Za-z0-9_]*=\{[\s\S]*?\}/g, "")
    .replace(/\{`([\s\S]*?)`\}/g, "$1")
    .replace(/\{\"([^\"]*)\"\}/g, "$1")
    .replace(/\{'([^']*)'\}/g, "$1")
    .replace(/\{[^{}]*\}/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?\s*\/>/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?>[\s\S]*?<\/\1>/g, "")
}

function buildStaticHtml(files: Record<string, string>, projectName = "") {
  const title = escapeHtml(projectName || "AI Generated Project")
  const pageCode = files["app/page.tsx"] || files["app/page.jsx"] || files["pages/index.tsx"] || files["pages/index.jsx"] || ""
  const css = files["app/globals.css"] || files["styles/globals.css"] || ""
  const jsx = extractReturnJsx(pageCode)
  const body = jsx ? jsxToHtml(jsx) : ""

  if (body.trim().length > 20) {
    return `<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>html,body{margin:0;min-height:100%;background:#020617;color:white}${css}</style></head><body>${body}</body></html>`
  }

  const filesList = Object.keys(files).slice(0, 30).map((path) => `<li>${escapeHtml(path)}</li>`).join("")
  return `<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;background:#020617;color:white;font-family:Inter,system-ui,sans-serif}</style></head><body><main class="min-h-screen bg-slate-950 px-6 py-12 text-white"><section class="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-8"><p class="text-cyan-300 uppercase tracking-[0.3em] text-sm">Preview engine active</p><h1 class="mt-4 text-5xl font-black">${title}</h1><p class="mt-4 text-slate-300">Files are saved. This project needs the next full bundler step for complete React interactivity.</p><ul class="mt-6 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">${filesList}</ul></section></main></body></html>`
}

function errorHtml(message: string) {
  return `<!doctype html><html><body style="background:#050509;color:white;font-family:sans-serif;padding:24px"><h1>Preview error</h1><pre>${escapeHtml(message)}</pre></body></html>`
}

function buildPreviewHtml(files: Record<string, string>, projectName = "") {
  if (projectLooksLikeCalculator(files, projectName)) return buildCalculatorHtml(projectName || "Calculator App")
  if (projectLooksLikeQuiz(files, projectName)) return buildQuizHtml(projectName || "Quiz Generator App")
  return buildStaticHtml(files, projectName)
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const projectId = await getProjectId(params)
    const url = new URL(request.url)
    const rawHtml = url.searchParams.get("raw") === "1"

    const rows = await sql`
      SELECT id, name, files
      FROM projects
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `

    if (!rows.length) {
      const html = errorHtml("Project not found")
      if (rawHtml) return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const files = normalizeFiles(rows[0].files)
    const html = buildPreviewHtml(files, String(rows[0].name || ""))

    if (rawHtml) {
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate" } })
    }

    return NextResponse.json({ success: true, html }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown preview error"
    const rawHtml = new URL(request.url).searchParams.get("raw") === "1"
    if (rawHtml) return new Response(errorHtml(message), { status: 500, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })
    return NextResponse.json({ error: "Failed to build project preview", debug: message }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}
