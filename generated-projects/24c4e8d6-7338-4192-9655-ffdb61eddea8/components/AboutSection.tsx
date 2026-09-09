export default function AboutSection() {
  return (
    <section className="py-16 bg-coffee-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-cream mb-6">Our Story</h2>
          <p className="text-cream/80 text-lg leading-relaxed">
            Bean House was founded with a simple mission: to serve the perfect cup of coffee. We source our beans from sustainable farms around the world, roast them in small batches, and brew each cup with care. Our baristas are passionate about their craft, and it shows in every sip.
          </p>
        </div>
        <div className="bg-coffee-800 rounded-lg p-8 border border-gold/20">
          <h3 className="font-serif text-2xl font-semibold text-gold mb-4">Why Choose Us?</h3>
          <ul className="space-y-3 text-cream/80">
            <li>• Single-origin, ethically sourced beans</li>
            <li>• Small-batch roasting for peak freshness</li>
            <li>• Expertly trained baristas</li>
            <li>• Cozy, welcoming atmosphere</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
