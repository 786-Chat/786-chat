export type AdminProjectTemplate = {
  id: string
  name: string
  description: string
  category: "business" | "commerce" | "content" | "product" | "personal"
  prompt: string
  files: Record<string, string>
}

const basePackage = JSON.stringify(
  {
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start" },
    dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0" },
    devDependencies: { typescript: "^5.0.0", "@types/node": "^22.0.0", "@types/react": "^19.0.0" },
  },
  null,
  2,
)

const layout = `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{margin:0,fontFamily:"Arial, sans-serif"}}>{children}</body></html>
}`

function page(title: string, subtitle: string, cta: string) {
  return `export default function Home() {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:32,background:"linear-gradient(135deg,#09090b,#18181b)",color:"white"}}>
      <section style={{maxWidth:880,textAlign:"center"}}>
        <p style={{letterSpacing:4,textTransform:"uppercase",opacity:.65}}>786 Chat AI Template</p>
        <h1 style={{fontSize:"clamp(3rem,8vw,6rem)",margin:"20px 0"}}>${title}</h1>
        <p style={{fontSize:20,lineHeight:1.6,opacity:.8}}>${subtitle}</p>
        <button style={{marginTop:28,padding:"14px 24px",borderRadius:999,border:0,fontWeight:700}}>${cta}</button>
      </section>
    </main>
  )
}`
}

const shared = { "package.json": basePackage, "app/layout.tsx": layout }

export const ADMIN_PROJECT_TEMPLATES: AdminProjectTemplate[] = [
  {
    id: "saas-launch",
    name: "SaaS Launch",
    description: "Conversion-focused SaaS landing page with a strong hero and call to action.",
    category: "product",
    prompt: "Create a polished SaaS product website with pricing, testimonials, FAQ, and responsive navigation.",
    files: { ...shared, "app/page.tsx": page("Launch your next big idea", "A clean starting point for an AI, software, or subscription product.", "Start free") },
  },
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Modern restaurant homepage ready for menus, reservations, and location details.",
    category: "business",
    prompt: "Create an elegant restaurant website with menu sections, reservation CTA, opening hours, gallery, and contact information.",
    files: { ...shared, "app/page.tsx": page("A memorable table awaits", "Seasonal food, warm hospitality, and an experience designed to bring people together.", "Reserve a table") },
  },
  {
    id: "storefront",
    name: "Storefront",
    description: "Starter storefront for products, collections, promotions, and checkout integration.",
    category: "commerce",
    prompt: "Create a premium ecommerce storefront with product cards, collections, trust signals, cart entry points, and mobile-first design.",
    files: { ...shared, "app/page.tsx": page("Products worth discovering", "A flexible storefront foundation for a modern online brand.", "Shop collection") },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Personal portfolio for projects, services, biography, and contact details.",
    category: "personal",
    prompt: "Create a distinctive professional portfolio with selected work, skills, biography, testimonials, and contact form.",
    files: { ...shared, "app/page.tsx": page("Work with purpose", "Showcase selected projects, capabilities, and the story behind the work.", "View projects") },
  },
  {
    id: "editorial-blog",
    name: "Editorial Blog",
    description: "Readable editorial layout for articles, categories, and newsletters.",
    category: "content",
    prompt: "Create a fast editorial blog with featured stories, article cards, categories, author details, search, and newsletter signup.",
    files: { ...shared, "app/page.tsx": page("Ideas that deserve attention", "A refined publishing foundation for essays, reporting, and thoughtful analysis.", "Read latest") },
  },
]

export function getAdminProjectTemplate(id: string) {
  return ADMIN_PROJECT_TEMPLATES.find((template) => template.id === id) ?? null
}
