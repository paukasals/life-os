import { faqs } from "@/lib/faq-data";

export default function FAQSection() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-coral">
        Questions
      </p>
      <h2 className="mt-2 text-center font-display text-3xl font-semibold">
        Everything you&apos;re wondering
      </h2>
      <div className="mt-10 divide-y divide-navy/10">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-navy">
              {faq.question}
              <span className="shrink-0 text-coral transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-navy/70">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
