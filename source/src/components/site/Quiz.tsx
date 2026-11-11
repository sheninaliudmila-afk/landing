import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock, Download, Lock, RotateCcw, ShieldCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getResult, questions, type QuizResult } from "@/lib/quiz-model";
import { Reveal } from "./Reveal";
import { scrollToId, useContact } from "./ContactContext";

const GROUPS = [
  { title: "Ваша ситуация", sub: "С чего начнём" },
  { title: "Финансовая картина", sub: "Цифры, процессы и цели" },
  { title: "Работа вместе", sub: "Формат и поддержка" },
];
const groupOf = (i: number) => (i < 2 ? 0 : i < 7 ? 1 : 2);

const FORMATS = [
  { id: "diagnostic", title: "Финансовая диагностика", description: "Разбор данных, финансовых рисков и приоритетных задач. Подходит для понятного первого шага.", duration: "3–5 рабочих дней" },
  { id: "strategy", title: "Финансовая стратегия", description: "Диагностика, финансовая модель и сценарии. Когда нужен план для обоснованных решений.", duration: "Диагностика + 1–2 недели" },
  { id: "support", title: "Внедрение и сопровождение", description: "Настройка отчётности и передача системы команде. Регулярная поддержка — по вашему запросу.", duration: "Внедрение: 2–4 недели · поддержка: ежемесячно" },
] as const;

