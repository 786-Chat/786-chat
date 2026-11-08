// synthetic-journey-edit:7e672117-47c4-4bd5-ad94-3492189d70b1
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <section id="contact" className="bg-warm-gray/30 py-20 sm:py-28">
          <div className="container-custom">
            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <h2 className="section-title">Get in Touch</h2>
                <p className="section-subtitle">
                  Have a question or want to collaborate? Send us a message and we&apos;ll respond promptly.
                </p>
              </div>
              <div className="mt-12">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}