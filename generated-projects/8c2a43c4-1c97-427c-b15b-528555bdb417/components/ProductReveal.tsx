export default function ProductReveal() {
  return (
    <section className="section bg-neutral-950 text-white">
      <div className="container grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm uppercase tracking-widest text-neutral-400 mb-4">Signature Blend</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">The 786 Blend</h2>
          <p className="text-neutral-300 mb-8">
            A balanced, full-bodied roast with notes of dark chocolate, caramel, and a hint of citrus. Perfect for any brewing method.
          </p>
          <a href="/contact" className="btn-primary">Order Now</a>
        </div>
        <div className="bg-neutral-800 rounded-3xl aspect-square flex items-center justify-center">
          <span className="text-6xl">☕</span>
        </div>
      </div>
    </section>
  );
}