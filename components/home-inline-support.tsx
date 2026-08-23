"use client";

import Image from "next/image";
import { Clock3, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

import { SupportForm } from "@/components/launch/support-form";
import { mujeebSardarPhoto } from "@/app/support/ceo-photo";
import "@/app/support/support-home.css";

export function HomeInlineSupport() {
  return (
    <section
      className="support-home homepage-support"
      id="support"
      aria-labelledby="homepage-support-title"
      style={{ scrollMarginTop: "96px" }}
    >
      <div className="support-page">
        <div className="support-intro">
          <div className="support-eyebrow"><span /> Customer support</div>
          <h1 id="homepage-support-title">Real help for your <span>786.Chat workspace.</span></h1>
          <p>Call us directly or send a tracked request for account, billing, application-generation, build or deployment help.</p>
          <div className="support-actions">
            <a className="support-phone-card" href="tel:+447427070000" aria-label="Call 786.Chat support on +44 7427 070000">
              <Phone aria-hidden="true" />
              <span><small>Call support</small><strong>+44 7427 070000</strong></span>
            </a>
            <a className="support-back-home" href="#home">Back to top</a>
          </div>
        </div>

        <section className="ceo-profile-card" aria-labelledby="homepage-ceo-name">
          <div className="ceo-photo-frame">
            <Image
              className="ceo-photo"
              src={mujeebSardarPhoto}
              alt="Mujeeb Sardar, CEO of 786.CHAT"
              width={640}
              height={640}
              unoptimized
            />
          </div>
          <div className="ceo-profile-copy">
            <span className="section-label">Leadership</span>
            <h2 id="homepage-ceo-name">Mujeeb Sardar</h2>
            <p>CEO, 786.CHAT</p>
          </div>
        </section>

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
              <MapPin aria-hidden="true" />
              <div>
                <h2>Business address</h2>
                <address>786.CHAT<br />104 Ilford Ln<br />Ilford IG1 2LD</address>
              </div>
            </article>
            <article className="support-detail-card">
              <Mail aria-hidden="true" />
              <div><h2>Tracked reference</h2><p>Every saved request returns a support reference that you can keep for follow-up.</p></div>
            </article>
          </aside>

          <section className="support-form-area" aria-labelledby="homepage-support-form-title">
            <span className="section-label">Send a request</span>
            <h2 id="homepage-support-form-title">How can we help?</h2>
            <p>Complete the form and our team will receive your request in the Support Inbox.</p>
            <SupportForm />
          </section>
        </div>
      </div>
    </section>
  );
}
