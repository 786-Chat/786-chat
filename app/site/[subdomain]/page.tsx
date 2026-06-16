"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"
import { InstallAppButton } from "@/components/install-app-button"

interface SiteConfig {
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
  borderRadius?: string
}

interface SiteContent {
  hero?: {
    title?: string
    subtitle?: string
    ctaText?: string
    ctaLink?: string
    backgroundImage?: string
  }
  about?: {
    title?: string
    description?: string
    image?: string
  }
  features?: Array<{
    title?: string
    description?: string
    icon?: string
  }>
  contact?: {
    email?: string
    phone?: string
    address?: string
  }
  footer?: {
    copyright?: string
    socialLinks?: {
      twitter?: string
      facebook?: string
      linkedin?: string
      instagram?: string
    }
  }
}

interface Site {
  id: string
  site_name: string
  subdomain: string
  site_config: SiteConfig | null
  site_content: SiteContent | null
  logo_url: string | null
  favicon_url: string | null
  theme_name: string | null
  theme_slug: string | null
}

const defaultConfig: Required<SiteConfig> = {
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Inter",
  borderRadius: "8px",
}

const defaultContent: Required<SiteContent> = {
  hero: {
    title: "Welcome",
    subtitle: "Your site is ready",
    ctaText: "Get Started",
    ctaLink: "#contact",
    backgroundImage: "",
  },
  about: {
    title: "About Us",
    description: "Tell your customers about your business.",
    image: "",
  },
  features: [],
  contact: {
    email: "",
    phone: "",
    address: "",
  },
  footer: {
    copyright: "",
    socialLinks: {},
  },
}

function isFineDiningTheme(site: Site) {
  const themeText = `${site.theme_slug || ""} ${site.theme_name || ""}`.toLowerCase()
  return (
    themeText.includes("fine") ||
    themeText.includes("dining") ||
    themeText.includes("restaurant") ||
    themeText.includes("luxe")
  )
}

