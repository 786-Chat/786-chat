import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="py-20 sm:py-28">
        <div className="container-custom">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h1 className="section-title">Contact Us</h1>
              <p className="section-subtitle">
                We&apos;d love to hear from you. Reach out with any questions, feedback, or collaboration ideas.
              </p>
            </div>
            <div className="mt-12">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}