import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Quote, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";
import { useContact } from "./ContactContext";
import portraits from "@/assets/demo-portraits.webp";

const TABS = ["Отзывы", "Кейсы", "Формат работы", "Услуги"];

function SlideHeading({ eyebrow, title, hint }: { eyebrow: string; title: string; hint: string }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h3>
      </div>
      <span className="text-sm text-subtle">{hint}</span>
    </div>
  );
}

const REVIEWS = [
  {
    text: "Наконец стало понятно, сколько бизнес зарабатывает и какую сумму можно направить на развитие. Вместо разрозненных таблиц — единая картина.",
    name: "Анна М.",
    role: "Собственник торговой компании",
    pos: "left center",
    alt: "Демонстрационный портрет клиентки",
  },
  {
    text: "Платёжный календарь помог заранее видеть нагрузку на деньги. Теперь обсуждаем решения на основе цифр, а не ощущений.",
    name: "Дмитрий К.",
    role: "Руководитель сервисной компании",
    pos: "right center",
    alt: "Демонстрационный портрет клиента",
  },
];

const CASES = [
  {
    sector: "Торговая компания",
    title: "Вернуть контроль над прибыльностью",
    value: "+50",
    valueNote: "к чистой прибыли",
    rows: [
      ["Прибыль / мес.", "600 тыс. ₽", "900 тыс. ₽"],
      ["Рентабельность", "12%", "18%"],
    ],
    method: "Учёт по направлениям, анализ затрат и контроль маржи.",
    calc: "При выручке 5 млн ₽/мес. расходы: 4,4 → 4,1 млн ₽. Рентабельность: +6 п. п.",
  },
  {
    sector: "Сервисная компания",
    title: "Укрепить денежный резерв компании",
    value: "+75",
    valueNote: "к денежному резерву",
    rows: [
      ["Срок оплаты", "45 дней", "30 дней"],
      ["Денежный резерв", "800 тыс. ₽", "1,4 млн ₽"],
    ],
    method: "Платёжный календарь, работа с дебиторской задолженностью и планирование резерва.",
    calc: "Резерв: (1,4 − 0,8) / 0,8 = +75%. Срок оплаты: −15 дней.",
  },
];

const WORKFLOW = [
  { title: "Аудит", time: "3–5 рабочих дней", result: "Находим приоритеты и точки внимания.", mine: "Анализ отчётов, рисков и денежных потоков.", yours: "Данные, документы и описание задачи." },
  { title: "Стратегия", time: "1–2 недели", result: "Превращаем цели в финансовый план.", mine: "Модель бизнеса, сценарии и план действий.", yours: "Приоритеты и согласование целей." },
  { title: "Внедрение", time: "2–4 недели", result: "Создаём рабочую систему управления.", mine: "Настройка отчётности и обучение команды.", yours: "Ответственный сотрудник и выполнение регламентов." },
  { title: "Масштабирование", time: "Ежемесячно", result: "Проверяем сценарии дальнейшего роста.", mine: "Контроль показателей и разбор сценариев.", yours: "Управленческие решения и обратная связь." },
];

const OFFERS = [
  { type: "Понять ситуацию", title: "Финансовая диагностика", price: "15 000", unit: "₽", desc: "Разбор текущих показателей, ключевых рисков и приоритетных задач.", list: ["Анализ финансовых данных", "Ключевые выводы и риски", "План ближайших действий"], cta: "Начать с диагностики", topic: "Интересует финансовая диагностика (15 000 ₽)." },
  { type: "Спланировать рост", title: "Финансовая стратегия", price: "45 000", unit: "₽", desc: "Модель бизнеса, план денежных потоков и сценарии достижения целей.", list: ["Финансовая модель бизнеса", "План денежных потоков", "Сценарии и приоритеты"], cta: "Обсудить стратегию", topic: "Интересует финансовая стратегия (45 000 ₽).", featured: true },
  { type: "Держать под контролем", title: "Сопровождение бизнеса", price: "80 000", unit: "₽ / мес.", desc: "Регулярный разбор отчётности, контроль показателей и поддержка команды.", list: ["Разбор управленческих отчётов", "Контроль ключевых показателей", "Поддержка вашей команды"], cta: "Обсудить сопровождение", topic: "Интересует сопровождение бизнеса (80 000 ₽/мес.)." },
];

