"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import "./marketing-home.css";

const files = [
  { name: "app", type: "folder", level: 0 },
  { name: "api", type: "folder", level: 1 },
  { name: "auth.ts", type: "ts", level: 2 },
  { name: "users.ts", type: "ts", level: 2 },
  { name: "analytics.ts", type: "ts", level: 2 },
  { name: "components", type: "folder", level: 1 },
  { name: "Chart.tsx", type: "tsx", level: 2 },
  { name: "KpiCard.tsx", type: "tsx", level: 2 },
  { name: "DataTable.tsx", type: "tsx", level: 2 },
  { name: "pages", type: "folder", level: 1 },
  { name: "Dashboard.tsx", type: "tsx", level: 2 },
  { name: "Settings.tsx", type: "tsx", level: 2 },
  { name: "Login.tsx", type: "tsx", level: 2 },
  { name: "package.json", type: "json", level: 0 },
];

const buildSteps = [
  "Analyse requirements",
  "Create data model",
  "Build API endpoints",
  "Create dashboard UI",
  "Write tests",
];

const metrics = [
  ["Total users", "12,540", "+18.2%"],
  ["Active users", "8,231", "+12.7%"],
  ["Events", "98,421", "+24.5%"],
  ["Conversion", "3.42%", "+8.1%"],
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <b>786</b>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function PremiumInteractions() {
  const glowRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let audioContext: AudioContext | null = null;

    const moveGlow = (event: PointerEvent) => {
      if (!finePointer.matches || !glowRef.current) return;
      glowRef.current.style.setProperty("--pointer-x", `${event.clientX}px`);
      glowRef.current.style.setProperty("--pointer-y", `${event.clientY}px`);
      glowRef.current.dataset.visible = "true";
    };

    const playDrop = () => {
      const AudioContextClass =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      audioContext ??= new AudioContextClass();
      const now = audioContext.currentTime;
      const gain = audioContext.createGain();
      const high = audioContext.createOscillator();
      const low = audioContext.createOscillator();

      high.type = "sine";
      low.type = "sine";
      high.frequency.setValueAtTime(740, now);
      high.frequency.exponentialRampToValueAtTime(310, now + 0.16);
      low.frequency.setValueAtTime(190, now);
      low.frequency.exponentialRampToValueAtTime(108, now + 0.22);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      high.connect(gain);
      low.connect(gain);
      gain.connect(audioContext.destination);
      high.start(now);
      low.start(now + 0.018);
      high.stop(now + 0.2);
      low.stop(now + 0.27);
    };

    const createRipple = (event: PointerEvent) => {
      playDrop();
      if (reducedMotion.matches || !ripplesRef.current) return;

      const ripple = document.createElement("span");
      ripple.className = "liquid-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      ripplesRef.current.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    };

    const hideGlow = () => {
      if (glowRef.current) glowRef.current.dataset.visible = "false";
    };

    window.addEventListener("pointermove", moveGlow, { passive: true });
    window.addEventListener("pointerdown", createRipple, { passive: true });
    document.documentElement.addEventListener("mouseleave", hideGlow);

    return () => {
      window.removeEventListener("pointermove", moveGlow);
      window.removeEventListener("pointerdown", createRipple);
      document.documentElement.removeEventListener("mouseleave", hideGlow);
      void audioContext?.close();
    };
  }, []);

  return (
    <>
      <div className="pointer-glow" ref={glowRef} aria-hidden="true" />
      <div className="ripple-layer" ref={ripplesRef} aria-hidden="true" />
    </>
  );
}

