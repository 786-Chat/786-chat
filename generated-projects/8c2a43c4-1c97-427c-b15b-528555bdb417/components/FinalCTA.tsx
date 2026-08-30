import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="section bg-neutral-950 text-white">
      <div className="container text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-6">Start Your Coffee Journey</h2>
        <p className="text-neutral-300 max-w-xl mx-auto mb-10">
          Join our community of coffee lovers and discover your new favorite brew.
        </p>
        <Link href="/contact" className="btn-primary">
          Contact Us
        </Link>
      </div>
    </section>
  );
}