import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHead({
  kicker,
  title,
  muted,
  intro,
  id,
}: {
  kicker: string;
  title: ReactNode;
  muted?: ReactNode;
  intro?: ReactNode;
  id: string;
}) {
  return (
    <Reveal className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 id={id} className="h-section mt-5">
          {title}
          {muted && <span className="muted-heading block">{muted}</span>}
        </h2>
      </div>
      {intro && <p className="max-w-sm text-base leading-relaxed text-muted-foreground md:text-right">{intro}</p>}
    </Reveal>
  );
}