function Workspace() {
  const [activeFile, setActiveFile] = useState("Dashboard.tsx");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [sent, setSent] = useState(false);
  const prompt = sent
    ? "Add role-based access and export reports to CSV."
    : "Build a customer analytics dashboard with user signup, data insights, charts, and CSV export.";

  const chartPoints = useMemo(
    () => "0,94 22,82 45,88 68,66 90,72 112,49 136,58 158,38 180,44 202,25 225,34 248,17 270,22 294,8",
    [],
  );

  return (
    <div className="workspace-shell" id="product">
      <div className="workspace-toolbar">
        <div className="workspace-brand">
          <BrandMark />
          <strong>786.Chat</strong>
        </div>
        <div className="toolbar-actions">
          <span className="environment"><i /> Environment</span>
          <button className="deploy-button" type="button">
            <span>↗</span> Deploy
          </button>
          <button className="icon-button" type="button" aria-label="More options">•••</button>
          <span className="user-chip">78</span>
        </div>
      </div>

      <div className="workspace-grid">
        <section className="workspace-panel prompt-panel">
          <div className="panel-title">
            <span>Prompt</span>
            <button type="button" aria-label="Refresh prompt">↻</button>
          </div>
          <div className="prompt-card">{prompt}</div>
          <p className="agent-note">I&apos;ll break this into a plan and build it step by step.</p>
          <div className="build-steps">
            {buildSteps.map((step, index) => (
              <div className="build-step" key={step}>
                <span className={index < 4 ? "step-check complete" : "step-check"}>{index < 4 ? "✓" : ""}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="composer">
            <span>Ask anything…</span>
            <button type="button" onClick={() => setSent((value) => !value)} aria-label="Send prompt">
              <ArrowIcon />
            </button>
          </div>
        </section>

        <section className="workspace-panel files-panel">
          <div className="panel-title">
            <span>Files</span>
            <div className="panel-actions" aria-hidden="true">＋ ⟳ ⋮</div>
          </div>
          <div className="file-tree">
            {files.map((file) => (
              <button
                type="button"
                key={`${file.level}-${file.name}`}
                className={`file-row ${activeFile === file.name ? "active" : ""}`}
                style={{ paddingLeft: `${10 + file.level * 13}px` }}
                onClick={() => file.type !== "folder" && setActiveFile(file.name)}
              >
                <span className={`file-symbol ${file.type}`}>
                  {file.type === "folder" ? "▾" : file.type === "json" ? "{}" : "TS"}
                </span>
                <span>{file.name}</span>
              </button>
            ))}
          </div>
          <div className="file-status"><span>Selected</span><strong>{activeFile}</strong></div>
        </section>

        <section className="workspace-panel preview-panel">
          <div className="panel-title preview-title">
            <span>Live preview</span>
            <div className="device-toggle" role="group" aria-label="Preview device">
              <button type="button" className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}>Desktop</button>
              <button type="button" className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}>Mobile</button>
            </div>
          </div>
          <div className={`app-preview ${device}`}>
            <aside className="preview-sidebar">
              <div className="preview-logo"><i /> Atlas</div>
              {["Overview", "Users", "Events", "Reports", "Exports"].map((item, index) => (
                <span className={index === 0 ? "active" : ""} key={item}>{item}</span>
              ))}
            </aside>
            <div className="preview-content">
              <div className="preview-heading">
                <div><small>Analytics</small><strong>Overview</strong></div>
                <span>Last 30 days</span>
              </div>
              <div className="metrics-grid">
                {metrics.map(([label, value, delta]) => (
                  <article key={label}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                    <em>{delta}</em>
                  </article>
                ))}
              </div>
              <div className="chart-card">
                <div><strong>User signups</strong><span>Daily</span></div>
                <svg viewBox="0 0 300 108" preserveAspectRatio="none" aria-label="User signups increasing over time">
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#18c983" stopOpacity=".45" />
                      <stop offset="1" stopColor="#18c983" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={`${chartPoints} 294,108 0,108`} fill="url(#chartFill)" />
                  <polyline points={chartPoints} fill="none" stroke="#4ee7a7" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="marketing-home">
      <PremiumInteractions />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="aurora-field" aria-hidden="true">
        <span className="aurora aurora-cyan" />
        <span className="aurora aurora-violet" />
        <span className="aurora aurora-blue" />
        <span className="light-beam beam-one" />
        <span className="light-beam beam-two" />
        <span className="star-field" />
      </div>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="site-brand" href="#home" aria-label="786.Chat home">
          <BrandMark />
          <span>786.Chat</span>
        </a>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="/features">Features</a>
          <a href="/examples">Examples</a>
          <a href="/docs">Docs</a>
          <a href="/support">Support</a>
        </div>
        <div className="nav-actions">
          <a className="sign-in-link" href="/login">Sign in</a>
          <a className="nav-cta" href="/786.chat">Open builder <ArrowIcon /></a>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-grid" aria-hidden="true" />
        <Image
          className="hero-art"
          src="https://seven86-chat-v2.link24-7days.chatgpt.site/hero-blue-glass-v2.png"
          alt=""
          width={1600}
          height={900}
          priority
          unoptimized
        />
        <div className="hero-copy">
          <div className="eyebrow"><span /> Agentic product engineering</div>
          <h1>
            Build production
            <span>apps by talking to AI</span>
          </h1>
          <p>Plan, code, test and deploy complete applications from one intelligent workspace.</p>
          <div className="hero-actions">
            <a className="primary-cta" href="/786.chat">Start building <ArrowIcon /></a>
            <a className="secondary-cta" href="#templates">Explore templates</a>
          </div>
          <div className="hero-proof">
            <span><i>01</i> Plan</span>
            <b />
            <span><i>02</i> Build</span>
            <b />
            <span><i>03</i> Verify</span>
            <b />
            <span><i>04</i> Deploy</span>
          </div>
        </div>

        <Workspace />

        <div className="trust-strip" aria-label="Platform assurances">
          <div className="trust-item"><span className="trust-icon"><CheckIcon /></span><p><strong>Build passed</strong><small>All checks green</small></p></div>
          <div className="trust-divider" />
          <div className="trust-item"><span className="trust-icon pulse"><i /></span><p><strong>Preview live</strong><small>Real-time updates</small></p></div>
          <div className="trust-divider" />
          <div className="trust-item"><span className="trust-icon lock">⌾</span><p><strong>Secure sandbox</strong><small>Isolated environment</small></p></div>
        </div>
      </section>

      <section className="design-note" id="features">
        <div>
          <span className="section-label">One workspace. Full lifecycle.</span>
          <h2>From first idea to verified deployment.</h2>
        </div>
        <p>Describe the product you need. 786.Chat plans the architecture, creates real files, validates every requested feature and repairs errors before deployment.</p>
      </section>

      <section className="landing-sections" aria-label="Explore 786.Chat">
        <article className="landing-card themes-card" id="themes">
          <span className="section-label">Themes</span>
          <h2>Premium systems, never repetitive templates.</h2>
          <p>Composable visual families vary typography, spacing, navigation, surfaces, motion and mobile behaviour while staying true to your brand.</p>
          <div className="theme-swatches" aria-label="Theme colour examples">
            <i /><i /><i /><i /><i />
          </div>
        </article>

        <article className="landing-card pricing-card" id="production">
          <span className="section-label">Production workflow</span>
          <h2>Build, verify and deploy from one workspace.</h2>
          <p>Create the real application first. Usage, storage, pages, deployments and domains can then be measured before paid plans are published.</p>
          <a href="/786.chat">Open builder <ArrowIcon /></a>
        </article>

        <article className="landing-card about-card" id="about">
          <span className="section-label">About</span>
          <h2>AI building with engineering discipline.</h2>
          <p>786.Chat is designed around planning, real source files, build validation, reliable previews and recorded deployments—not generic page generation.</p>
        </article>

        <article className="landing-card contact-card" id="contact">
          <span className="section-label">Contact</span>
          <h2>Bring your next product to life.</h2>
          <p>Start in the builder, shape the specification and move from prompt to a verified application in one focused workspace.</p>
          <div className="contact-actions" id="signin">
            <a className="primary-cta" href="/786.chat">Open builder <ArrowIcon /></a>
            <a className="secondary-cta" href="/support">Contact support</a>
          </div>
        </article>
      </section>
    </main>
  );
}
