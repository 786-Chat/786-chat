export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-brown to-gold text-cream py-24 px-4 text-center">
      <h1 className="text-5xl md:text-6xl font-extrabold mb-4">Welcome to Bean House</h1>
      <p className="text-xl md:text-2xl mb-8">Crafting the perfect cup, one bean at a time.</p>
      <a
        href="#menu"
        className="inline-block bg-cream text-brown font-semibold px-8 py-3 rounded-full hover:bg-gold hover:text-cream transition"
      >
        Explore Our Menu
      </a>
    </section>
  );
}
