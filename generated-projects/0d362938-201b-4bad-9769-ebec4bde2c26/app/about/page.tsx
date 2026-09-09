import PageHero from '@/components/PageHero';

export default function AboutPage() {
  return (
    <>
      <PageHero title="Our Story" subtitle="A journey of flavor and tradition" />
      <section className="py-16">
        <div className="container-custom max-w-3xl space-y-6 text-lg leading-relaxed">
          <p>
            Saffron Table was founded in 2010 with a vision to bring the rich culinary heritage of India to the modern table.
            Our chefs combine traditional techniques with contemporary presentation to create dishes that are both familiar and exciting.
          </p>
          <p>
            We source the finest ingredients from local farms and import authentic spices from India to ensure every dish is a celebration of flavor.
            Our dining room is designed to evoke the warmth and elegance of Indian hospitality, with deep greens, cream, and gold accents.
          </p>
          <p>
            Whether you are joining us for a casual dinner or a special celebration, we promise an unforgettable experience.
          </p>
        </div>
      </section>
    </>
  );
}