export default function CustomerSitePage() {
  const params = useParams()
  const [site, setSite] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [suspended, setSuspended] = useState(false)

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/sites/public?subdomain=${params.subdomain}`)

        if (res.ok) {
          const data = await res.json()

          if (data.suspended) {
            setSuspended(true)
            setSite(data.site)
          } else {
            setSite(data.site)
          }
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.subdomain) {
      fetchSite()
    }
  }, [params.subdomain])

  const config = useMemo(() => {
    return {
      ...defaultConfig,
      ...(site?.site_config || {}),
    }
  }, [site])

  const content = useMemo(() => {
    return {
      ...defaultContent,
      ...(site?.site_content || {}),
      hero: {
        ...defaultContent.hero,
        ...(site?.site_content?.hero || {}),
      },
      about: {
        ...defaultContent.about,
        ...(site?.site_content?.about || {}),
      },
      contact: {
        ...defaultContent.contact,
        ...(site?.site_content?.contact || {}),
      },
      footer: {
        ...defaultContent.footer,
        ...(site?.site_content?.footer || {}),
        socialLinks: {
          ...(site?.site_content?.footer?.socialLinks || {}),
        },
      },
      features: site?.site_content?.features || [],
    }
  }, [site])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (notFound || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Site Not Found</h1>
          <p className="text-gray-600 mb-8">
            The site you&apos;re looking for doesn&apos;t exist or hasn&apos;t been published yet.
          </p>
          <a
            href="https://mujeebproai.com/themes"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your Own Site
          </a>
        </div>
      </div>
    )
  }

  if (suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Website Temporarily Unavailable
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This website is temporarily unavailable. Please contact the business owner directly for assistance.
            </p>
            {site.site_name && (
              <p className="text-sm text-gray-500">
                Business: <span className="font-medium text-gray-700">{site.site_name}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const fineDining = isFineDiningTheme(site)

  if (fineDining) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

          body {
            margin: 0;
            padding: 0;
            background: #080604;
            color: #f8ead2;
            font-family: Inter, sans-serif;
          }
        `}</style>

        <div className="min-h-screen bg-[#080604] text-[#f8ead2]">
          <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080604]/85 backdrop-blur-xl border-b border-[#d4af37]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center gap-3">
                  {site.logo_url && (
                    <img src={site.logo_url} alt={site.site_name} className="h-11 w-11 object-contain rounded-full" />
                  )}
                  <div>
                    <p className="text-[10px] tracking-[0.35em] uppercase text-[#d4af37]">Fine Dining</p>
                    <span className="font-serif text-2xl font-bold text-[#f8ead2]">
                      {site.site_name}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-[0.2em]">
                  <a href="#about" className="text-[#f8ead2]/80 hover:text-[#d4af37] transition-colors">About</a>
                  <a href="#features" className="text-[#f8ead2]/80 hover:text-[#d4af37] transition-colors">Menu</a>
                  <a href="#contact" className="text-[#f8ead2]/80 hover:text-[#d4af37] transition-colors">Contact</a>
                  <InstallAppButton appName={site.site_name} variant="outline" size="sm" className="border-[#d4af37]/60 text-[#d4af37]" />
                </div>
              </div>
            </div>
          </nav>

          <section
            className="relative min-h-screen flex items-center justify-center overflow-hidden px-4"
            style={{
              backgroundImage: content.hero.backgroundImage
                ? `linear-gradient(rgba(8,6,4,0.72), rgba(8,6,4,0.86)), url(${content.hero.backgroundImage})`
                : "radial-gradient(circle at top, #3b2610 0%, #080604 55%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(212,175,55,0.08)_1px,transparent_1px),linear-gradient(rgba(212,175,55,0.08)_1px,transparent_1px)] bg-[size:80px_80px]" />
            <div className="relative z-10 max-w-5xl mx-auto text-center pt-24">
              <p className="text-[#d4af37] uppercase tracking-[0.45em] text-xs mb-6">
                Luxury Restaurant Experience
              </p>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8">
                {content.hero.title}
              </h1>
              <p className="text-lg md:text-2xl text-[#f8ead2]/75 max-w-3xl mx-auto mb-12 leading-relaxed">
                {content.hero.subtitle}
              </p>
              <a
                href={content.hero.ctaLink || "#contact"}
                className="inline-flex items-center justify-center px-10 py-4 bg-[#d4af37] text-[#080604] font-bold uppercase tracking-[0.22em] rounded-full hover:bg-[#f8ead2] transition-all"
              >
                {content.hero.ctaText || "Book Now"}
              </a>
            </div>
          </section>

          <section id="about" className="py-24 px-4 bg-[#0d0906]">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#d4af37] uppercase tracking-[0.35em] text-xs mb-4">Our Story</p>
                <h2 className="font-serif text-4xl md:text-6xl font-bold mb-8">
                  {content.about.title}
                </h2>
                <p className="text-[#f8ead2]/75 text-lg leading-9">
                  {content.about.description}
                </p>
              </div>

              <div className="rounded-[2rem] overflow-hidden border border-[#d4af37]/30 bg-[#17100a] shadow-2xl">
                {content.about.image ? (
                  <img src={content.about.image} alt={content.about.title} className="w-full h-[420px] object-cover" />
                ) : (
                  <div className="h-[420px] flex items-center justify-center text-[#d4af37] font-serif text-4xl">
                    {site.site_name}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="features" className="py-24 px-4 bg-[#080604]">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-[#d4af37] uppercase tracking-[0.35em] text-xs mb-4">Signature Highlights</p>
                <h2 className="font-serif text-4xl md:text-6xl font-bold">Experience Excellence</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {(content.features.length > 0 ? content.features : [
                  { title: "Premium Dining", description: "A refined restaurant experience designed for memorable moments." },
                  { title: "Fresh Ingredients", description: "Carefully selected ingredients prepared with attention and passion." },
                  { title: "Elegant Atmosphere", description: "A luxury setting for family meals, dates, celebrations and business dining." },
                ]).map((feature, index) => (
                  <div key={index} className="p-8 rounded-[1.5rem] bg-[#120d08] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mb-6">
                      <span className="text-[#d4af37] text-2xl">✦</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-4 text-[#f8ead2]">
                      {feature.title}
                    </h3>
                    <p className="text-[#f8ead2]/65 leading-7">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="contact" className="py-24 px-4 bg-[#0d0906]">
            <div className="max-w-5xl mx-auto text-center">
              <p className="text-[#d4af37] uppercase tracking-[0.35em] text-xs mb-4">Visit Us</p>
              <h2 className="font-serif text-4xl md:text-6xl font-bold mb-14">Get In Touch</h2>

              <div className="grid md:grid-cols-3 gap-8">
                {content.contact.email && (
                  <div className="p-8 rounded-[1.5rem] bg-[#120d08] border border-[#d4af37]/20">
                    <h3 className="font-serif text-2xl mb-3 text-[#d4af37]">Email</h3>
                    <a href={`mailto:${content.contact.email}`} className="text-[#f8ead2]/75 hover:text-[#d4af37]">
                      {content.contact.email}
                    </a>
                  </div>
                )}

                {content.contact.phone && (
                  <div className="p-8 rounded-[1.5rem] bg-[#120d08] border border-[#d4af37]/20">
                    <h3 className="font-serif text-2xl mb-3 text-[#d4af37]">Phone</h3>
                    <a href={`tel:${content.contact.phone}`} className="text-[#f8ead2]/75 hover:text-[#d4af37]">
                      {content.contact.phone}
                    </a>
                  </div>
                )}

                {content.contact.address && (
                  <div className="p-8 rounded-[1.5rem] bg-[#120d08] border border-[#d4af37]/20">
                    <h3 className="font-serif text-2xl mb-3 text-[#d4af37]">Address</h3>
                    <p className="text-[#f8ead2]/75">{content.contact.address}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <footer className="py-10 px-4 bg-[#050403] border-t border-[#d4af37]/20">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-sm text-[#f8ead2]/55">
                {content.footer.copyright || `© ${new Date().getFullYear()} ${site.site_name}. All rights reserved.`}
              </p>

              <div className="flex items-center gap-5 text-sm text-[#f8ead2]/55">
                {content.footer.socialLinks?.twitter && <a href={content.footer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37]">Twitter</a>}
                {content.footer.socialLinks?.facebook && <a href={content.footer.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37]">Facebook</a>}
                {content.footer.socialLinks?.linkedin && <a href={content.footer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37]">LinkedIn</a>}
                {content.footer.socialLinks?.instagram && <a href={content.footer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#d4af37]">Instagram</a>}
              </div>
            </div>
          </footer>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(" ", "+")}:wght@400;500;600;700&display=swap');

        body {
          font-family: var(--font-family);
          background-color: var(--background-color);
          color: var(--text-color);
          margin: 0;
          padding: 0;
        }

        :root {
          --primary-color: ${config.primaryColor};
          --secondary-color: ${config.secondaryColor};
          --background-color: ${config.backgroundColor};
          --text-color: ${config.textColor};
          --font-family: '${config.fontFamily}', sans-serif;
          --border-radius: ${config.borderRadius};
        }
      `}</style>

      <div className="min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style={{ backgroundColor: `${config.backgroundColor}ee` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {site.logo_url && <img src={site.logo_url} alt={site.site_name} className="h-8 w-8 object-contain" />}
                <span className="font-bold text-xl" style={{ color: config.primaryColor }}>
                  {site.site_name}
                </span>
              </div>

              <div className="hidden md:flex items-center gap-6">
                <a href="#about" className="text-sm hover:opacity-70 transition-opacity">About</a>
                {content.features.length > 0 && <a href="#features" className="text-sm hover:opacity-70 transition-opacity">Features</a>}
                <a href="#contact" className="text-sm hover:opacity-70 transition-opacity">Contact</a>
                <InstallAppButton variant="outline" size="sm" appName={site.site_name} className="ml-2" />
              </div>
            </div>
          </div>
        </nav>

        <section
          className="min-h-screen flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: config.primaryColor,
            backgroundImage: content.hero.backgroundImage ? `url(${content.hero.backgroundImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {content.hero.backgroundImage && <div className="absolute inset-0 bg-black/50" />}

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {content.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto">
              {content.hero.subtitle}
            </p>
            <a
              href={content.hero.ctaLink}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: config.secondaryColor,
                color: "white",
                borderRadius: config.borderRadius,
              }}
            >
              {content.hero.ctaText}
            </a>
          </div>
        </section>

        <section id="about" className="py-20 px-4" style={{ backgroundColor: config.backgroundColor }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{content.about.title}</h2>
            <p className="text-lg leading-relaxed opacity-80">{content.about.description}</p>

            {content.about.image && (
              <img
                src={content.about.image}
                alt={content.about.title}
                className="mt-10 rounded-lg shadow-xl mx-auto max-w-full"
                style={{ borderRadius: config.borderRadius }}
              />
            )}
          </div>
        </section>

        {content.features.length > 0 && (
          <section id="features" className="py-20 px-4" style={{ backgroundColor: `${config.primaryColor}08` }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Features</h2>

              <div className="grid md:grid-cols-3 gap-8">
                {content.features.map((feature, index) => (
                  <div key={index} className="p-6 rounded-lg bg-white shadow-lg" style={{ borderRadius: config.borderRadius }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${config.primaryColor}20` }}>
                      <span style={{ color: config.primaryColor }}>★</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="opacity-70">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="contact" className="py-20 px-4" style={{ backgroundColor: config.backgroundColor }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Get In Touch</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {content.contact.email && (
                <div className="p-6">
                  <h3 className="font-semibold mb-2">Email</h3>
                  <a href={`mailto:${content.contact.email}`} className="opacity-70 hover:opacity-100 transition-opacity">
                    {content.contact.email}
                  </a>
                </div>
              )}

              {content.contact.phone && (
                <div className="p-6">
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <a href={`tel:${content.contact.phone}`} className="opacity-70 hover:opacity-100 transition-opacity">
                    {content.contact.phone}
                  </a>
                </div>
              )}

              {content.contact.address && (
                <div className="p-6">
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="opacity-70">{content.contact.address}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="py-8 px-4" style={{ backgroundColor: config.textColor, color: config.backgroundColor }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm opacity-80">
                {content.footer.copyright || `© ${new Date().getFullYear()} ${site.site_name}. All rights reserved.`}
              </p>

              <div className="flex items-center gap-4">
                {content.footer.socialLinks?.twitter && <a href={content.footer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">Twitter</a>}
                {content.footer.socialLinks?.facebook && <a href={content.footer.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">Facebook</a>}
                {content.footer.socialLinks?.linkedin && <a href={content.footer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">LinkedIn</a>}
                {content.footer.socialLinks?.instagram && <a href={content.footer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">Instagram</a>}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
