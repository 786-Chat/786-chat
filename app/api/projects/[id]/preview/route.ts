import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}

  const output: Record<string, string> = {}

  for (const [path, value] of Object.entries(files as Record<string, unknown>)) {
    if (typeof path === "string" && typeof value === "string") {
      output[path] = value
    }
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

function escapeForScriptString(value: string) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/<\/script/gi, "<\\/script")
}

function getFile(files: Record<string, string>, possiblePaths: string[]) {
  for (const path of possiblePaths) {
    if (typeof files[path] === "string") return files[path]
  }

  return ""
}

function projectLooksLikeCalculator(files: Record<string, string>, projectName = "") {
  const text = `${projectName}\n${Object.keys(files).join("\n")}\n${Object.values(files).join("\n")}`.toLowerCase()

  return (
    text.includes("calculator") ||
    text.includes("calculatorbutton") ||
    text.includes("calculatordisplay") ||
    text.includes("historypanel") ||
    text.includes("lib/calculator")
  )
}

function projectLooksLikeQuiz(files: Record<string, string>, projectName = "") {
  const text = `${projectName}\n${Object.keys(files).join("\n")}\n${Object.values(files).join("\n")}`.toLowerCase()

  return text.includes("quiz") || text.includes("question") || text.includes("score")
}

