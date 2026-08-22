import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Lobsteria for catering, press, or questions.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-coral">
        Contact
      </p>
      <h1 className="mt-2 text-center font-display text-4xl font-semibold">Get in touch</h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-navy/70">
        Catering inquiries, private events, press, or just want to say hi — reach out and we&apos;ll
        get back to you within a couple of days.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="rounded-2xl bg-shell p-6 ring-1 ring-navy/10">
          <h2 className="font-display text-lg font-semibold">Catering & private events</h2>
          <p className="mt-2 text-sm text-navy/70">
            Book the Airstream for weddings, corporate events, and parties.
          </p>
          <a
            href={`mailto:${siteConfig.email}?subject=Catering Inquiry`}
            className="mt-4 inline-block text-sm font-semibold text-teal hover:text-coral"
          >
            {siteConfig.email}
          </a>
        </div>

        <div className="rounded-2xl bg-shell p-6 ring-1 ring-navy/10">
          <h2 className="font-display text-lg font-semibold">General questions</h2>
          <p className="mt-2 text-sm text-navy/70">
            Menu questions, feedback, or lost & found — call or text us directly.
          </p>
          <a
            href={`tel:${siteConfig.phone}`}
            className="mt-4 inline-block text-sm font-semibold text-teal hover:text-coral"
          >
            {siteConfig.phone}
          </a>
        </div>
      </div>

      <form
        action={`mailto:${siteConfig.email}`}
        method="POST"
        encType="text/plain"
        className="mt-14 space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1.5 w-full rounded-lg border border-navy/20 bg-shell px-4 py-2.5 text-sm outline-none focus:border-teal"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1.5 w-full rounded-lg border border-navy/20 bg-shell px-4 py-2.5 text-sm outline-none focus:border-teal"
            />
          </div>
        </div>
        <div>
          <label htmlFor="message" className="text-sm font-medium">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="mt-1.5 w-full rounded-lg border border-navy/20 bg-shell px-4 py-2.5 text-sm outline-none focus:border-teal"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3 text-sm font-semibold text-shell hover:bg-coral-dark"
        >
          Send message
        </button>
        <p className="text-xs text-navy/50">
          This opens your email client. Want a form that submits directly without opening email?
          Swap this for a service like Formspree — see the note in website/README.md.
        </p>
      </form>
    </div>
  );
}
