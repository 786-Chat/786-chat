export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight text-navy-900 md:text-5xl">
        Get in touch
      </h1>
      <p className="mt-4 text-lg text-navy-500">
        Have a question or need support? Fill out the form and we&apos;ll get back to you within 24 hours.
      </p>
      <form className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-navy-300 px-4 py-2 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border border-navy-300 px-4 py-2 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="message" className="block text-sm font-medium text-navy-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="mt-1 block w-full rounded-md border border-navy-300 px-4 py-2 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-cyan-700"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
}