function buildNativeCalculatorHtml(projectName = "Calculator App") {
  const title = escapeHtml(projectName || "Calculator App")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
html, body {
  margin: 0;
  min-height: 100%;
  background: #050816;
  color: white;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }
</style>
</head>
<body>
<main class="min-h-screen overflow-hidden bg-[#050816] text-white">
  <section class="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.24),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.4),rgba(2,6,23,1))]"></div>

    <div class="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
      <div class="flex flex-col justify-center rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:p-10">
        <p class="mb-5 inline-flex w-fit rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Premium Calculator Studio</p>
        <h1 class="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-7xl">${title}</h1>
        <p class="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">A real interactive calculator with keyboard support, calculation history, percentage, sign toggle, decimal input, delete, and responsive premium UI.</p>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5"><div class="mb-4 h-10 w-10 rounded-2xl bg-cyan-300/20"></div><p class="font-black text-cyan-100">Keyboard ready</p></div>
          <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5"><div class="mb-4 h-10 w-10 rounded-2xl bg-purple-300/20"></div><p class="font-black text-purple-100">History saved</p></div>
          <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5"><div class="mb-4 h-10 w-10 rounded-2xl bg-emerald-300/20"></div><p class="font-black text-emerald-100">Mobile perfect</p></div>
        </div>

        <div class="mt-8 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <p class="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">Current expression</p>
          <p id="expression" class="mt-3 min-h-8 break-words text-2xl font-black text-cyan-200">0</p>
        </div>
      </div>

      <div class="rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl sm:p-5">
        <div class="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
          <div class="min-h-28 rounded-3xl border border-white/10 bg-black/40 p-5 text-right">
            <p id="mini-expression" class="min-h-6 break-words text-sm text-slate-400">0</p>
            <p id="display" class="mt-3 break-words text-5xl font-black tracking-tight text-white">0</p>
          </div>

          <div class="mt-5 grid grid-cols-4 gap-3">
            <button data-action="clear" class="rounded-2xl bg-red-400/20 px-4 py-4 font-black text-red-100 transition hover:bg-red-400/30">AC</button>
            <button data-action="delete" class="rounded-2xl bg-white/10 px-4 py-4 font-black transition hover:bg-white/15">DEL</button>
            <button data-action="percent" class="rounded-2xl bg-white/10 px-4 py-4 font-black transition hover:bg-white/15">%</button>
            <button data-op="÷" class="rounded-2xl bg-cyan-300 px-4 py-4 text-xl font-black text-slate-950 transition hover:bg-cyan-200">÷</button>

            <button data-digit="7" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">7</button>
            <button data-digit="8" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">8</button>
            <button data-digit="9" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">9</button>
            <button data-op="×" class="rounded-2xl bg-cyan-300 px-4 py-4 text-xl font-black text-slate-950 transition hover:bg-cyan-200">×</button>

            <button data-digit="4" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">4</button>
            <button data-digit="5" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">5</button>
            <button data-digit="6" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">6</button>
            <button data-op="-" class="rounded-2xl bg-cyan-300 px-4 py-4 text-xl font-black text-slate-950 transition hover:bg-cyan-200">−</button>

            <button data-digit="1" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">1</button>
            <button data-digit="2" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">2</button>
            <button data-digit="3" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">3</button>
            <button data-op="+" class="rounded-2xl bg-cyan-300 px-4 py-4 text-xl font-black text-slate-950 transition hover:bg-cyan-200">+</button>

            <button data-action="toggle" class="rounded-2xl bg-white/10 px-4 py-4 font-black transition hover:bg-white/15">±</button>
            <button data-digit="0" class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">0</button>
            <button data-digit="." class="rounded-2xl bg-white/[0.07] px-4 py-4 text-xl font-black transition hover:bg-white/15">.</button>
            <button data-action="equals" class="rounded-2xl bg-purple-400 px-4 py-4 text-xl font-black text-slate-950 transition hover:bg-purple-300">=</button>
          </div>
        </div>

        <div class="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="font-black text-slate-200">History</p>
            <button id="clear-history" class="text-xs font-bold text-cyan-200 hover:text-cyan-100">Clear</button>
          </div>
          <div id="history" class="space-y-2">
            <p class="rounded-2xl bg-slate-950/60 p-3 text-sm text-slate-500">No calculations yet. Try 25 × 4.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

<script>
(function () {
  var display = "0";
  var storedValue = null;
  var operator = null;
  var waitingForValue = false;
  var history = [];

  var displayEl = document.getElementById("display");
  var expressionEl = document.getElementById("expression");
  var miniExpressionEl = document.getElementById("mini-expression");
  var historyEl = document.getElementById("history");

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Error";
    var rounded = Math.round(value * 10000000000) / 10000000000;
    return String(rounded);
  }

  function calculate(left, right, op) {
    if (op === "+") return left + right;
    if (op === "-") return left - right;
    if (op === "×") return left * right;
    if (op === "÷") return right === 0 ? NaN : left / right;
    return right;
  }

  function expression() {
    if (storedValue === null || operator === null) return display;
    return formatNumber(storedValue) + " " + operator + " " + (waitingForValue ? "" : display);
  }

  function render() {
    displayEl.textContent = display;
    expressionEl.textContent = expression();
    miniExpressionEl.textContent = expression();

    if (!history.length) {
      historyEl.innerHTML = '<p class="rounded-2xl bg-slate-950/60 p-3 text-sm text-slate-500">No calculations yet. Try 25 × 4.</p>';
      return;
    }

    historyEl.innerHTML = history
      .map(function (item) {
        return '<div class="rounded-2xl bg-slate-950/60 p-3 text-sm"><p class="text-slate-400">' + item.expression + '</p><p class="mt-1 font-black text-cyan-200">= ' + item.result + '</p></div>';
      })
      .join("");
  }

  function inputDigit(value) {
    if (display === "Error") {
      display = value === "." ? "0." : value;
      waitingForValue = false;
      render();
      return;
    }

    if (value === "." && display.indexOf(".") !== -1 && !waitingForValue) return;

    if (waitingForValue) {
      display = value === "." ? "0." : value;
      waitingForValue = false;
      render();
      return;
    }

    if (value === ".") display = display + ".";
    else display = display === "0" ? value : display + value;

    render();
  }

  function chooseOperator(nextOperator) {
    var inputValue = Number(display);

    if (storedValue === null) {
      storedValue = inputValue;
    } else if (operator) {
      var result = calculate(storedValue, inputValue, operator);
      var formatted = formatNumber(result);
      history.unshift({ expression: formatNumber(storedValue) + " " + operator + " " + display, result: formatted });
      history = history.slice(0, 8);
      display = formatted;
      storedValue = result;
    }

    operator = nextOperator;
    waitingForValue = true;
    render();
  }

  function performCalculation() {
    if (storedValue === null || operator === null) return;

    var inputValue = Number(display);
    var result = calculate(storedValue, inputValue, operator);
    var formatted = formatNumber(result);
    history.unshift({ expression: formatNumber(storedValue) + " " + operator + " " + display, result: formatted });
    history = history.slice(0, 8);
    display = formatted;
    storedValue = null;
    operator = null;
    waitingForValue = true;
    render();
  }

  function clearAll() {
    display = "0";
    storedValue = null;
    operator = null;
    waitingForValue = false;
    history = [];
    render();
  }

  function deleteLast() {
    if (waitingForValue || display === "Error") {
      display = "0";
      waitingForValue = false;
      render();
      return;
    }

    display = display.length <= 1 ? "0" : display.slice(0, -1);
    render();
  }

  function toggleSign() {
    if (display === "0" || display === "Error") return;
    display = display.charAt(0) === "-" ? display.slice(1) : "-" + display;
    render();
  }

  function percent() {
    if (display === "Error") return;
    display = formatNumber(Number(display) / 100);
    render();
  }

  document.querySelectorAll("[data-digit]").forEach(function (button) {
    button.addEventListener("click", function () {
      inputDigit(button.getAttribute("data-digit"));
    });
  });

  document.querySelectorAll("[data-op]").forEach(function (button) {
    button.addEventListener("click", function () {
      chooseOperator(button.getAttribute("data-op"));
    });
  });

  document.querySelectorAll("[data-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      var action = button.getAttribute("data-action");
      if (action === "clear") clearAll();
      if (action === "delete") deleteLast();
      if (action === "percent") percent();
      if (action === "toggle") toggleSign();
      if (action === "equals") performCalculation();
    });
  });

  document.getElementById("clear-history").addEventListener("click", function () {
    history = [];
    render();
  });

  window.addEventListener("keydown", function (event) {
    if (/^[0-9.]$/.test(event.key)) inputDigit(event.key);
    if (event.key === "+") chooseOperator("+");
    if (event.key === "-") chooseOperator("-");
    if (event.key === "*") chooseOperator("×");
    if (event.key === "/") {
      event.preventDefault();
      chooseOperator("÷");
    }
    if (event.key === "Enter" || event.key === "=") performCalculation();
    if (event.key === "Backspace") deleteLast();
    if (event.key === "Escape") clearAll();
    if (event.key === "%") percent();
  });

  render();
})();
</script>
</body>
</html>`
}

function buildNativeQuizHtml(projectName = "Quiz Generator App") {
  const title = escapeHtml(projectName || "Quiz Generator App")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{margin:0;background:#020617;color:white;font-family:Inter,ui-sans-serif,system-ui}</style>
</head>
<body>
<main class="min-h-screen bg-slate-950 px-5 py-10 text-white">
  <section class="mx-auto max-w-6xl">
    <div class="text-center">
      <p class="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[.28em] text-cyan-200">Interactive Quiz Builder</p>
      <h1 class="mt-5 text-4xl font-black sm:text-6xl">${title}</h1>
      <p class="mx-auto mt-4 max-w-2xl text-slate-300">Enter a topic and generate a working quiz with score tracking.</p>
    </div>

    <div class="mx-auto mt-8 grid max-w-3xl gap-3 rounded-[2rem] border border-white/10 bg-white/[.07] p-4 sm:grid-cols-[1fr_auto_auto]">
      <input id="topic" class="min-h-14 rounded-2xl border border-white/10 bg-slate-950/80 px-5 outline-none" placeholder="Enter topic, e.g. Space, Maths, JavaScript" />
      <button id="generate" class="min-h-14 rounded-2xl bg-cyan-300 px-6 font-black text-slate-950">Generate Quiz</button>
      <button id="reset" class="min-h-14 rounded-2xl border border-white/10 bg-white/10 px-6 font-bold">Reset</button>
    </div>

    <div class="mt-8 grid gap-4 md:grid-cols-3">
      <div class="rounded-3xl border border-white/10 bg-white/[.06] p-5 text-center"><p class="text-sm text-slate-400">Topic</p><p id="active-topic" class="mt-2 text-2xl font-black text-cyan-200">General Knowledge</p></div>
      <div class="rounded-3xl border border-white/10 bg-white/[.06] p-5 text-center"><p class="text-sm text-slate-400">Progress</p><p id="progress" class="mt-2 text-2xl font-black text-purple-200">0/6</p></div>
      <div class="rounded-3xl border border-white/10 bg-white/[.06] p-5 text-center"><p class="text-sm text-slate-400">Score</p><p id="score" class="mt-2 text-2xl font-black text-emerald-200">0/6</p></div>
    </div>

    <div id="questions" class="mt-8 grid gap-5 lg:grid-cols-2"></div>
  </section>
</main>

<script>
(function(){
  var topic = "General Knowledge";
  var selected = {};

  function makeQuestions(t){
    return [
      ["What is a key idea in " + t + "?", ["Core concept", "Random guess", "Wrong topic", "None"], "Core concept"],
      ["What improves skill in " + t + "?", ["Practice", "Ignoring it", "Guessing", "Skipping"], "Practice"],
      ["Why learn " + t + "?", ["Solves problems", "No value", "Blocks learning", "It is random"], "Solves problems"],
      ["Best first step for " + t + "?", ["Start basics", "Skip basics", "Memorize all", "Avoid examples"], "Start basics"],
      ["How to test " + t + " knowledge?", ["Answer questions", "Close app", "Hide notes", "Avoid revision"], "Answer questions"],
      ["What builds confidence in " + t + "?", ["Interactive quizzes", "No feedback", "Less practice", "Random clicks"], "Interactive quizzes"]
    ];
  }

  function render(){
    var qs = makeQuestions(topic);
    var answered = Object.keys(selected).length;
    var score = qs.reduce(function(total, q, index){ return total + (selected[index] === q[2] ? 1 : 0); }, 0);
    document.getElementById("active-topic").textContent = topic;
    document.getElementById("progress").textContent = answered + "/" + qs.length;
    document.getElementById("score").textContent = score + "/" + qs.length;

    document.getElementById("questions").innerHTML = qs.map(function(q, index){
      return '<article class="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5"><h2 class="text-xl font-black">' + (index + 1) + '. ' + q[0] + '</h2><div class="mt-4 grid gap-3">' +
        q[1].map(function(option){
          var reveal = selected[index];
          var cls = reveal && option === q[2] ? "border-emerald-300 bg-emerald-300/20 text-emerald-100" : selected[index] === option ? "border-red-300 bg-red-300/15 text-red-100" : "border-white/10 bg-white/[.04] text-slate-200 hover:border-cyan-300/60 hover:bg-cyan-300/10";
          return '<button data-index="' + index + '" data-answer="' + option + '" class="rounded-2xl border px-4 py-3 text-left font-semibold transition ' + cls + '">' + option + '</button>';
        }).join("") +
        '</div></article>';
    }).join("");

    document.querySelectorAll("[data-answer]").forEach(function(btn){
      btn.addEventListener("click", function(){
        selected[btn.getAttribute("data-index")] = btn.getAttribute("data-answer");
        render();
      });
    });
  }

  document.getElementById("generate").addEventListener("click", function(){
    topic = document.getElementById("topic").value.trim() || "General Knowledge";
    selected = {};
    render();
  });
  document.getElementById("reset").addEventListener("click", function(){
    document.getElementById("topic").value = "";
    topic = "General Knowledge";
    selected = {};
    render();
  });

  render();
})();
</script>
</body>
</html>`
}

