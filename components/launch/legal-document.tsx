import { ContentCard, LaunchHeader, LaunchShell } from "@/components/launch/page-shell"

export type LegalSection = {
  title: string
  paragraphs?: string[]
  items?: string[]
}

export function LegalDocument({
  eyebrow,
  title,
  description,
  updated,
  sections,
}: {
  eyebrow: string
  title: string
  description: string
  updated: string
  sections: LegalSection[]
}) {
  return (
    <LaunchShell>
      <LaunchHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <p className="text-sm text-white/45">Last updated: {updated}</p>
          {sections.map((section) => (
            <ContentCard key={section.title}>
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-white/60">
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && <ul className="list-disc space-y-2 pl-5">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
              </div>
            </ContentCard>
          ))}
        </div>
      </section>
    </LaunchShell>
  )
}
