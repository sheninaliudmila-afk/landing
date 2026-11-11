import { Building2 } from "lucide-react";
import { Reveal } from "./Reveal";

const COMPANIES: { name: string; mark: React.ReactNode; wide?: boolean }[] = [
  {
    name: "Сбербанк",
    mark: (
      <span className="flex items-center gap-3 text-2xl font-extrabold tracking-tight" style={{ color: "#21A038" }}>
        <svg viewBox="0 0 32 32" className="h-8" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#21A038" />
          <path d="m9 15 6 5 12-11" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Сбербанк
      </span>
    ),
  },
  {
    name: "ВТБ",
    mark: (
      <span className="flex items-center gap-3 text-2xl font-black italic" style={{ color: "#4D8BFF" }}>
        <svg viewBox="0 0 40 30" className="h-6" fill="none" aria-hidden="true">
          <path d="M10 5h28M6 14h28M2 23h28" stroke="#1F6BFF" strokeWidth="5" />
        </svg>
        ВТБ
      </span>
    ),
  },
  {
    name: "Газпром",
    mark: (
      <span className="flex items-center gap-3" style={{ color: "#1A9AE6" }}>
        <svg viewBox="0 0 22 30" className="h-8" fill="none" aria-hidden="true">
          <path d="M11 1C11 9 1 13 4 22c1 4 4 6 7 7-5-9 8-13 0-28Z" fill="currentColor" />
          <path d="M15 10c10 12 1 18-4 19 9-8 0-11 4-19Z" fill="currentColor" />
        </svg>
        <span className="text-xl font-extrabold tracking-wide">ГАЗПРОМ</span>
      </span>
    ),
  },
  {
    name: "Альфа-Банк",
    mark: (
      <span className="flex items-center gap-3 text-lg font-bold" style={{ color: "#EF3124" }}>
        <span className="relative text-3xl font-black leading-none" aria-hidden="true">
          А<span className="absolute -bottom-1 left-0 h-1 w-full bg-current" />
        </span>
        Альфа-Банк
      </span>
    ),
  },
  {
    name: "Строительные компании",
    wide: true,
    mark: (
      <span className="flex items-center gap-4">
        <Building2 className="size-9 text-primary" strokeWidth={1.75} />
        <span className="text-left text-lg font-bold leading-tight">
          Строительные
          <br />
          компании
        </span>
      </span>
    ),
  },
];

export function Clients() {
  return (
    <section id="clients" aria-labelledby="clients-title" className="section-y container-x">
      <Reveal className="mb-12">
        <div>
          <p className="kicker">03 — Опыт сотрудничества</p>
          <h2 id="clients-title" className="h-section mt-5">
            Российские компании,
            <span className="muted-heading block">с которыми я работала.</span>
          </h2>
        </div>
      </Reveal>
      <ul aria-label="Компании из портфолио" className="grid grid-cols-2 overflow-hidden rounded-3xl border border-border md:grid-cols-3">
        {COMPANIES.map((c, i) => (
          <Reveal
            as="li"
            key={c.name}
            delay={i * 60}
            className={`-mb-px -mr-px flex h-32 ${c.wide ? "col-span-2" : ""} items-center justify-center border-b border-r border-border px-4 text-foreground transition-colors duration-300 hover:bg-card md:h-40`}
          >
            <span className="sr-only">{c.name}</span>
            <span aria-hidden="true">{c.mark}</span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
