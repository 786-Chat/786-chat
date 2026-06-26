export type SevenEightSixLocalProject = {
  title: string
  description: string
  html: string
  files: Record<string, string>
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function detectProject(prompt: string) {
  const text = prompt.toLowerCase()
  if (text.includes("restaurant") || text.includes("menu") || text.includes("booking")) {
    return {
      type: "restaurant",
      title: "Premium Restaurant Website",
      description: "Homepage, menu, booking, contact, modern colours and animation sections.",
      accent: "#f59e0b",
      accent2: "#ef4444",
      dark: "#100b08",
      sections: ["Signature Menu", "Online Booking", "Chef Story", "Contact & Location"],
    }
  }

  if (text.includes("pizza")) {
    return {
      type: "pizza",
      title: "Premium Pizza Shop",
      description: "Animated pizza shop with offers, menu cards, ordering and contact sections.",
      accent: "#ef4444",
      accent2: "#22c55e",
      dark: "#140704",
      sections: ["Hot Deals", "Pizza Menu", "Order Online", "Delivery Zone"],
    }
  }

  if (text.includes("dashboard") || text.includes("saas")) {
    return {
      type: "dashboard",
      title: "Modern SaaS Dashboard",
      description: "Sidebar, analytics cards, reports, charts and activity panels.",
      accent: "#22d3ee",
      accent2: "#8b5cf6",
      dark: "#050816",
      sections: ["Analytics", "Reports", "Customers", "Revenue"],
    }
  }

  if (text.includes("quiz")) {
    return {
      type: "quiz",
      title: "Interactive Quiz Generator",
      description: "Topic input, generated questions, score tracking and interactive layout.",
      accent: "#a855f7",
      accent2: "#06b6d4",
      dark: "#0c0820",
      sections: ["Topic Input", "5-8 Questions", "Score Board", "Restart Flow"],
    }
  }

  if (text.includes("login")) {
    return {
      type: "login",
      title: "Premium Login Page",
      description: "Modern sign-in form with social login, validation and responsive layout.",
      accent: "#38bdf8",
      accent2: "#6366f1",
      dark: "#07111f",
      sections: ["Email Login", "Social Login", "Validation", "Secure UI"],
    }
  }

  return {
    type: "app",
    title: "786.Chat Generated App",
    description: "A real temporary project generated from the current prompt.",
    accent: "#22d3ee",
    accent2: "#a855f7",
    dark: "#050713",
    sections: ["Homepage", "Components", "Backend Ready", "Deploy Ready"],
  }
}

export function createSevenEightSixLocalProject(prompt: string): SevenEightSixLocalProject {
  const project = detectProject(prompt)
  const safePrompt = escapeHtml(prompt)
  const sections = project.sections

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${project.title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: ${project.dark}; color: white; }
    .page { min-height: 100vh; overflow: hidden; background:
      radial-gradient(circle at 10% 10%, ${project.accent}44, transparent 32%),
      radial-gradient(circle at 90% 20%, ${project.accent2}33, transparent 35%),
      linear-gradient(135deg, ${project.dark}, #020617 70%);
    }
    header { display: flex; justify-content: space-between; align-items: center; padding: 28px clamp(24px, 6vw, 80px); border-bottom: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(16px); }
    .brand { font-weight: 950; letter-spacing: .28em; color: ${project.accent}; }
    nav { display: flex; gap: 20px; color: rgba(255,255,255,.7); font-size: 14px; }
    .hero { padding: 90px clamp(24px, 7vw, 100px) 60px; display: grid; grid-template-columns: 1.1fr .9fr; gap: 50px; align-items: center; }
    .eyebrow { color: ${project.accent}; text-transform: uppercase; letter-spacing: .35em; font-weight: 900; font-size: 13px; }
    h1 { font-size: clamp(42px, 7vw, 92px); line-height: .92; margin: 18px 0 24px; letter-spacing: -0.08em; }
    .lead { color: rgba(255,255,255,.76); font-size: 20px; line-height: 1.8; max-width: 720px; }
    .actions { margin-top: 34px; display: flex; flex-wrap: wrap; gap: 14px; }
    .primary, .secondary { border-radius: 999px; padding: 15px 24px; font-weight: 900; border: 1px solid rgba(255,255,255,.16); }
    .primary { background: ${project.accent}; color: #020617; box-shadow: 0 0 40px ${project.accent}55; }
    .secondary { background: rgba(255,255,255,.06); color: white; }
    .visual { min-height: 440px; border-radius: 40px; border: 1px solid rgba(255,255,255,.12); background: linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.03)); padding: 30px; box-shadow: 0 30px 90px rgba(0,0,0,.35); animation: float 5s ease-in-out infinite; }
    .glass { height: 100%; border-radius: 30px; background: linear-gradient(150deg, ${project.accent}22, ${project.accent2}22); padding: 28px; display: grid; align-content: end; }
    .metric { border-radius: 24px; background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.12); padding: 18px; margin-top: 14px; }
    .grid { padding: 30px clamp(24px, 7vw, 100px) 90px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
    .card { border-radius: 28px; border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.055); padding: 26px; min-height: 180px; transition: transform .25s ease, border .25s ease; }
    .card:hover { transform: translateY(-8px); border-color: ${project.accent}; }
    .icon { width: 42px; height: 42px; border-radius: 16px; display: grid; place-items: center; background: ${project.accent}; color: #020617; font-weight: 950; margin-bottom: 24px; }
    .card h3 { margin: 0; font-size: 20px; }
    .card p { color: rgba(255,255,255,.65); line-height: 1.7; }
    .prompt { margin: 0 clamp(24px, 7vw, 100px) 60px; padding: 20px; border-radius: 24px; background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.6); }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
    @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr 1fr; } nav { display:none; } }
    @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="page">
    <header><div class="brand">786.CHAT</div><nav><span>Home</span><span>Features</span><span>Booking</span><span>Contact</span></nav></header>
    <section class="hero">
      <div>
        <div class="eyebrow">AI Generated Project</div>
        <h1>${project.title}</h1>
        <p class="lead">${project.description}</p>
        <div class="actions"><button class="primary">Launch Project</button><button class="secondary">View Code</button></div>
      </div>
      <div class="visual"><div class="glass"><h2>Live Preview</h2><div class="metric">Modern responsive design</div><div class="metric">Animations and premium sections</div><div class="metric">Ready for real project engine</div></div></div>
    </section>
    <section class="grid">
      ${sections.map((section, index) => `<article class="card"><div class="icon">${index + 1}</div><h3>${section}</h3><p>Production-style section generated for this request with modern styling and clear structure.</p></article>`).join("\n      ")}
    </section>
    <div class="prompt"><strong>Prompt:</strong> ${safePrompt}</div>
  </main>
</body>
</html>`

  const pageTsx = `export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-300">786.Chat</p>
        <h1 className="mt-6 text-6xl font-black tracking-tight">${project.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${project.description}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          ${sections.map((section) => `<div className="rounded-3xl border border-white/10 bg-white/5 p-6">${section}</div>`).join("\n          ")}
        </div>
      </section>
    </main>
  )
}
`

  return {
    title: project.title,
    description: project.description,
    html,
    files: {
      "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest" }, devDependencies: { typescript: "latest", tailwindcss: "latest" } }, null, 2),
      "app/layout.tsx": `import type { ReactNode } from "react"\nimport "./globals.css"\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>\n}\n`,
      "app/page.tsx": pageTsx,
      "app/globals.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { margin: 0; background: ${project.dark}; }\n`,
      "README.md": `# ${project.title}\n\nGenerated by 786.Chat from this prompt:\n\n${prompt}\n`,
    },
  }
}
