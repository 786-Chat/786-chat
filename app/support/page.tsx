import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Clock3, Mail, Phone, ShieldCheck } from "lucide-react"

import { SupportForm } from "@/components/launch/support-form"
import "../marketing-home.css"
import "./support-home.css"

export const metadata: Metadata = {
  title: "Support | 786.Chat",
  description: "Call 786.Chat support or send a tracked request for account, billing, build and deployment help.",
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <b>786</b>
    </span>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  )
}

export default function SupportPage() {
  return (
    <main className="marketing-home support-home">
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
      <Image
        className="hero-art support-background-art"
        src="https://seven86-chat-v2.link24-7days.chatgpt.site/hero-blue-glass-v2.png"
        alt=""
        width={1600}
        height={900}
        priority
        unoptimized
      />

      <nav className="site-nav" aria-label="Primary navigation">
        <Link className="site-brand" href="/" aria-label="786.Chat home">
          <BrandMark />
          <span>786.Chat</span>
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/support" aria-current="page">Support</Link>
        </div>
        <div className="nav-actions">
          <Link className="sign-in-link" href="/login">Sign in</Link>
          <Link className="nav-cta" href="/786.chat">Open builder <ArrowIcon /></Link>
        </div>
      </nav>

      <section className="support-page">
        <div className="support-intro">
          <div className="support-eyebrow"><span /> Customer support</div>
          <h1>Real help for your <span>786.Chat workspace.</span></h1>
          <p>Call us directly or send a tracked request for account, billing, application-generation, build or deployment help.</p>
          <div className="support-actions">
            <a className="support-phone-card" href="tel:+447427070000" aria-label="Call 786.Chat support on +44 7427 070000">
              <Phone aria-hidden="true" />
              <span><small>Call support</small><strong>+44 7427 070000</strong></span>
            </a>
            <Link className="support-back-home" href="/">Back to homepage</Link>
          </div>
        </div>

        <div className="support-layout">
          <aside className="support-details" aria-label="Support information">
            <article className="support-detail-card">
              <Clock3 aria-hidden="true" />
              <div><h2>Response target</h2><p>Normal requests are reviewed within one business day. Security reports are marked urgent.</p></div>
            </article>
            <article className="support-detail-card">
              <ShieldCheck aria-hidden="true" />
              <div><h2>Safe support</h2><p>Explain the problem and steps taken, but never include passwords, API keys or private tokens.</p></div>
            </article>
            <article className="support-detail-card">
              <Mail aria-hidden="true" />
              <div><h2>Tracked reference</h2><p>Every saved request returns a support reference that you can keep for follow-up.</p></div>
            </article>
          </aside>

          <section className="support-form-area" aria-labelledby="support-form-title">
            <span className="section-label">Send a request</span>
            <h2 id="support-form-title">How can we help?</h2>
            <p>Complete the form and our team will receive your request in the Support Inbox.</p>
            <SupportForm />
          </section>
        </div>
      </section>
    </main>
  )
}
