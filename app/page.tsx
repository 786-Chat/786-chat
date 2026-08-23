"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import "./marketing-home.css";
import "./marketing-home-cleanup.css";

const workspaceLinks = [
  { label: "Overview", icon: "◫", href: "/786.chat" },
  { label: "Projects", icon: "▱", href: "/786.chat/projects" },
  { label: "Agent Flow", icon: "⌘", href: "/786.chat", active: true },
  { label: "Settings", icon: "⚙", href: "/786.chat" },
  { label: "Help & Docs", icon: "?", href: "/support" },
];

const buildSteps = [
  "Understand your idea",
  "Prepare your application",
  "Build your pages",
  "Check everything works",
  "Ready to preview",
];

const projectPages = ["Home", "Dashboard", "Customers", "Orders", "Reports", "Settings", "Login"];

const metrics = [
  ["Customers", "1,284", "+12.4%"],
  ["Orders", "8,231", "+8.7%"],
  ["Revenue", "£92k", "+14.5%"],
  ["Projects", "24", "+3"],
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
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const chartPoints = useMemo(
    () => "0,94 22,82 45,88 68,66 90,72 112,49 136,58 158,38 180,44 202,25 225,34 248,17 270,22 294,8",
    [],
  );

  return (
    <div className="workspace-shell workspace-clean" id="product">
      <div className="workspace-toolbar">
        <a className="workspace-brand" href="/786.chat" aria-label="Open 786.Chat builder">
          <BrandMark />
          <strong>786.Chat</strong>
        </a>
        <div className="toolbar-actions">
          <span className="environment"><i /> Ready</span>
          <a className="deploy-button" href="/786.chat">↗ Deploy</a>
          <span className="user-chip">78</span>
        </div>
      </div>

      <div className="workspace-grid">
        <aside className="workspace-sidebar-demo" aria-label="786.Chat workspace navigation">
          <div className="sidebar-demo-brand"><BrandMark /><strong>786.Chat</strong></div>
          {workspaceLinks.map((item) => (
            <a className={`sidebar-demo-link ${item.active ? "active" : ""}`} href={item.href} key={item.label}>
              <span className="sidebar-demo-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
          <a className="sidebar-demo-new" href="/786.chat">
            <span className="sidebar-demo-avatar">78</span>
            <span><strong>New project</strong><small>Start a new workspace</small></span>
          </a>
        </aside>

        <section className="workspace-panel agent-demo-panel">
          <div className="panel-title"><span>AI Agent</span><span>Agent Flow</span></div>
          <div className="agent-demo-body">
            <div className="agent-demo-card">
              <strong>Tell 786.Chat what you want to create</strong>
              <p>Describe your business, website, app or system. 786.Chat prepares the project, builds the requested pages and keeps the preview ready for you.</p>
            </div>
            <div className="build-steps">
              {buildSteps.map((step, index) => (
                <div className="build-step" key={step}>
                  <span className={`step-check ${index < 4 ? "complete" : ""}`}>{index < 4 ? "✓" : ""}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="pages-inventory">
              <strong>Project pages</strong>
              <div className="page-chip-list">
                {projectPages.map((page) => <span key={page}>{page}</span>)}
              </div>
            </div>
          </div>
          <a className="agent-demo-composer" href="/786.chat"><span>Ask the agent anything…</span><b>→</b></a>
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
              <div className="preview-logo"><i /> Workspace</div>
              {["Overview", "Customers", "Orders", "Reports", "Settings"].map((item, index) => (
                <span className={index === 0 ? "active" : ""} key={item}>{item}</span>
              ))}
            </aside>
            <div className="preview-content">
              <div className="preview-heading">
                <div><small>Business dashboard</small><strong>Overview</strong></div>
                <span>Live</span>
              </div>
              <div className="metrics-grid">
                {metrics.map(([label, value, delta]) => (
                  <article key={label}><small>{label}</small><strong>{value}</strong><em>{delta}</em></article>
                ))}
              </div>
              <div className="chart-card">
                <div><strong>Activity</strong><span>This month</span></div>
                <svg viewBox="0 0 300 108" preserveAspectRatio="none" aria-label="Activity increasing over time">
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
        <a className="site-brand" href="#home" aria-label="786.Chat home"><BrandMark /><span>786.Chat</span></a>
        <div className="nav-links"><a href="#home">Home</a><a href="/support">Support</a></div>
        <div className="nav-actions"><a className="sign-in-link" href="/login">Sign in</a><a className="nav-cta" href="/786.chat">Open builder <ArrowIcon /></a></div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-grid" aria-hidden="true" />
        <Image className="hero-art" src="https://seven86-chat-v2.link24-7days.chatgpt.site/hero-blue-glass-v2.png" alt="" width={1600} height={900} priority unoptimized />
        <div className="hero-copy">
          <div className="eyebrow"><span /> Agentic product engineering</div>
          <h1>Build production<span>apps by talking to AI</span></h1>
          <p>Describe your idea, build it, preview it and prepare it for deployment from one intelligent workspace.</p>
          <div className="hero-actions"><a className="primary-cta" href="/786.chat">Start building <ArrowIcon /></a><a className="secondary-cta" href="#templates">Explore templates</a></div>
          <div className="hero-proof"><span><i>01</i> Describe</span><b /><span><i>02</i> Build</span><b /><span><i>03</i> Preview</span><b /><span><i>04</i> Deploy</span></div>
        </div>

        <Workspace />

        <div className="trust-strip" aria-label="Platform assurances">
          <div className="trust-item"><span className="trust-icon"><CheckIcon /></span><p><strong>Build passed</strong><small>All checks green</small></p></div>
          <div className="trust-divider" />
          <div className="trust-item"><span className="trust-icon pulse"><i /></span><p><strong>Preview live</strong><small>Real-time updates</small></p></div>
          <div className="trust-divider" />
          <div className="trust-item"><span className="trust-icon lock">⌾</span><p><strong>Secure workspace</strong><small>Your project stays organised</small></p></div>
        </div>
      </section>

      <section className="design-note" id="features">
        <div><span className="section-label">One workspace. Full lifecycle.</span><h2>From first idea to verified deployment.</h2></div>
        <p>Describe the product you need. 786.Chat organises the project, builds the requested pages, checks the result and keeps your preview ready before deployment.</p>
      </section>

      <section className="landing-sections" aria-label="Explore 786.Chat">
        <article className="landing-card themes-card" id="themes">
          <span className="section-label">Themes</span><h2>Premium systems, never repetitive templates.</h2><p>Visual families vary typography, spacing, navigation, surfaces, motion and mobile behaviour while staying true to your brand.</p>
          <div className="theme-swatches" aria-label="Theme colour examples"><i /><i /><i /><i /><i /></div>
        </article>
        <article className="landing-card pricing-card" id="production">
          <span className="section-label">Production workflow</span><h2>Build, preview and deploy from one workspace.</h2><p>Create the application first. Usage, storage, pages, deployments and domains can then be managed from your workspace.</p><a href="/786.chat">Open builder <ArrowIcon /></a>
        </article>
        <article className="landing-card about-card" id="about">
          <span className="section-label">About</span><h2>AI building with clear, reliable steps.</h2><p>786.Chat is designed around understanding your request, creating the application, checking the result, maintaining a reliable preview and preparing deployment.</p>
        </article>
        <article className="landing-card contact-card" id="contact">
          <span className="section-label">Contact</span><h2>Bring your next product to life.</h2><p>Start in the builder, describe what you need and move from your first idea to a working application in one focused workspace.</p>
          <div className="contact-actions" id="signin"><a className="primary-cta" href="/786.chat">Open builder <ArrowIcon /></a><a className="secondary-cta support-call" href="tel:+447427070000">Call support <span>+44 7427 070000</span></a></div>
        </article>
      </section>
    </main>
  );
}
