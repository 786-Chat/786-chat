interface PageHeroProps {
  title: string;
  subtitle?: string;
}

export default function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="bg-brand-green text-brand-cream py-16 text-center">
      <div className="container-custom">
        <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-brand-cream/80">{subtitle}</p>}
      </div>
    </section>
  );
}