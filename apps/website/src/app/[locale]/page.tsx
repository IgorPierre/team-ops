import { AgentCloud } from "@/components/agent-cloud";
import { AgentsDemo } from "@/components/agents-demo";
import { FeatureCards } from "@/components/feature-cards";
import { Hero } from "@/components/hero";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { getMessages, isLocale } from "@/i18n";
import { InlineMarkup } from "@/i18n/markup";
import { bodyCopy, cn, more, section, sectionHead, sectionLead, sectionTitle, wrap } from "@/lib/styles";

const GITHUB = "https://github.com/team-ops/team-ops";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const home = `/${isLocale(locale) ? locale : "en"}`;

  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />

        <AgentCloud eyebrow={t.cloud.eyebrow} />

        <section className={cn(wrap, "py-16 text-center")}>
          <figure>
            <blockquote className="mx-auto max-w-[32ch] font-display text-[clamp(2rem,4.2vw+0.5rem,3.5rem)] leading-[1.15] font-normal text-ink">
              <InlineMarkup text={t.quote.text} />
            </blockquote>
            <figcaption className="mt-6 text-[1.125rem] text-muted">{t.quote.caption}</figcaption>
          </figure>
        </section>

        <section className={cn(section, wrap)} id="product">
          <article className="min-w-0 rounded-lg border border-rule bg-paper p-8 shadow-card lg:p-12">
            <h2 className={sectionTitle}>{t.product.title}</h2>
            <p className={cn(bodyCopy, "mt-5")}>
              <InlineMarkup text={t.product.p1} />
            </p>
            <p className={cn(bodyCopy, "mt-5")}>{t.product.p2}</p>
            <a className={more} href={GITHUB}>
              {t.product.install}
            </a>
          </article>
        </section>

        <section className={cn(section, wrap)} id="agents">
          <div className={sectionHead}>
            <h2 className={sectionTitle}>{t.agents.title}</h2>
            <p className={sectionLead}>{t.agents.lead}</p>
          </div>
          <AgentsDemo />
        </section>

        <FeatureCards copy={t.features} />

        <section className={cn(section, wrap)} id="faq">
          <div className="mx-auto max-w-[56rem]">
            <h2 className={cn(sectionTitle, "mb-14 text-center")}>{t.faq.title}</h2>
            <dl>
              {t.faq.items.map((item) => (
                <div key={item.q} className="border-t border-rule pt-8 first:border-t-0 first:pt-0">
                  <dt className="font-display text-[1.4rem] leading-snug text-ink sm:text-[1.55rem]">{item.q}</dt>
                  <dd className="mt-3 max-w-[62ch] text-[1.2rem] leading-[1.65] text-ink-2">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={cn(wrap, "py-24 text-center")}>
          <h2 className={cn(sectionTitle, "mb-8")}>{t.cta.title}</h2>
          <Button variant="accent" href={GITHUB}>
            {t.cta.github}
          </Button>
        </section>
      </main>
      <footer className="border-t border-rule py-6">
        <div className={cn(wrap, "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[1rem] text-muted")}>
          <p>Team-Ops · MIT</p>
          <nav className="flex flex-wrap gap-4" aria-label={t.footer.nav}>
            <a className="hover:text-ink" href={GITHUB}>
              GitHub
            </a>
            <a className="hover:text-ink" href={GITHUB}>
              {t.footer.install}
            </a>
            <a className="hover:text-ink" href={`${home}#faq`}>
              {t.footer.faq}
            </a>
            <a className="hover:text-ink" href={`${GITHUB}/blob/main/SECURITY.md`}>
              {t.footer.security}
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
