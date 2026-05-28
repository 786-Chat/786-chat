"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Youtube, Facebook, Instagram, Linkedin, MessageCircle, ArrowUpRight } from "lucide-react"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"
import useSWR from "swr"

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Themes", href: "/themes" },
    { label: "Import Website", href: "/import-website" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Register", href: "/register" },
  ],
  resources: [
    { label: "Get Started", href: "/register" },
    { label: "Browse Themes", href: "/themes" },
    { label: "Menu Builder", href: "/dashboard" },
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

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function Footer() {
  const { data } = useSWR<{ links: SocialLinks }>("/api/admin/social-links", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // Cache for 5 minutes
  })

  const socialLinks = data?.links || {}
  const activeSocialLinks = Object.entries(socialLinks)
    .filter(([, url]) => url && url.trim() !== "")
    .map(([key, url]) => ({
      key,
      url: url as string,
      ...socialIconMap[key]
    }))

  return (
    <footer className="relative border-t border-white/5 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 text-center lg:text-left"
          >
            <Link href="/" className="inline-block">
              {/* Mobile: smaller logo */}
              <div className="block sm:hidden">
                <MujeebProAILogo variant="compact" size="sm" />
              </div>
              {/* Desktop: full logo */}
              <div className="hidden sm:block">
                <MujeebProAILogo variant="full" size="xl" />
              </div>
            </Link>
            <p className="mt-6 max-w-xs text-sm text-muted-foreground leading-relaxed mx-auto lg:mx-0">
              MujeebProAI helps restaurants, cafes, takeaways, and local businesses launch professional websites and ordering systems quickly.
            </p>
            
            {/* Social Links */}
            {activeSocialLinks.length > 0 && (
              <div className="mt-8 flex gap-3 justify-center lg:justify-start">
                {activeSocialLinks.map((social, i) => {
                  const IconComponent = social.icon
                  return (
                    <motion.a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl glass border border-white/5 hover:border-primary/30 hover:bg-primary/10 transition-all"
                      aria-label={social.label}
                    >
                      <IconComponent className={`h-5 w-5 ${social.color}`} />
                    </motion.a>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-3">
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  {category}
                </h3>
                <ul className="mt-5 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 pt-10 border-t border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold">Stay up to date</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get the latest news and updates delivered to your inbox.
              </p>
            </div>
            <div className="flex w-full max-w-md gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-xl glass border border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-accent font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 pt-8 border-t border-white/5 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MujeebProAI. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Built with <span className="text-red-500">&#9829;</span> for businesses worldwide
          </p>
        </div>
      </div>
    </footer>
  )
}
