export default function Gallery() {
  const images = [
    { label: "Roasting", emoji: "🔥" },
    { label: "Brewing", emoji: "☕" },
    { label: "Tasting", emoji: "👅" },
  ];

  return (
    <section className="section bg-neutral-50">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">The Craft</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.label} className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="text-5xl mb-4">{image.emoji}</div>
              <h3 className="text-lg font-semibold">{image.label}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}