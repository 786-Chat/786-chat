import { dishes } from '@/lib/data';

export default function Menu() {
  return (
    <div className="fade-in py-16 px-4 max-w-6xl mx-auto">
      <h1 className="section-title">Our Menu</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes.map((d,i)=>(
          <div key={i} className="card">
            <h3 className="text-xl font-bold gold-text mb-1">{d.name}</h3>
            <p className="text-gold/70 mb-3">{d.desc}</p>
            <span className="text-2xl font-bold text-red-400">${d.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
