import { ArrowUpRight, Compass } from "lucide-react";
import { Reveal } from "./Reveal";
import { NAVIGATOR_URL } from "./Header";

export function AnalysisEntry() {
  return (
    <div id="business-navigator" className="container-x">
      <Reveal className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2rem] border border-border bg-card p-7 sm:flex-row sm:items-center sm:p-9">
        <div aria-hidden="true" className="bg-spot pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative flex items-center gap-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Compass className="size-6" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight sm:text-xl">Нужен более глубокий разбор?</p>
            <p id="analysis-entry-note" className="mt-1 text-sm text-muted-foreground">
              Оценка контроля, финансовая карта и симулятор показателей. Откроется в новой вкладке.
            </p>
          </div>
        </div>
        <a
          href={NAVIGATOR_URL}
          target="_blank"
          rel="noopener"
          aria-describedby="analysis-entry-note"
          className="relative inline-flex min-h-14 items-center gap-3 rounded-full bg-primary px-7 py-3 text-[0.95rem] font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-glow"
        >
          Расширенный анализ деятельности компании
          <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </Reveal>
    </div>
  );
}
