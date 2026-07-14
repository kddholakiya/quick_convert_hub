import type { ToolSlug } from "@/lib/tools-metadata";
import { TOOL_SEO_CONTENT } from "@/lib/tool-seo-content";

export default function ToolSeoContent({ slug }: { slug: ToolSlug }) {
  const content = TOOL_SEO_CONTENT[slug];

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": content.faq.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

      <section className="max-w-4xl mx-auto px-4 py-10 space-y-8 text-zinc-400">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-100">{content.heading}</h2>
          <p className="text-sm leading-relaxed">{content.intro}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.features.map((feature) => (
            <div key={feature.title} className="space-y-1.5">
              <h3 className="text-sm font-semibold text-zinc-200">{feature.title}</h3>
              <p className="text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-100">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {content.faq.map((item) => (
              <div key={item.q} className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-200">{item.q}</h3>
                <p className="text-xs leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
