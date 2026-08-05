import {
  designVariantNumber,
  selectDesignFamily,
  type DesignFamily,
} from "./design-system"
import { selectSystemBlueprint, type SystemBlueprint } from "./system-blueprints"
import { classifyApplicationEdit } from "./edit-intent"

export type ProjectPlatform = "web" | "mobile" | "backend" | "database" | "iot"

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
  databaseTables: string[]
  designFamily: DesignFamily
  designVariant: number
  platforms: ProjectPlatform[]
  systemBlueprint: SystemBlueprint | null
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

function withoutNegativeRequirements(prompt: string) {
  return prompt.replace(
    /\b(?:do not|don't|must not|should not|exclude|without|no need(?:\s+for)?|no)[^.!?\n]*/gi,
    " ",
  )
}

export function analyseProjectPrompt(
  prompt: string,
  seed = prompt,
  familyHistory: readonly string[] = [],
): ProjectSpecification {
  const positivePrompt = withoutNegativeRequirements(prompt)
  const systemBlueprint = selectSystemBlueprint(positivePrompt)
  const editIntent = classifyApplicationEdit(positivePrompt)
  const pageMatches = PAGE_ALIASES.filter(([pattern]) => pattern.test(positivePrompt))
  const loginRequested = /\blog[ -]?in|sign[ -]?in\b/i.test(positivePrompt)
  // A request for a login/register page can be a visual UI request only. Do not
  // force a complete database-backed authentication system unless the customer
  // explicitly asks for functional authentication, accounts, sessions or a backend.
  const functionalAuthRequested = /\bauth(?:entication|orization)?\b|\b(?:working|functional|secure|real|database[- ]backed)\s+(?:log[ -]?in|sign[ -]?in|register|sign[ -]?up)\b|\buser accounts?\b|\baccount system\b|\bsessions?\b/i.test(positivePrompt)
  const requestedRoutes = explicitRoutes(prompt)
  const routes = unique([
    "/",
    ...pageMatches.map(([, , route]) => route),
    ...requestedRoutes,
    ...(systemBlueprint?.routes || []),
  ])
  if (routes.length === 0) routes.push("/")
  const pages = unique([
    "Home",
    ...pageMatches.map(([, page]) => page),
    ...requestedRoutes.map((route) =>
      route
        .split("/")
        .filter(Boolean)
        .map((part) => part.replaceAll("-", " "))
        .join(" / "),
    ),
  ]).filter(Boolean)
  if (pages.length === 0) pages.push("Home")

  const requiredComponents = matches(positivePrompt, [
    // "Make navigation links work" validates route integrity; it does not mean
    // the edited page must contain a header/nav container. Require a navigation
    // component only when the customer explicitly asks for a nav, navbar,
    // navigation menu, menu bar, or header.
    [/\bnav\b|\bnavbar\b|\bnavigation\s+(?:bar|menu)\b|\bmenu\s+bar\b|\bheader\b/i, "navigation"],
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

  const industry = matches(prompt, [
    [/\brestaurant|food|cafe|takeaway\b/i, "food-and-hospitality"],
    [/\bproperty|real estate|estate agent\b/i, "property"],
    [/\bmedical|clinic|health\b/i, "healthcare"],
    [/\bfinance|bank|accounting\b/i, "finance"],
    [/\beducation|school|course\b/i, "education"],
    [/\becommerce|shop|store\b/i, "commerce"],
    [/\bmanufactur|factory|production line\b/i, "manufacturing"],
    [/\biot|sensor|device|telemetry\b/i, "iot"],
  ])[0] || null
  const designFamily = selectDesignFamily(
    seed,
    designDirection,
    `${prompt} ${industry || ""}`,
    familyHistory,
  )
  const platforms = unique([
    "web",
    ...(/\bmobile app|android|iphone|ipad|ios|expo|react native\b/i.test(positivePrompt) ? ["mobile"] : []),
    ...(/\bapi|backend|server|saas|crm|erp|upload|attachment|email\b/i.test(positivePrompt) || functionalAuthRequested || systemBlueprint ? ["backend"] : []),
    ...(/\bdatabase|postgres|neon|relational|upload|attachment\b/i.test(positivePrompt) || functionalAuthRequested || systemBlueprint ? ["database"] : []),
    ...(/\biot|sensor|device|telemetry|mqtt|bluetooth|firmware\b/i.test(positivePrompt) ? ["iot"] : []),
  ]) as ProjectPlatform[]

  return {
    projectType: /\bdashboard|portal|saas|crm|erp\b/i.test(prompt)
      ? "web-application"
      : /\bmobile app|android|iphone|ios\b/i.test(prompt)
        ? "mobile-application"
        : "website",
    brand: prompt.match(/\b(?:called|named|brand(?:ed)?)\s+["']?([A-Z][\w -]{1,40})/i)?.[1]?.trim() || null,
    industry,
    pages,
    routes,
    requiredComponents: unique(requiredComponents),
    requiredInteractions: unique(matches(prompt, [
      [/\blog[ -]?in|sign[ -]?in\b/i, "submit-login"],
      [/\bbooking|appointment\b/i, "submit-booking"],
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
    backendRequirements: unique(matches(positivePrompt, [
      [/\bdatabase|postgres|neon\b/i, "database"],
      [functionalAuthRequested ? /[\s\S]/ : /(?!)/, "authentication"],
      [/\bapi\b/i, "api"],
      [/\bpayment|stripe\b/i, "payments"],
      [/\b(?:send|deliver|transactional|notification|contact)\s+emails?\b|\bemail service\b|\bresend\b/i, "email"],
      [/\bupload|attachment|file storage|blob\b/i, "file-storage"],
    ])),
    databaseTables: editIntent.requestedTable ? [editIntent.requestedTable] : [],
    designFamily,
    designVariant: designVariantNumber(designFamily.id, familyHistory),
    platforms,
    systemBlueprint,
  }
}
