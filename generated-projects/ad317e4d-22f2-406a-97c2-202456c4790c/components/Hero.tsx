import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
        alt="Coffee beans and brewing"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-coffee-black/40 via-transparent to-coffee-black/60" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-coffee-white">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-coffee-white/80">
          Est. 2024 — A Journey in Every Cup
        </p>
        <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-balance">
          786 Journey<br />Coffee
        </h1>
        <p className="mt-6 max-w-md text-sm sm:text-base text-coffee-white/80">
          From the first sip to the last drop, we craft a coffee experience that lingers.
        </p>
        <Link
          href="/services"
          className="mt-10 inline-block border border-coffee-white/50 px-8 py-3 text-xs uppercase tracking-widest transition-colors hover:bg-coffee-white hover:text-coffee-black"
        >
          Explore Services
        </Link>
      </div>
    </section>
  );
}