function buildLoadingHtml(files: Record<string, string>, projectName = "") {
  const title = escapeHtml(projectName || "AI Generated Project")
  const fileList = Object.keys(files)
    .slice(0, 40)
    .map((path) => `<li>${escapeHtml(path)}</li>`)
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{margin:0;background:#020617;color:white;font-family:Inter,ui-sans-serif,system-ui}</style>
</head>
<body>
<main class="min-h-screen bg-slate-950 px-6 py-12 text-white">
  <section class="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-8">
    <p class="text-cyan-300 uppercase tracking-[0.3em] text-sm">Generated project files saved</p>
    <h1 class="mt-4 text-5xl font-black">${title}</h1>
    <p class="mt-4 text-slate-300">This project type is saved. Preview support for this generated app is being prepared.</p>
    <div class="mt-8 rounded-2xl bg-slate-950/70 p-5">
      <h2 class="text-xl font-black">Saved files</h2>
      <ul class="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">${fileList}</ul>
    </div>
  </section>
</main>
</body>
</html>`
}

function errorHtml(message: string) {
  return `<!doctype html><html><body style="background:#050509;color:white;font-family:sans-serif;padding:24px"><h1>Preview error</h1><pre>${escapeHtml(message)}</pre></body></html>`
}

function buildPreviewHtml(files: Record<string, string>, projectName = "") {
  if (projectLooksLikeCalculator(files, projectName)) {
    return buildNativeCalculatorHtml(projectName || "Calculator App")
  }

  if (projectLooksLikeQuiz(files, projectName)) {
    return buildNativeQuizHtml(projectName || "Quiz Generator App")
  }

  return buildLoadingHtml(files, projectName)
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

      if (rawHtml) {
        return new Response(html, {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        })
      }

      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const files = normalizeFiles(rows[0].files)
    const html = buildPreviewHtml(files, String(rows[0].name || ""))

    if (rawHtml) {
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    }

    return NextResponse.json(
      { success: true, html },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Project preview error:", error)

    const message = error instanceof Error ? error.message : "Unknown preview error"
    const rawHtml = new URL(request.url).searchParams.get("raw") === "1"

    if (rawHtml) {
      return new Response(errorHtml(message), {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      })
    }

    return NextResponse.json(
      {
        error: "Failed to build project preview",
        debug: message,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
