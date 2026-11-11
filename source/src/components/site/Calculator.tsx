import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculatePackage, DISCOUNT_POLICY, monthsLabel, parsePrice, SERVICE_CATALOG, type ServiceId } from "@/lib/discount-model";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";
import { useContact } from "./ContactContext";
import { useCountUp } from "./useCountUp";

const integer = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${integer.format(n)} ₽`;
const DEFAULT_PRICES = Object.fromEntries(SERVICE_CATALOG.map((s) => [s.id, integer.format(s.defaultPrice)])) as Record<ServiceId, string>;
const DEFAULT_SELECTED: Record<ServiceId, boolean> = { diagnostics: true, strategy: true, support: true };

function Animated({ value }: { value: number }) {
  return <>{integer.format(useCountUp(value))}</>;
}

export function Calculator() {
  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [months, setMonths] = useState(3);
  const { injectBlock, goToContact } = useContact();

  const result = useMemo(
    () =>
      calculatePackage({
        services: SERVICE_CATALOG.filter((s) => selected[s.id]).map((s) => ({ id: s.id, price: prices[s.id] })),
        months,
      }),
    [selected, prices, months],
  );
  const hasSupport = selected.support;
  const errors = result.ok ? {} : result.errors;

  const reset = () => {
    setSelected(DEFAULT_SELECTED);
    setPrices(DEFAULT_PRICES);
    setMonths(3);
  };

  const propose = () => {
    if (!result.ok) return;
    const block = [
      `Расчёт пакета: ${result.items.map((i) => `${i.short}${i.monthly ? ` (${i.quantity} мес.)` : ""}`).join(", ")}.`,
      `Без скидки: ${money(result.baseTotal)}; скидка до ${result.discountPercent}%; минимальная цена: ${money(result.minimumPrice)}.`,
    ].join("\n");
    if (!injectBlock("calculator", block)) toast.warning("В форме уже длинное сообщение — ваш текст сохранён, расчёт не добавлен.");
    else toast.success("Расчёт добавлен в заявку");
    goToContact();
  };

  const badge = !result.ok ? "до 25%" : result.discountPercent === 0 ? "Без скидки" : `до ${result.discountPercent}%`;

  return (
    <section id="calculator" aria-labelledby="calculator-title" className="section-y container-x">
      <SectionHead
        id="calculator-title"
        kicker="05 — Калькулятор пакета"
        title="Больше задач —"
        muted="выгоднее вместе."
        intro="Выберите услуги и срок работы. Узнайте максимальную скидку и минимальную цену вашего пакета."
      />
      <p className="mb-6 text-sm text-muted-foreground">Общая скидка на пакет — не более 25%.</p>

      <Reveal className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <form
          noValidate
          onSubmit={(e) => e.preventDefault()}
          onReset={(e) => {
            e.preventDefault();
            reset();
          }}
          className="panel space-y-8 p-6 sm:p-9"
        >
          <fieldset>
            <legend className="flex items-center gap-3 text-lg font-bold">
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs text-primary">01</span> Выберите услуги
            </legend>
            <p className="mt-2 text-sm text-subtle">Цены из блока услуг уже подставлены. Их можно изменить для своего расчёта.</p>
            <div className="mt-5 space-y-3">
              {SERVICE_CATALOG.map((s) => {
                const on = selected[s.id];
                const err = errors[s.id];
                return (
                  <div key={s.id} className={cn("rounded-2xl border p-4 transition-colors sm:p-5", on ? "border-primary/50 bg-primary/5" : "border-border")}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <label htmlFor={`calc-select-${s.id}`} className="flex cursor-pointer items-start gap-4">
                        <input
                          id={`calc-select-${s.id}`}
                          type="checkbox"
                          checked={on}
                          onChange={(e) => setSelected((p) => ({ ...p, [s.id]: e.target.checked }))}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
                          )}
                        >
                          {on && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <span>
                          <strong className="block font-semibold">{s.title}</strong>
                          <span className="text-sm text-muted-foreground">{s.description}</span>
                        </span>
                      </label>
                      <div className="flex items-center gap-3 sm:w-52">
                        <input
                          id={`calc-price-${s.id}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={12}
                          autoComplete="off"
                          disabled={!on}
                          value={prices[s.id]}
                          aria-label={`Базовая цена: ${s.title}, ₽ ${s.monthly ? "за месяц" : "разово"}`}
                          aria-invalid={Boolean(err)}
                          aria-describedby={err ? `calc-error-${s.id}` : undefined}
                          onChange={(e) => setPrices((p) => ({ ...p, [s.id]: e.target.value }))}
                          onBlur={() => {
                            const v = parsePrice(prices[s.id]);
                            if (v !== null) setPrices((p) => ({ ...p, [s.id]: integer.format(v) }));
                          }}
                          className="field-input py-2.5 text-right font-semibold tabular-nums disabled:opacity-40"
                        />
                        <span className="w-16 shrink-0 text-xs text-subtle">₽ {s.monthly ? "/ мес." : "разово"}</span>
                      </div>
                    </div>
                    {err && (
                      <p id={`calc-error-${s.id}`} className="mt-3 text-sm text-destructive">{err}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset disabled={!hasSupport} className="disabled:opacity-60">
            <legend className="flex items-center gap-3 text-lg font-bold">
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs text-primary">02</span> Срок сопровождения
            </legend>
            <div className="mt-5 flex items-baseline justify-between">
              <label htmlFor="calc-months" className="text-sm text-muted-foreground">Продолжительность работы</label>
              <output htmlFor="calc-months" className="text-2xl font-extrabold tracking-tight">{monthsLabel(months)}</output>
            </div>
            <input
              id="calc-months"
              type="range"
              min={1}
              max={12}
              step={1}
              value={months}
              aria-valuetext={monthsLabel(months)}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="range-coral mt-5"
              style={{ "--range-progress": `${((months - 1) / 11) * 100}%` } as React.CSSProperties}
            />
            <div className="mt-2 flex justify-between text-xs text-subtle" aria-hidden="true">
              <span>1 месяц</span>
              <span>12 месяцев</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Быстрый выбор срока">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={months === m}
                  onClick={() => setMonths(m)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    months === m ? "border-foreground bg-foreground text-background" : "border-border-strong text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m} мес.
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-subtle">
              {hasSupport
                ? "Диагностика и стратегия учитываются один раз. Срок меняет только стоимость сопровождения и бонус за длительность."
                : "Срок не влияет на разовые услуги. Выберите сопровождение, чтобы получить дополнительную скидку за длительность."}
            </p>
          </fieldset>

          <details className="group rounded-2xl border border-border p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              Как растёт скидка <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-5 grid gap-6 text-sm sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="eyebrow">За пакет услуг</h3>
                <p className="flex justify-between">1 услуга <strong>0%</strong></p>
                <p className="flex justify-between">2 услуги <strong>+5%</strong></p>
                <p className="flex justify-between">3 услуги <strong>+10%</strong></p>
              </div>
              <div className="space-y-2">
                <h3 className="eyebrow">За срок сопровождения</h3>
                <p className="flex justify-between">1–2 месяца <strong>0%</strong></p>
                <p className="flex justify-between">3–5 месяцев <strong>+5%</strong></p>
                <p className="flex justify-between">6–11 месяцев <strong>+10%</strong></p>
                <p className="flex justify-between">12 месяцев <strong>+15%</strong></p>
              </div>
            </div>
            <p className="mt-5 text-xs text-subtle">
              Проценты складываются, итог — до 25%. Бонус за срок доступен только с сопровождением. Скидка применяется ко всей стоимости выбранного пакета.
            </p>
          </details>
          <div className="flex items-center justify-between">
            <p className="text-sm text-subtle">Суммы обновляются автоматически.</p>
            <button type="reset" className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Сбросить
            </button>
          </div>
        </form>

        <aside aria-labelledby="calc-result-title" className="relative flex flex-col overflow-hidden rounded-[2rem] bg-surface-light p-7 text-surface-light-foreground sm:p-9 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between">
            <p id="calc-result-title" className="text-xs font-bold tracking-[0.18em] opacity-60">ВАШ ПАКЕТ</p>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{badge}</span>
          </div>

          {result.ok ? (
            <div aria-live="polite">
              <p className="mt-8 text-sm opacity-60">Минимальная цена пакета</p>
              <p className="mt-1 text-[clamp(2.6rem,6vw,3.8rem)] font-extrabold leading-none tracking-tighter tabular-nums">
                <Animated value={result.minimumPrice} /> <span className="text-primary">₽</span>
              </p>
              <p className="mt-3 text-sm opacity-60">
                {result.months ? `За весь пакет, включая ${monthsLabel(result.months)} сопровождения` : "За весь выбранный пакет · разовые услуги"}
              </p>
              <dl className="mt-8 space-y-3 border-t border-surface-light-foreground/10 pt-6 text-sm">
                <div className="flex justify-between"><dt className="opacity-60">Стоимость без скидки</dt><dd className="tabular-nums line-through opacity-60">{money(result.baseTotal)}</dd></div>
                <div className="flex justify-between"><dt className="opacity-60">За пакет услуг</dt><dd className="font-semibold">+{result.packagePercent}%</dd></div>
                <div className="flex justify-between"><dt className="opacity-60">За длительность</dt><dd className="font-semibold">+{result.durationPercent}%</dd></div>
                <div className="flex justify-between text-base"><dt className="font-semibold">Ваша экономия</dt><dd className="font-extrabold text-primary tabular-nums"><Animated value={result.discountAmount} /> ₽</dd></div>
              </dl>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-light-foreground/10" aria-hidden="true">
                <span className="block h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(result.discountPercent / DISCOUNT_POLICY.maximumPercent) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs opacity-60">
                {result.discountPercent === DISCOUNT_POLICY.maximumPercent
                  ? "Достигнут максимальный размер скидки — 25%"
                  : `${result.discountPercent}% из максимально возможных 25%`}
              </p>
              <details className="group mt-6 text-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  Что входит в расчёт <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="mt-3 space-y-2">
                  {result.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-4">
                      <span className="opacity-70">{i.short} · {i.monthly ? `${i.quantity} мес.` : "разово"}</span>
                      <strong className="tabular-nums">{money(i.lineTotal)}</strong>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : (
            <div className="my-10 text-center" aria-live="polite">
              <p className="text-4xl text-primary" aria-hidden="true">↗</p>
              <h3 className="mt-4 text-xl font-bold">{result.reason === "empty" ? "Соберите свой пакет" : "Проверьте базовые цены"}</h3>
              <p className="mt-2 text-sm opacity-60">
                {result.reason === "empty"
                  ? "Выберите хотя бы одну услугу — здесь появится расчёт."
                  : "Укажите положительные цены в рублях для всех выбранных услуг."}
              </p>
            </div>
          )}
          <Button variant="coral" size="xl" className="mt-8 w-full" disabled={!result.ok} onClick={propose}>
            Обсудить этот пакет <ArrowUpRight />
          </Button>
          <p className="mt-3 text-center text-xs opacity-50">Расчёт добавится к вашей заявке.</p>
        </aside>
      </Reveal>
    </section>
  );
}
