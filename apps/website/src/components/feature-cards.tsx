import Image from "next/image";

import { AgnosticBackground } from "@/components/agnostic-background";
import { MagnetLinesBackground } from "@/components/magnet-lines-background";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardTitle } from "@/components/ui/card";
import type { Messages } from "@/i18n";
import { InlineMarkup } from "@/i18n/markup";
import { CLIS } from "@/lib/clis";
import { GITHUB } from "@/lib/site";
import { wrap } from "@/lib/styles";

export function FeatureCards({ copy }: { copy: Messages["features"] }) {
  return (
    <section className={`${wrap} py-16`} id="features">
      <div className="grid min-w-0 gap-6 sm:grid-cols-2">
        <Card
          className="min-h-[300px] rounded-2xl bg-origin-border shadow-lg"
          contentClassName="min-h-[300px]"
          background={<AgnosticBackground />}
        >
          <CardTitle>{copy.aTitle}</CardTitle>
          <CardBody className="text-ink-2">{copy.aBody}</CardBody>
          <CardFooter>
            <div className="flex flex-row flex-wrap items-center gap-x-5 gap-y-3 md:gap-x-6">
              {CLIS.map((cli) => (
                <span key={cli.name} className="flex items-center gap-2 opacity-55 transition-opacity duration-300 hover:opacity-100">
                  <Image
                    src={cli.src}
                    alt=""
                    title={cli.name}
                    width={28}
                    height={28}
                    className="size-7 brightness-0"
                  />
                  <span className="font-brand text-sm text-ink">{cli.name}</span>
                </span>
              ))}
            </div>
          </CardFooter>
        </Card>

        <Card>
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

        <Card>
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

        <Card
          className="min-h-[300px] rounded-2xl bg-origin-border shadow-lg"
          contentClassName="min-h-[300px]"
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
      </div>
    </section>
  );
}