export function PracticeCarousel() {
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState<number | undefined>();
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { suggestTopic, goToContact } = useContact();

  const measure = useCallback(() => {
    const el = slideRefs.current[index];
    if (el) setHeight(el.offsetHeight);
  }, [index]);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    slideRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [measure]);

  const go = (i: number) => embla?.scrollTo(Math.max(0, Math.min(TABS.length - 1, i)));

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const map: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(TABS.length - 1, map[e.key] ?? index));
    go(next);
    tabRefs.current[next]?.focus();
  };

  const discuss = (topic: string) => {
    suggestTopic(topic);
    goToContact();
  };

  const slides = [
    <div key="reviews">
      <SlideHeading eyebrow="Отзывы" title="Когда цифры становятся понятными." hint="Демонстрационные отзывы" />
      <div className="grid gap-4 md:grid-cols-2">
        {REVIEWS.map((r) => (
          <article key={r.name} className="flex flex-col rounded-3xl border border-border bg-background/60 p-7 md:p-9">
            <Quote className="size-9 fill-primary text-primary" />
            <blockquote className="mt-6 flex-1 text-lg font-medium leading-relaxed md:text-xl">{r.text}</blockquote>
            <div className="mt-8 flex items-center gap-4">
              <span
                role="img"
                aria-label={r.alt}
                className="size-14 shrink-0 rounded-full border border-border-strong bg-cover"
                style={{ backgroundImage: `url(${portraits})`, backgroundSize: "200% 100%", backgroundPosition: r.pos }}
              />
              <div>
                <h4 className="font-bold">{r.name}</h4>
                <p className="text-sm text-muted-foreground">{r.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-subtle">Демонстрационные отзывы: имена, фотографии и цитаты приведены для примера.</p>
    </div>,
    <div key="cases">
      <SlideHeading eyebrow="До / после" title="Сначала задача. Затем — измеримый результат." hint="Расчёты по проектам" />
      <div className="grid gap-4 md:grid-cols-2">
        {CASES.map((c) => (
          <article key={c.title} className="rounded-3xl border border-border bg-background/60 p-7 md:p-9">
            <p className="eyebrow">{c.sector}</p>
            <h4 className="mt-3 text-2xl font-bold tracking-tight">{c.title}</h4>
            <div className="mt-6 flex items-end gap-4">
              <strong className="text-6xl font-extrabold tracking-tighter text-primary">
                {c.value}
                <span className="text-3xl">%</span>
              </strong>
              <p className="pb-2 text-sm text-muted-foreground">{c.valueNote}</p>
            </div>
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-subtle">
                  <th className="py-2 font-semibold">Показатель</th>
                  <th className="py-2 font-semibold">До</th>
                  <th className="py-2 font-semibold">После</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map(([k, a, b]) => (
                  <tr key={k} className="border-t border-border">
                    <td className="py-3 text-muted-foreground">{k}</td>
                    <td className="py-3 text-muted-foreground line-through decoration-subtle">{a}</td>
                    <td className="py-3 font-bold">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-5 text-sm leading-relaxed">{c.method}</p>
            <p className="mt-2 text-xs leading-relaxed text-subtle">{c.calc}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-subtle">Иллюстративные расчёты — не результаты реальных клиентов и не обещание доходности.</p>
    </div>,
    <div key="workflow">
      <SlideHeading eyebrow="Формат работы со мной" title="От первого аудита — до масштабирования." hint="Пример плана сотрудничества" />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WORKFLOW.map((w, i) => (
          <li key={w.title} className="relative rounded-3xl border border-border bg-background/60 p-6">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">0{i + 1}</span>
              <span className="text-xs font-semibold text-primary">{w.time}</span>
            </div>
            <h4 className="mt-6 text-xl font-bold">{w.title}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{w.result}</p>
            <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-subtle">Моя зона</dt>
                <dd className="mt-1">{w.mine}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-subtle">Ваша зона</dt>
                <dd className="mt-1">{w.yours}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-subtle">Сроки приведены для примера. Рабочий план согласуем под вашу задачу.</p>
        <button
          type="button"
          onClick={() => discuss("Хочу обсудить план работы: от аудита до масштабирования.")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary"
        >
          Обсудить мой план <ArrowUpRight className="size-4" />
        </button>
      </div>
    </div>,
    <div key="offers">
      <SlideHeading eyebrow="Услуги" title="Выберите свою точку старта." hint="Пример стоимости для макета" />
      <div className="grid gap-4 md:grid-cols-3">
        {OFFERS.map((o) => (
          <article
            key={o.title}
            className={cn(
              "relative flex flex-col rounded-3xl border p-7",
              o.featured ? "border-primary/60 bg-primary/10" : "border-border bg-background/60",
            )}
          >
            {o.featured && (
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-[0.65rem] font-bold tracking-[0.14em] text-primary-foreground">
                СИСТЕМНОЕ РЕШЕНИЕ
              </span>
            )}
            <p className="eyebrow">{o.type}</p>
            <h4 className="mt-3 text-2xl font-bold tracking-tight">{o.title}</h4>
            <p className="mt-5 text-4xl font-extrabold tracking-tight">
              {o.price} <span className="text-base font-semibold text-muted-foreground">{o.unit}</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{o.desc}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {o.list.map((li) => (
                <li key={li} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {li}
                </li>
              ))}
            </ul>
            <Button variant={o.featured ? "coral" : "line"} size="pill" className="mt-7 w-full" onClick={() => discuss(o.topic)}>
              {o.cta} <ArrowUpRight />
            </Button>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-subtle">Итоговая стоимость согласуется после первой встречи.</p>
        <a href="#calculator" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary">
          Рассчитать скидку на пакет <ArrowUpRight className="size-4" />
        </a>
      </div>
    </div>,
  ];

  return (
    <section id="practice" aria-labelledby="carousel-title" aria-roledescription="карусель" className="section-y relative overflow-hidden border-y border-border bg-card/40">
      <div className="container-x">
        <SectionHead
          id="carousel-title"
          kicker="04 — Интерактивная карусель"
          title="От доверия —"
          muted="к совместной работе."
          intro="Отзывы, примеры решений и понятный формат работы. Всё, что нужно, чтобы сделать первый шаг."
        />

        <Reveal>
          <div role="tablist" aria-label="Разделы интерактивной карусели" className="mb-8 flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t, i) => (
              <button
                key={t}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`tab-${i}`}
                type="button"
                role="tab"
                aria-selected={index === i}
                aria-controls={`slide-${i}`}
                tabIndex={index === i ? 0 : -1}
                onClick={() => go(i)}
                onKeyDown={onTabKey}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-all",
                  index === i
                    ? "border-foreground bg-foreground text-background"
                    : "border-border-strong text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("text-xs", index === i ? "text-primary" : "text-subtle")}>0{i + 1}</span>
                {t}
              </button>
            ))}
          </div>

          <div
            ref={emblaRef}
            className="cursor-grab overflow-hidden transition-[height] duration-500 active:cursor-grabbing"
            style={{ height }}
          >
            <div className="flex items-start">
              {slides.map((s, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  id={`slide-${i}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${i}`}
                  aria-hidden={index !== i}
                  inert={index !== i}
                  className="min-w-0 shrink-0 grow-0 basis-full pr-4"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-5">
            <span className="text-sm font-bold tabular-nums" aria-hidden="true">
              0{index + 1} <span className="text-subtle">/ 0{TABS.length}</span>
            </span>
            <div className="h-px flex-1 bg-border" aria-hidden="true">
              <span className="block h-px bg-primary transition-all duration-500" style={{ width: `${((index + 1) / TABS.length) * 100}%` }} />
            </div>
            <div className="hidden gap-2 sm:flex" aria-label="Выбрать слайд">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  aria-label={`Слайд ${i + 1}: ${t}`}
                  aria-pressed={index === i}
                  onClick={() => go(i)}
                  className={cn("h-2 rounded-full transition-all", index === i ? "w-6 bg-primary" : "w-2 bg-border-strong")}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" aria-label="Предыдущий слайд" onClick={() => go(index - 1)} disabled={index === 0} className="grid size-12 place-items-center rounded-full border border-border-strong transition-colors hover:border-foreground disabled:opacity-30">
                <ArrowLeft className="size-4" />
              </button>
              <button type="button" aria-label="Следующий слайд" onClick={() => go(index + 1)} disabled={index === TABS.length - 1} className="grid size-12 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-30">
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            Слайд {index + 1} из {TABS.length}: {TABS[index]}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
