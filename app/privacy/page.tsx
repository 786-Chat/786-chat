import type { Metadata } from "next"

import { LegalDocument, type LegalSection } from "@/components/launch/legal-document"

export const metadata: Metadata = { title: "Privacy policy | 786.Chat", description: "How 786.Chat collects, uses, protects and retains personal data." }

const sections: LegalSection[] = [
  { title: "1. Who this policy covers", paragraphs: ["This policy applies to visitors, account holders and business customers using 786.Chat. 786.Chat is the controller for account, billing, support and platform-usage data it determines how to process. Generated applications may make a customer the controller of data collected through that application."] },
  { title: "2. Data we collect", items: ["Account details such as name, email, password hash, verification state, plan and session-security state.", "Project prompts, generated source, revisions, build logs, deployment history, domains and encrypted project-secret records.", "Billing identifiers, subscription status, payment references and usage or credit ledgers. Full payment-card details are handled by Stripe, not stored by 786.Chat.", "Support messages, operational events, incident records, device/browser information and security rate-limit identifiers stored as hashes where appropriate.", "Page-view and performance information collected through first-party Vercel Analytics when enabled."] },
  { title: "3. Why we use data", items: ["Provide accounts, generation, editing, builds, deployments, billing and support.", "Verify identity, prevent abuse, isolate customer projects, enforce limits and investigate security incidents.", "Measure reliability, cost and feature usage; repair failed builds and improve the service.", "Comply with legal, tax, fraud-prevention and dispute-resolution obligations."] },
  { title: "4. Legal bases", paragraphs: ["Depending on the context, processing is necessary to perform our contract, meet legal obligations, protect legitimate interests in security and service improvement, or act on consent where required. You may withdraw consent without affecting earlier lawful processing."] },
  { title: "5. Service providers", paragraphs: ["We use infrastructure and specialist providers including Vercel, Neon, GitHub, AI model providers selected by the platform, Stripe, Resend and storage or monitoring integrations. They receive only the data needed for their role and operate under their own terms and privacy obligations."] },
  { title: "6. AI processing", paragraphs: ["Prompts and necessary project context are sent to configured AI providers to generate or edit applications. Provider attempts, token usage, latency and estimated cost may be recorded. Do not place unnecessary personal, confidential, medical or financial data in prompts."] },
  { title: "7. Retention", paragraphs: ["We retain account and project data while the account is active and for a reasonable period needed for recovery, security, billing, legal claims and backups. Security, billing and incident records may be retained longer where necessary. You may request deletion, subject to legal and technical limits."] },
  { title: "8. International transfers", paragraphs: ["Providers may process data outside the United Kingdom. Where required, transfers use recognised safeguards such as adequacy decisions or contractual protections."] },
  { title: "9. Your rights", items: ["Ask for access, correction, deletion or restriction.", "Object to certain processing or request portability where applicable.", "Withdraw consent and complain to the UK Information Commissioner’s Office or your local regulator.", "Use the support form to make a privacy request; we may need to verify identity before acting."] },
  { title: "10. Security and cookies", paragraphs: ["We use hashed passwords, verified email, revocable sessions, encryption, tenant checks, rate limits and generated-code validation. No internet service is risk-free. Essential cookies maintain secure sessions; first-party analytics may measure product performance."] },
  { title: "11. Children and changes", paragraphs: ["786.Chat is not directed to children under 16. We may update this policy as the service changes and will publish the revised date and any material notice required."] },
  { title: "12. Contact", paragraphs: ["Submit privacy questions or rights requests through the 786.Chat Support page and choose Account or Security. Never include passwords, API keys or private customer data in the request."] },
]

export default function PrivacyPage() {
  return <LegalDocument eyebrow="Legal" title="Privacy policy" description="How personal data moves through the 786.Chat service and the choices available to you." updated="3 August 2026" sections={sections} />
}
