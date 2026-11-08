import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Services from "@/components/Services";

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="py-20 sm:py-28">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="section-title">Our Services</h1>
            <p className="section-subtitle mx-auto max-w-2xl">
              Discover what makes 786 Journey Coffee special — from our carefully sourced beans to our community events.
            </p>
          </div>
          <div className="mt-16">
            <Services />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}