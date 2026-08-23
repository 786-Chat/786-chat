import Image from "next/image"
import Link from "next/link"

import "./homepage-one.css"

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path d="M5 12h14M14 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const buildCards = [
  ["01", "Describe", "Tell 786.Chat what you want to create in normal language."],
  ["02", "Build", "Generate the requested pages, flows and application structure."],
  ["03", "Preview", "Review the result clearly before you move toward deployment."],
  ["04", "Deploy", "Prepare your finished project for production from the same workspace."],
]

const productCards = [
  ["Web applications", "Dashboards, portals, customer systems and business tools."],
  ["Business websites", "Modern multi-page sites for companies, shops and services."],
  ["Commerce", "Product, ordering, checkout and customer-management experiences."],
  ["CRM & operations", "Customers, tasks, orders, reporting and internal workflows."],
]

function WorkspacePreview() {
  return (
    <div className="workspace-showcase" aria-label="786.Chat workspace preview">
      <div className="workspace-topbar">
        <div className="workspace-mini-brand"><span>786</span><strong>786.Chat</strong></div>
        <div className="workspace-ready"><i /> Ready</div>
      </div>
      <div className="workspace-body">
        <div className="workspace-side">
          <strong>786.Chat</strong>
          <span>▣ Overview</span>
          <span>▱ Projects</span>
          <span className="active">⌘ Agent Flow</span>
          <span>⚙ Settings</span>
          <span>? Help & Docs</span>
          <div className="workspace-new"><b>78</b><span><strong>New project</strong><small>Start a new workspace</small></span></div>
        </div>
        <div className="workspace-agent">
          <div className="workspace-panel-title"><strong>AI Agent</strong><span>Agent Flow</span></div>
          <div className="agent-card">
            <strong>Tell 786.Chat what you want to create</strong>
            <p>Describe your business, website, app or system. 786.Chat prepares the project and requested pages.</p>
          </div>
          {["Understand your idea", "Prepare your application", "Build your pages", "Check everything works"].map((label) => (
            <div className="agent-step" key={label}><i>✓</i><span>{label}</span></div>
          ))}
          <div className="agent-pages"><span>Home</span><span>Dashboard</span><span>Customers</span><span>Orders</span></div>
          <div className="agent-input">Ask the agent anything… <b>→</b></div>
        </div>
        <div className="workspace-preview-panel">
          <div className="workspace-panel-title"><strong>Live preview</strong><span>Desktop</span></div>
          <div className="mini-app">
            <div className="mini-app-side"><b>Workspace</b><span className="active">Overview</span><span>Customers</span><span>Orders</span><span>Reports</span></div>
            <div className="mini-app-main">
              <div className="mini-heading"><span>Business dashboard</span><strong>Overview</strong></div>
              <div className="mini-metrics"><div><small>Customers</small><b>1,284</b></div><div><small>Orders</small><b>8,231</b></div><div><small>Revenue</small><b>£92k</b></div></div>
              <div className="mini-chart"><span /><span /><span /><span /><span /><span /><span /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="one-home" id="home">
      <nav className="one-nav" aria-label="Primary navigation">
        <Link className="one-brand" href="/" aria-label="786.Chat home">
          <span className="one-brand-mark" aria-hidden="true">786</span>
          <span>786.Chat</span>
        </Link>

        <div className="one-nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </div>

        <div className="one-nav-actions">
          <Link className="one-signin" href="/login">Sign in</Link>
          <Link className="one-builder" href="/786.chat">Open builder <ArrowIcon /></Link>
        </div>
      </nav>

      <section className="one-hero">
        <div className="one-hero-copy">
          <div className="one-eyebrow">Agentic product engineering</div>
          <h1>
            Build production
            <span>apps by talking to AI</span>
          </h1>
          <p>
            Describe your idea, build it, preview it and prepare it for deployment from one intelligent 786.Chat workspace.
          </p>
          <div className="one-hero-actions">
            <Link className="one-button primary" href="/786.chat">Start building <ArrowIcon /></Link>
            <a className="one-button" href="#features">Explore features</a>
          </div>
          <div className="one-proof"><span><i>01</i> Describe</span><span><i>02</i> Build</span><span><i>03</i> Preview</span><span><i>04</i> Deploy</span></div>
        </div>
        <WorkspacePreview />
        <div className="one-status-row" aria-label="Platform workflow">
          <div className="one-status"><b>✓</b><span><strong>Build passed</strong><small>All checks green</small></span></div>
          <div className="one-status"><b>◉</b><span><strong>Preview live</strong><small>Clear project review</small></span></div>
          <div className="one-status"><b>◎</b><span><strong>Secure workspace</strong><small>Your project stays organised</small></span></div>
        </div>
      </section>

      <section className="one-section" id="features" aria-labelledby="workflow-heading">
        <div className="one-section-head">
          <span className="one-kicker">One workspace. Full lifecycle.</span>
          <h2 id="workflow-heading">From first idea to verified deployment.</h2>
          <p>Every section below is part of the normal page flow, so desktop and mobile visitors can scroll naturally without hidden areas or nested scrolling.</p>
        </div>
        <div className="one-grid">
          {buildCards.map(([number, title, copy]) => (
            <article className="one-card" key={title}>
              <span className="one-card-number">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="one-section one-build-section" aria-labelledby="build-heading">
        <div className="one-section-head">
          <span className="one-kicker">What you can build</span>
          <h2 id="build-heading">One builder for different kinds of projects.</h2>
          <p>Start with the outcome you need. 786.Chat keeps the creation process focused while the public homepage stays simple and reliable.</p>
        </div>
        <div className="one-build-grid">
          {productCards.map(([title, copy]) => (
            <article className="one-build-card" key={title}>
              <span className="build-card-glow" aria-hidden="true" />
              <strong>{title}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="one-section founder-section" id="about" aria-labelledby="founder-heading">
        <div className="founder-card">
          <div className="founder-photo-wrap">
            <div className="founder-photo-ring" aria-hidden="true" />
            <Image src="/images/founder.png" alt="Mujeeb Sardar, CEO of 786.Chat" width={360} height={360} className="founder-photo" />
          </div>
          <div className="founder-copy">
            <span className="one-kicker">Leadership</span>
            <h2 id="founder-heading">Mujeeb Sardar</h2>
            <div className="founder-role">CEO, 786.Chat</div>
            <p>786.Chat is built around a simple goal: make it easier to turn a business idea into a real application with a clear creation, preview and deployment workflow.</p>
            <div className="founder-highlights"><span>AI application builder</span><span>Business-first workflow</span><span>Built for real projects</span></div>
          </div>
        </div>
      </section>

      <section className="one-section about-band" aria-labelledby="about-heading">
        <div className="one-section-head">
          <span className="one-kicker">About 786.Chat</span>
          <h2 id="about-heading">A beautiful public site. A focused builder behind it.</h2>
          <p>The homepage explains the product and stays fast on every device. The real builder opens only when you choose Open builder, so the public page never mixes with the workspace again.</p>
        </div>
      </section>

      <footer className="one-footer">
        <span className="one-kicker">Ready to build?</span>
        <h2>Open your 786.Chat workspace.</h2>
        <p>If you already have an active session, Open builder takes you to the real builder. Otherwise, Sign in opens the login page first.</p>
        <div className="one-footer-actions">
          <Link className="one-button primary" href="/786.chat">Open builder <ArrowIcon /></Link>
          <Link className="one-button" href="/login">Sign in</Link>
        </div>
        <small>786.Chat · AI application builder</small>
      </footer>
    </main>
  )
}
