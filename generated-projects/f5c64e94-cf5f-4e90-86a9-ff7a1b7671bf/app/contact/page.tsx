import { ContactForm } from './contact-form';

export const metadata = {
  title: 'Contact | Bean House',
  description: 'Get in touch with Bean House.',
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-neutral-600 mb-8">We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you soon.</p>
      <ContactForm />
    </main>
  );
}
