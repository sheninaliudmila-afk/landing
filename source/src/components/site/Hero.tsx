import { ArrowUpRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import consultant from "@/assets/alekseeva-portrait.jpg";

const FOCUS = ["Стратегия для бизнеса", "Управление прибылью", "Защита личного капитала"];

export function Hero() {
  return (
    <section id="about" aria-labelledby="hero-title" className="relative overflow-hidden pt-[72px]">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="bg-spot pointer-events-none absolute inset-0" />
      <div className="container-x relative grid items-center gap-12 pb-14 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-20 lg:pt-20">
        <div className="animate-fade-up">
          <p className="eyebrow">
            <span className="status-dot" /> Независимый финансовый консультант
          </p>
          <p className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Алексеева Людмила</p>
          <h1 id="hero-title" className="h-display mt-4 text-[clamp(2.7rem,6.6vw,5.4rem)]">
            Финансы под контролем.
            <span className="mt-1 block text-coral-gradient">Бизнес — на&nbsp;шаг вперёд.</span>
          </h1>
          <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            Помогаю собственникам бизнеса и топ-менеджерам выстраивать финансовую стратегию, увеличивать прибыль и
            защищать активы.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild variant="coral" size="xl">
              <a href="#contact">
                Записаться на консультацию <ArrowUpRight />
              </a>
            </Button>
            <a
              href="#video"
              className="group inline-flex h-14 items-center gap-3 rounded-full px-3 text-[0.95rem] font-semibold"
            >
              <span className="grid size-10 place-items-center rounded-full border border-border-strong transition-colors group-hover:border-primary group-hover:bg-primary">
                <Play className="size-3.5 fill-current" />
              </span>
              Смотреть видео
            </a>
          </div>
          <a
            href="#diagnostic"
            className="mt-8 inline-flex flex-wrap items-center gap-x-2 rounded-full border border-border bg-card/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50"
          >
            Не знаете, с чего начать?
            <span className="font-semibold text-foreground">Пройдите экспресс-тест ↗</span>
          </a>
        </div>

        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="relative overflow-hidden rounded-[2rem] border border-border shadow-card">
            <img
              src={consultant}
              alt="Алексеева Людмила — финансовый консультант, с ноутбуком в светлом офисе"
              width={1536}
              height={1920}
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover object-[center_20%] sm:aspect-[5/4] lg:aspect-[4/5]"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-[image:var(--gradient-fade)] opacity-80" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/75 px-3.5 py-2 text-[0.66rem] font-bold tracking-[0.16em] backdrop-blur-md">
              <span className="status-dot" /> ВАШ ПАРТНЁР В ФИНАНСОВЫХ РЕШЕНИЯХ
            </div>
          </div>
          <div className="absolute -bottom-6 left-4 flex items-center gap-4 rounded-2xl border border-border bg-card/90 p-4 pr-6 shadow-card backdrop-blur-xl animate-float sm:-left-6">
            <strong className="text-5xl font-extrabold tracking-tighter">
              20<span className="text-primary">+</span>
            </strong>
            <span className="text-sm leading-snug text-muted-foreground">
              лет практики
              <br />в финансах
            </span>
          </div>
        </div>
      </div>

      <div className="container-x relative pb-6">
        <ul aria-label="Направления работы" className="grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {FOCUS.map((item, i) => (
            <li key={item} className="group flex items-center justify-between gap-4 py-6 sm:px-6 first:sm:pl-0">
              <span className="text-xs font-bold text-primary">0{i + 1} /</span>
              <p className="flex-1 text-base font-semibold">{item}</p>
              <ArrowUpRight className="size-5 text-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
