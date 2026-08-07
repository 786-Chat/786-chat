export default function About() {
  return (
    <div className="fade-in py-16 px-4 max-w-4xl mx-auto text-center">
      <h1 className="section-title">Our Story</h1>
      <p className="text-lg text-gold/80 leading-relaxed mb-6">Founded in 1998, Royal Spice brings the grandeur of Indian royal kitchens to your table. Our chefs blend traditional spices with modern flair.</p>
      <div className="grid md:grid-cols-3 gap-6">
        {['25+ Years', '50+ Dishes', '100k Guests'].map((s,i)=>(
          <div key={i} className="card"><p className="text-4xl font-bold gold-text">{s.split(' ')[0]}</p><p className="text-gold/70">{s.split(' ').slice(1).join(' ')}</p></div>
        ))}
      </div>
    </div>
  );
}