export function Quiz() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(questions.length).fill(null));
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const legendRef = useRef<HTMLLegendElement>(null);
  const resultTitleRef = useRef<HTMLHeadingElement>(null);
  const { injectBlock, goToContact } = useContact();

  const q = questions[current]!;
  const answered = answers.filter((a) => a !== null).length;
  const group = groupOf(current);

  useEffect(() => {
    if (!result) return;
    scrollToId("diagnostic");
    resultTitleRef.current?.focus({ preventScroll: true });
  }, [result]);

  const focusQuestion = () => requestAnimationFrame(() => legendRef.current?.focus({ preventScroll: true }));

  const moveTo = (i: number) => {
    setCurrent(i);
    setAnimKey((k) => k + 1);
    focusQuestion();
    const top = document.getElementById("fq-shell")?.getBoundingClientRect().top ?? 0;
    if (top < 60 || top > window.innerHeight * 0.6) scrollToId("fq-shell");
  };

  const choose = (value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = value;
      return next;
    });
  };

  const submit = () => {
    if (answers[current] === null) return;
    if (current < questions.length - 1) moveTo(current + 1);
    else {
      setResult(getResult(answers as number[]));
    }
  };

  const restart = () => {
    setAnswers(Array(questions.length).fill(null));
    setResult(null);
    setCurrent(0);
    setAnimKey((k) => k + 1);
    focusQuestion();
  };

  const editAnswers = () => {
    setResult(null);
    setAnimKey((k) => k + 1);
    focusQuestion();
  };

  const resultText = (r: QuizResult) => {
    const lines = [
      "FINCONSULT — результат экспресс-диагностики", "", r.title, `Сроки: ${r.duration}`, `Приоритет: ${r.focus}`, "", r.summary, "",
      "Рекомендуемые услуги:", ...r.services.map((s) => `• ${s.title}: ${s.description}`), "",
      "Этапы работы:", ...r.stages.map((s) => `• ${s.title} — ${s.duration}`), "",
      "Основания рекомендации:", ...r.reasons.map((s) => `• ${s}`), "", r.schedule, "",
      "Ваши ответы:", ...questions.map((qq, i) => `${i + 1}. ${qq.title}\n${qq.options[answers[i] as number]?.label ?? ""}`), "",
      "Результат предварительный. Состав услуг и точные сроки согласуются после знакомства.",
    ];
    return lines.join("\n");
  };

  const save = (r: QuizResult) => {
    try {
      const blob = new Blob(["\uFEFF" + resultText(r)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "finconsult-result.txt";
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success("Результат сохранён в текстовый файл");
    } catch {
      toast.error("Не удалось скачать файл. Скопируйте результат со страницы.");
    }
  };

  const discuss = (r: QuizResult) => {
    const summary = `Результат экспресс-теста: ${r.title}.\nПриоритет: ${r.focus}.\nОриентир по срокам: ${r.duration}.\nУслуги: ${r.services.map((s) => s.title).join("; ")}.`;
    if (!injectBlock("quiz", summary)) {
      toast.warning("В форме уже длинное сообщение. Сохраните результат отдельно, чтобы не потерять текст.");
    } else toast.success("Результат добавлен в заявку");
    goToContact();
  };

  return (
    <section id="diagnostic" aria-labelledby="fq-title" className="section-y container-x">
      <Reveal className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">
            <span className="status-dot" /> Ваша точка старта
          </p>
          <h2 id="fq-title" className="h-section mt-5">
            Что нужно <span className="text-coral-gradient">вашим финансам?</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Ответьте на 10 вопросов — и получите персональный маршрут работы: услуги, формат и примерные сроки.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 whitespace-nowrap text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2"><Clock className="size-4" /> Около 3 минут</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2"><Lock className="size-4" /> Без регистрации</span>
        </div>
      </Reveal>

      {!result ? (
        <Reveal id="fq-shell" className="grid overflow-hidden rounded-[2rem] border border-border bg-card lg:grid-cols-[300px_1fr]">
          <aside aria-label="Этапы теста" className="hidden flex-col justify-between border-r border-border bg-background/40 p-8 lg:flex">
            <div>
              <p className="text-sm font-extrabold">
                FINCONSULT
                <span className="block text-[0.65rem] font-bold tracking-[0.16em] text-subtle">ЭКСПРЕСС-ДИАГНОСТИКА</span>
              </p>
              <ol className="mt-10 space-y-2">
                {GROUPS.map((g, i) => (
                  <li
                    key={g.title}
                    aria-current={group === i ? "step" : undefined}
                    className={cn("flex items-center gap-4 rounded-2xl p-3 transition-colors", group === i && "bg-secondary")}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full border text-xs font-bold",
                        i < group ? "border-primary bg-primary text-primary-foreground" : group === i ? "border-primary text-primary" : "border-border-strong text-subtle",
                      )}
                    >
                      {i < group ? <Check className="size-4" /> : `0${i + 1}`}
                    </span>
                    <div className={cn("text-sm font-semibold", group < i && "text-subtle")}>
                      {g.title}
                      <small className="block text-xs font-normal text-subtle">{g.sub}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-3 rounded-2xl border border-border p-4 text-sm">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <p>
                Только о вашей ситуации.
                <span className="block text-xs text-subtle">Суммы, документы и контакты для теста не нужны.</span>
              </p>
            </div>
          </aside>

          <div className="p-6 sm:p-10">
            <div className="flex items-center justify-between text-xs font-bold tracking-[0.16em]">
              <span className="text-primary">{q.category.toUpperCase()}</span>
              <span className="tabular-nums">
                {String(current + 1).padStart(2, "0")} <span className="text-subtle">/ 10</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Прогресс теста"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={answered}
              aria-valuetext={`Отвечено на ${answered} из 10 вопросов`}
              className="mt-4 grid grid-cols-10 gap-1.5"
            >
              {questions.map((_, i) => (
                <i
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-colors duration-500",
                    i === current ? "bg-foreground" : answers[i] !== null ? "bg-primary" : "bg-accent",
                  )}
                />
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="mt-10"
            >
              <fieldset key={animKey} className="animate-in fade-in slide-in-from-right-4 duration-500">
                <legend ref={legendRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight outline-none md:text-3xl">
                  {q.title}
                </legend>
                <p className="mt-3 text-muted-foreground">{q.hint}</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {q.options.map((o, i) => {
                    const checked = answers[current] === i;
                    return (
                      <label
                        key={o.label}
                        className={cn(
                          "group flex cursor-pointer gap-4 rounded-2xl border p-5 transition-all",
                          checked ? "border-primary bg-primary/10" : "border-border hover:border-border-strong hover:bg-secondary/60",
                        )}
                      >
                        <input
                          type="radio"
                          name="fq-answer"
                          value={i}
                          checked={checked}
                          onChange={() => choose(i)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                            checked ? "border-primary bg-primary" : "border-border-strong",
                          )}
                        >
                          {checked && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                        </span>
                        <span>
                          <strong className="block font-semibold">{o.label}</strong>
                          <small className="mt-1 block text-sm text-muted-foreground">{o.detail}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
                <Button type="button" variant="quiet" size="pill" disabled={current === 0} onClick={() => moveTo(current - 1)}>
                  <ArrowLeft /> Назад
                </Button>
                <span className="hidden text-sm text-subtle sm:block">
                  {answers[current] === null ? "Выберите один вариант" : "Ответ выбран"}
                </span>
                <Button type="submit" variant="coral" size="pill" disabled={answers[current] === null}>
                  {current === questions.length - 1 ? (
                    <>
                      Получить результат <ArrowUpRight />
                    </>
                  ) : (
                    <>
                      Далее <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Reveal>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 rounded-[2rem] border border-border bg-card p-6 duration-700 sm:p-10" aria-labelledby="fq-result-title" tabIndex={-1}>
          <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-success">
                <Check className="size-4" /> 10 ИЗ 10 · ВАШ МАРШРУТ ГОТОВ
              </p>
              <h3 ref={resultTitleRef} id="fq-result-title" tabIndex={-1} className="mt-4 text-3xl font-extrabold tracking-tight outline-none md:text-4xl">{result.title}</h3>
              <p className="mt-3 max-w-2xl text-muted-foreground">{result.summary}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-secondary p-5 text-sm text-muted-foreground md:max-w-xs">
              Ориентировочная длительность
              <strong className="mt-1 block text-lg text-foreground">{result.duration}</strong>
            </div>
          </div>

          <div className="grid gap-10 py-8 lg:grid-cols-2">
            <div>
              <h4 className="eyebrow">Приоритетные услуги для вас</h4>
              <ul className="mt-5 space-y-4">
                {result.services.map((s) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><ArrowUpRight className="size-4" /></span>
                    <div>
                      <strong className="font-semibold">{s.title}</strong>
                      <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="eyebrow">Как может строиться работа</h4>
              <ol className="mt-5 space-y-0 border-l border-border-strong">
                {result.stages.map((s) => (
                  <li key={s.title} className="relative pb-6 pl-6 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-primary" />
                    <strong className="font-semibold">{s.title}</strong>
                    <span className="ml-2 text-xs font-semibold text-primary">{s.duration}</span>
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/50 p-6">
            <strong>Почему этот маршрут подходит</strong>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {result.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-subtle">{result.schedule}</p>
          </div>

          <h4 className="eyebrow mt-10">Варианты работы со мной</h4>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {FORMATS.map((f) => {
              const rec = f.id === result.format;
              return (
                <article key={f.id} className={cn("rounded-2xl border p-6", rec ? "border-primary bg-primary/10" : "border-border")}>
                  <span className={cn("text-[0.65rem] font-bold tracking-[0.16em]", rec ? "text-primary" : "text-subtle")}>
                    {rec ? "↗ РЕКОМЕНДУЕМЫЙ ФОРМАТ" : "ДРУГОЙ ВАРИАНТ"}
                  </span>
                  <h5 className="mt-3 text-lg font-bold">{rec ? result.title : f.title}</h5>
                  <p className="mt-2 text-sm text-muted-foreground">{rec ? result.summary : f.description}</p>
                  <small className="mt-4 block text-xs font-semibold">{rec ? result.duration : f.duration}</small>
                </article>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button variant="coral" size="xl" onClick={() => discuss(result)}>
              Обсудить мой результат <ArrowUpRight />
            </Button>
            <Button variant="line" size="xl" onClick={() => save(result)}>
              <Download /> Сохранить результат
            </Button>
            <Button variant="quiet" size="pill" onClick={editAnswers}>
              <Pencil /> Изменить ответы
            </Button>
            <Button variant="quiet" size="pill" onClick={restart}>
              <RotateCcw /> Пройти заново
            </Button>
          </div>
          <p className="mt-6 text-xs text-subtle">
            Ответы обрабатываются только в вашем браузере. Результат можно добавить к заявке на консультацию.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-xl text-sm text-subtle">
          Результат — предварительный ориентир. Точный состав услуг и сроки согласуем после знакомства с вашей задачей.
        </p>
        <a href="#calculator" className="text-sm font-semibold hover:text-primary">Перейти к калькулятору ↓</a>
      </div>
    </section>
  );
}
