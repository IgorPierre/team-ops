import { AgentCloud } from "@/components/agent-cloud";
import { AgentsDemo } from "@/components/agents-demo";
import { FaqAsciiCursor } from "@/components/ascii-cursor";
import { CtaExpand } from "@/components/cta-expand";
import { FeatureCards } from "@/components/feature-cards";
import { Hero } from "@/components/hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { getMessages } from "@/i18n";
import { InlineMarkup } from "@/i18n/markup";
import { GITHUB } from "@/lib/site";
import { bodyCopy, cn, more, section, sectionHead, sectionLead, sectionTitle, wrap } from "@/lib/styles";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getMessages(locale);

  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />

        <Reveal>
          <AgentCloud eyebrow={t.cloud.eyebrow} />
        </Reveal>

        <section className={cn(wrap, "py-10 text-center sm:py-16")}>
          <Reveal>
            <figure>
              <blockquote className="mx-auto max-w-[32ch] font-display text-[clamp(1.625rem,5vw+0.35rem,3.5rem)] leading-[1.2] font-normal text-ink sm:leading-[1.15]">
                <InlineMarkup text={t.quote.text} />
              </blockquote>
              <figcaption className="mt-6 text-[1.125rem] text-muted">{t.quote.caption}</figcaption>
            </figure>
          </Reveal>
        </section>

        <section className={cn(section, wrap)} id="product">
          <Reveal>
            <article className="min-w-0 rounded-lg border border-rule bg-paper p-4 shadow-card sm:p-8 lg:p-12">
              <h2 className={sectionTitle}>{t.product.title}</h2>
              <p className={cn(bodyCopy, "mt-5")}>
                <InlineMarkup text={t.product.p1} />
              </p>
              <p className={cn(bodyCopy, "mt-5")}>{t.product.p2}</p>
              <a className={more} href={GITHUB}>
                {t.product.install}
              </a>
            </article>
          </Reveal>
        </section>

        <section className={cn(section, wrap)} id="agents">
          <RevealGroup>
            <RevealItem>
              <div className={sectionHead}>
                <h2 className={sectionTitle}>{t.agents.title}</h2>
                <p className={sectionLead}>{t.agents.lead}</p>
              </div>
            </RevealItem>
            <RevealItem>
              <AgentsDemo />
            </RevealItem>
          </RevealGroup>
        </section>

        <FeatureCards copy={t.features} />

        <section className={cn(section, wrap, "relative")} id="faq">
          <FaqAsciiCursor />
          <div className="relative z-[1] mx-auto max-w-[56rem]">
            <Reveal>
              <h2 className={cn(sectionTitle, "mb-8 text-center sm:mb-14")}>{t.faq.title}</h2>
            </Reveal>
            <dl>
              {t.faq.items.map((item, i) => (
                <Reveal key={item.q} className={i === 0 ? undefined : "border-t border-rule pt-8"}>
                  <dt className="font-display text-[clamp(1.125rem,3vw,1.55rem)] leading-snug text-ink">{item.q}</dt>
                  <dd className="mt-3 max-w-[62ch] text-[clamp(1rem,2.5vw,1.2rem)] leading-[1.65] text-ink-2">{item.a}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <CtaExpand />
      </main>
      <SiteFooter navLabel={t.footer.nav} />
    </>
  );
}
