import { notFound } from "next/navigation"
import { sql } from "@/lib/db"

interface Props {
  params: Promise<{
    subdomain: string
    slug: string
  }>
}

export default async function DynamicSitePage({ params }: Props) {
  const { subdomain, slug } = await params
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "").toLowerCase()

  const [site] = await sql`
    SELECT id, site_name, subdomain, is_published, is_locked, subscription_status
    FROM customer_sites
    WHERE subdomain = ${subdomain}
    LIMIT 1
  `

  if (!site || !site.is_published || site.is_locked || site.subscription_status === "suspended") {
    notFound()
  }

  const [page] = await sql`
    SELECT title, html_content
    FROM customer_site_pages
    WHERE site_id = ${site.id}
      AND slug = ${cleanSlug}
      AND is_published = true
    LIMIT 1
  `

  if (!page || !page.html_content) {
    notFound()
  }

  return (
    <main
      dangerouslySetInnerHTML={{
        __html: page.html_content,
      }}
    />
  )
}
