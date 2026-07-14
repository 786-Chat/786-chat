"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Youtube, Facebook, Instagram, Linkedin, MessageCircle, ArrowUpRight } from "lucide-react"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"
import useSWR from "swr"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const footerLinks = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/themes" },
    { label: "Import Website", href: "/import-website" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Register", href: "/register" },
  ],
  resources: [
    { label: "Start Building", href: "/register" },
    { label: "Browse Templates", href: "/themes" },
    { label: "AI Builder", href: "/dashboard" },
    { label: "Support", href: "/contact" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" },
  ],
}

interface SocialLinks {
  youtube?: string
  facebook?: string
  tiktok?: string
  instagram?: string
  linkedin?: string
  whatsapp?: string
}

const socialIconMap: Record<string, { icon: typeof Youtube | typeof TikTokIcon; label: string; color: string }> = {
  youtube: { icon: Youtube, label: "YouTube", color: "text-red-500" },
  facebook: { icon: Facebook, label: "Facebook", color: "text-blue-500" },
  tiktok: { icon: TikTokIcon, label: "TikTok", color: "text-foreground" },
  instagram: { icon: Instagram, label: "Instagram", color: "text-pink-500" },
  linkedin: { icon: Linkedin, label: "LinkedIn", color: "text-blue-600" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-green-500" },
}

const fetcher = (url: string) => fetch(url).then((response) => response.json())

export function Footer() {
  const { data } = useSWR<{ links: SocialLinks }>("/api/admin/social-links", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  })

  const activeSocialLinks = Object.entries(data?.links || {})
    .filter(([, url]) => url && url.trim() !== "")
    .map(([key, url]) => ({ key, url: url as string, ...socialIconMap[key] }))
    .filter((social) => Boolean(social.icon))

  return (
    <footer className="relative overflow-hidden border-t border-white/5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[250px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center lg:col-span-2 lg:text-left"
          >
            <Link href="/" aria-label="786 Chat AI home" className="inline-block">
              <div className="block sm:hidden"><MujeebProAILogo variant="compact" size="sm" /></div>
              <div className="hidden sm:block"><MujeebProAILogo variant="full" size="xl" /></div>
            </Link>
            <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mx-0">
              786 Chat AI helps customers generate, edit, collaborate on and deploy production-ready digital projects from one secure workspace.
            </p>

            {activeSocialLinks.length > 0 && (
              <div className="mt-8 flex justify-center gap-3 lg:justify-start">
                {activeSocialLinks.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <motion.a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 glass transition-all hover:border-primary/30 hover:bg-primary/10"
                      aria-label={social.label}
                    >
                      <Icon className={`h-5 w-5 ${social.color}`} />
                    </motion.a>
                  )
                })}
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-3">
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{category}</h3>
                <ul className="mt-5 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 translate-x-0.5 -translate-y-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 border-t border-white/5 pt-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h3 className="text-lg font-semibold">Stay up to date</h3>
              <p className="mt-1 text-sm text-muted-foreground">Receive 786 Chat AI product and platform updates.</p>
            </div>
            <form className="flex w-full max-w-md gap-3" onSubmit={(event) => event.preventDefault()}>
              <input type="email" aria-label="Newsletter email" placeholder="Enter your email" className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-foreground glass placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="h-12 rounded-xl bg-gradient-to-r from-primary to-accent px-6 font-medium text-primary-foreground transition-opacity hover:opacity-90">Subscribe</motion.button>
            </form>
          </div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} 786 Chat AI. All rights reserved.</p>
          <p className="text-sm text-muted-foreground">AI creation, editing and deployment in one workspace.</p>
        </div>
      </div>
    </footer>
  )
}
