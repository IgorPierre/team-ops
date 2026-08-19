import Image from "next/image";

import { AgnosticBackground } from "@/components/agnostic-background";
import { MagnetLinesBackground } from "@/components/magnet-lines-background";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardTitle } from "@/components/ui/card";
import type { Messages } from "@/i18n";
import { InlineMarkup } from "@/i18n/markup";
import { CLIS } from "@/lib/clis";
import { GITHUB } from "@/lib/site";
import { sectionHead, sectionLead, sectionTitle, wrap } from "@/lib/styles";

export function FeatureCards({ copy }: { copy: Messages["features"] }) {
  return (
    <section className={`${wrap} py-10 sm:py-16`} id="features">
      <Reveal>
        <div className={sectionHead}>
          <h2 className={sectionTitle}>{copy.title}</h2>
          <p className={sectionLead}>{copy.lead}</p>
        </div>
      </Reveal>
      <RevealGroup className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-6">
        <RevealItem className="h-full min-w-0">
          <Card
            className="h-full min-h-[240px] rounded-2xl bg-origin-border shadow-lg sm:min-h-[300px]"
            contentClassName="min-h-[240px] sm:min-h-[300px]"
            background={<AgnosticBackground />}
          >
            <CardTitle>{copy.aTitle}</CardTitle>
            <CardBody className="text-ink-2">{copy.aBody}</CardBody>
            <CardFooter>
              <div className="flex flex-row flex-wrap items-center gap-x-5 gap-y-3 md:gap-x-6">
                {CLIS.filter((cli) => cli.name !== "OpenCode" && cli.name !== "Qwen").map((cli) => (
                  <span key={cli.name} className="flex items-center gap-2 opacity-55 transition-opacity duration-300 hover:opacity-100">
                    <Image
                      src={cli.src}
                      alt=""
                      title={cli.name}
                      width={28}
                      height={28}
                      className="size-7 brightness-0 dark:invert"
                    />
                    <span className="font-brand text-sm text-ink">{cli.name}</span>
                  </span>
                ))}
              </div>
            </CardFooter>
          </Card>
        </RevealItem>

        <RevealItem className="h-full min-w-0">
          <Card className="h-full">
            <CardTitle>{copy.bTitle}</CardTitle>
            <CardBody className="text-ink-2">
              <InlineMarkup text={copy.bBody} />
            </CardBody>
            <CardFooter>
              <Button variant="pill" href="#product">
                {copy.bCta}
              </Button>
            </CardFooter>
          </Card>
        </RevealItem>

        <RevealItem className="h-full min-w-0">
          <Card className="h-full">
            <CardTitle>{copy.cTitle}</CardTitle>
            <CardBody className="text-ink-2">
              <InlineMarkup text={copy.cBody} />
            </CardBody>
            <CardFooter>
              <Button variant="pill" href={GITHUB}>
                {copy.cCta}
              </Button>
            </CardFooter>
          </Card>
        </RevealItem>

        <RevealItem className="h-full min-w-0">
          <Card
            className="h-full min-h-[240px] rounded-2xl bg-origin-border shadow-lg sm:min-h-[300px]"
            contentClassName="min-h-[240px] sm:min-h-[300px]"
            background={<MagnetLinesBackground />}
          >
            <CardTitle>{copy.dTitle}</CardTitle>
            <CardBody className="text-ink-2">{copy.dBody}</CardBody>
            <CardFooter>
              <Button variant="pill" href={GITHUB}>
                {copy.dCta}
              </Button>
            </CardFooter>
          </Card>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
