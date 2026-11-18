import { Brand } from "./brand";

/** Form column for sign-in, registration, onboarding and OAuth consent (Carbon). */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-6">
      <div className="flex flex-col gap-6">
        <Brand className="lg:hidden" />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-foreground text-2xl leading-[1.1] font-medium tracking-tight text-balance">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground text-sm text-balance">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
      {footer ? (
        <div className="text-muted-foreground text-sm text-balance">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
