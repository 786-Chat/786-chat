import { selectDesignFamily, type DesignFamily } from "./design-system"

export type ProjectSpecification = {
  projectType: string
  brand: string | null
  industry: string | null
  pages: string[]
  routes: string[]
  requiredComponents: string[]
  requiredInteractions: string[]
  designDirection: string[]
  colours: string[]
  contentRequirements: string[]
  backendRequirements: string[]
  designFamily: DesignFamily
}

const PAGE_ALIASES: Array<[RegExp, string, string]> = [
  [/\bhome(?:page)?\b/i, "Home", "/"],
  [/\blog[ -]?in|sign[ -]?in\b/i, "Login", "/login"],
  [/\bregister|sign[ -]?up\b/i, "Register", "/register"],
  [/\bdashboard\b/i, "Dashboard", "/dashboard"],
  [/\bpricing\b/i, "Pricing", "/pricing"],
  [/\bservices?\b/i, "Services", "/services"],
  [/\babout\b/i, "About", "/about"],
  [/\bcontact\b/i, "Contact", "/contact"],
  [/\bbooking|appointment\b/i, "Booking", "/booking"],
  [/\bgallery\b/i, "Gallery", "/gallery"],
  [/\bfaq(?:s)?\b/i, "FAQ", "/faq"],
  [/\bblog\b/i, "Blog", "/blog"],
  [/\bsettings\b/i, "Settings", "/settings"],
  [/\bprofile\b/i, "Profile", "/profile"],
  [/\bcheckout\b/i, "Checkout", "/checkout"],
]

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function explicitRoutes(prompt: string) {
  return Array.from(
    prompt.matchAll(/(?:^|\s)(\/[a-z0-9][a-z0-9/_-]*)/gi),
    (match) => match[1].replace(/\/+$/, "") || "/",
  )
}

function matches(prompt: string, candidates: Array<[RegExp, string]>) {
  return candidates.filter(([pattern]) => pattern.test(prompt)).map(([, value]) => value)
}

export function analyseProjectPrompt(prompt: string, seed = prompt): ProjectSpecification {
  const pageMatches = PAGE_ALIASES.filter(([pattern]) => pattern.test(prompt))
  const loginRequested = /\blog[ -]?in|sign[ -]?in\b/i.test(prompt)
  const requestedRoutes = explicitRoutes(prompt)
  const routes = unique([
    ...pageMatches.map(([, , route]) => route),
    ...requestedRoutes,
    ...(loginRequested ? ["/forgot-password"] : []),
  ])
  if (routes.length === 0) routes.push("/")
  const pages = unique([
    ...pageMatches.map(([, page]) => page),
    ...(loginRequested ? ["Forgot Password"] : []),
    ...requestedRoutes.map((route) =>
      route
        .split("/")
        .filter(Boolean)
        .map((part) => part.replaceAll("-", " "))
        .join(" / "),
    ),
  ]).filter(Boolean)
  if (pages.length === 0) pages.push("Home")

  const requiredComponents = matches(prompt, [
    [/\bnav(?:igation)?|header\b/i, "navigation"],
    [/\bhero\b/i, "hero"],
    [/\bform\b|log[ -]?in|register|contact/i, "form"],
    [/\btable\b/i, "data-table"],
    [/\bchart|analytics\b/i, "chart"],
    [/\bfooter\b/i, "footer"],
  ])
  if (loginRequested) {
    requiredComponents.push("email-input", "password-input", "remember-me", "forgot-password-link", "submit-button")
  }

  const designDirection = unique(matches(prompt, [
    [/\bmodern\b/i, "modern"],
    [/\bpremium|luxury|vvip\b/i, "premium"],
    [/\b3d\b/i, "3d-depth"],
    [/\bminimal\b/i, "minimal"],
    [/\banimat/i, "motion"],
    [/\bdark\b/i, "dark"],
    [/\blight\b/i, "light"],
  ]))

  return {
    projectType: /\bdashboard|portal|saas|crm|erp\b/i.test(prompt)
      ? "web-application"
      : /\bmobile app|android|iphone|ios\b/i.test(prompt)
        ? "mobile-application"
        : "website",
    brand: prompt.match(/\b(?:called|named|brand(?:ed)?)\s+["']?([A-Z][\w -]{1,40})/i)?.[1]?.trim() || null,
    industry: matches(prompt, [
      [/\brestaurant|food|cafe|takeaway\b/i, "food-and-hospitality"],
      [/\bproperty|real estate|estate agent\b/i, "property"],
      [/\bmedical|clinic|health\b/i, "healthcare"],
      [/\bfinance|bank|accounting\b/i, "finance"],
      [/\beducation|school|course\b/i, "education"],
      [/\becommerce|shop|store\b/i, "commerce"],
    ])[0] || null,
    pages,
    routes,
    requiredComponents: unique(requiredComponents),
    requiredInteractions: unique(matches(prompt, [
      [/\blog[ -]?in|sign[ -]?in\b/i, "submit-login"],
      [/\bsearch\b/i, "search"],
      [/\bfilter\b/i, "filter"],
      [/\bmodal|dialog\b/i, "modal"],
      [/\bdropdown\b/i, "dropdown"],
      [/\bupload|attachment\b/i, "file-upload"],
    ])),
    designDirection,
    colours: unique(Array.from(prompt.matchAll(/\b(?:red|orange|yellow|green|emerald|blue|cyan|purple|violet|pink|black|white|gold|silver|navy|teal)\b/gi), (match) => match[0].toLowerCase())),
    contentRequirements: unique(matches(prompt, [
      [/\bimage|photo|gallery\b/i, "project-specific-images"],
      [/\btestimonial\b/i, "testimonials"],
      [/\bfaq\b/i, "faq"],
      [/\bpricing\b/i, "pricing-content"],
    ])),
    backendRequirements: unique(matches(prompt, [
      [/\bdatabase|postgres|neon\b/i, "database"],
      [/\bauth|log[ -]?in|register\b/i, "authentication"],
      [/\bapi\b/i, "api"],
      [/\bpayment|stripe\b/i, "payments"],
      [/\bemail\b/i, "email"],
    ])),
    designFamily: selectDesignFamily(seed, designDirection),
  }
}
