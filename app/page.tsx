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
  ["03", "Preview", "Review the result in a clear workspace before deployment."],
]

const productCards = [
  ["Web applications", "Dashboards, portals, customer systems and business tools."],
  ["Business websites", "Modern multi-page sites for companies, shops and services."],
  ["Commerce", "Product, ordering, checkout and customer-management experiences."],
  ["CRM & operations", "Customers, tasks, orders, reporting and internal workflows."],
]

export default function Home() {
  return (
    <main className="one-home" id="home">
      <nav className="one-nav" aria-label="Primary navigation">
        <Link className="one-brand" href="/" aria-label="786.Chat home">
          <span className="one-brand-mark" aria-hidden="true">786</span>
          <span>786.Chat</span>
        </Link>

        <div className="one-nav-links">
          <Link href="/">Home</Link>
          <Link href="/support">Support</Link>
        </div>

        <div className="one-nav-actions">
          <Link className="one-signin" href="/login">Sign in</Link>
          <Link className="one-builder" href="/786.chat">Open builder <ArrowIcon /></Link>
        </div>
      </nav>

      <section className="one-hero">
        <div className="one-eyebrow">AI application builder</div>
        <h1>
          Build production
          <span>apps by talking to AI</span>
        </h1>
        <p>
          Describe your idea, create the application, review the result and move to deployment from one focused 786.Chat workspace.
        </p>

        <div className="one-hero-actions">
          <Link className="one-button primary" href="/786.chat">Open builder <ArrowIcon /></Link>
          <Link className="one-button" href="/login">Sign in</Link>
          <Link className="one-button" href="/support">Support</Link>
        </div>

        <div className="one-status-row" aria-label="Platform workflow">
          <div className="one-status"><strong>Describe your idea</strong><span>Start with a normal-language request.</span></div>
          <div className="one-status"><strong>Build and preview</strong><span>Keep the project organised and reviewable.</span></div>
          <div className="one-status"><strong>Prepare to deploy</strong><span>Move from project to production workflow.</span></div>
        </div>
      </section>

      <section className="one-section" aria-labelledby="workflow-heading">
        <div className="one-section-head">
          <span className="one-kicker">Simple workflow</span>
          <h2 id="workflow-heading">From idea to working application.</h2>
          <p>No homepage demo panels, nested scrolling or hidden mobile areas. The real workspace opens only when you choose Open builder.</p>
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

      <section className="one-section" aria-labelledby="build-heading">
        <div className="one-section-head">
          <span className="one-kicker">What you can build</span>
          <h2 id="build-heading">One builder for different kinds of projects.</h2>
          <p>Start with the business outcome you need. 786.Chat keeps the creation process in one workspace.</p>
        </div>

        <div className="one-build-grid">
          {productCards.map(([title, copy]) => (
            <article className="one-build-card" key={title}>
              <strong>{title}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="one-section" aria-labelledby="about-heading">
        <div className="one-section-head">
          <span className="one-kicker">About 786.Chat</span>
          <h2 id="about-heading">A clear path from request to deployment.</h2>
          <p>786.Chat is designed to understand what you want to build, create the requested application, keep the result previewable and prepare the project for deployment without mixing the public homepage with the builder itself.</p>
        </div>
      </section>

      <footer className="one-footer">
        <span className="one-kicker">Ready to build?</span>
        <h2>Open your 786.Chat workspace.</h2>
        <p>If you already have an account, Open builder takes you directly to the builder route. If you need to authenticate first, use Sign in.</p>
        <div className="one-footer-actions">
          <Link className="one-button primary" href="/786.chat">Open builder <ArrowIcon /></Link>
          <Link className="one-button" href="/login">Sign in</Link>
          <Link className="one-button" href="/support">Support</Link>
        </div>
        <small>786.Chat · AI application builder</small>
      </footer>
    </main>
  )
}
