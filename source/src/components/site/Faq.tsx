import { ArrowUpRight, Plus } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { Reveal } from "./Reveal";

const FAQ = [
  ["Как выстроить прозрачный управленческий учёт в бизнесе?", "Помогаю внедрить отчёты ДДС, ОПиУ и Баланс, наладить автоматизацию в 1С/Excel и обучить команду, чтобы получать актуальные цифры вовремя."],
  ["Как избавиться от кассовых разрывов и оптимизировать расходы?", "Проводим экспресс-аудит платёжного календаря, находим скрытые издержки, перестраиваем работу с дебиторской задолженностью и кредиторами."],
  ["Как безопасно выводить дивиденды и масштабировать прибыль?", "Формируем финансовую модель бизнеса, определяем точку безубыточности и долю чистой прибыли, доступную к распределению без риска для компании."],
  ["Как структурировать личный и корпоративный капитал?", "Разрабатываем персональную стратегию, разделяем личные средства и деньги бизнеса, учитываем юридические и налоговые риски."],
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="section-y container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
      <Reveal>
        <p className="kicker">06 — Вопросы и ответы</p>
        <h2 id="faq-title" className="h-section mt-5">
          Возможно, вы тоже об этом <span className="muted-heading">думаете.</span>
        </h2>
        <p className="mt-6 max-w-sm text-lg text-muted-foreground">У каждой ситуации свои детали. Начнём с того, что важно вам.</p>
        <a href="#contact" className="mt-8 inline-flex items-center gap-1.5 font-semibold hover:text-primary">
          Задать свой вопрос <ArrowUpRight className="size-4" />
        </a>
      </Reveal>
      <Reveal delay={100}>
        <Accordion.Root type="single" collapsible defaultValue="0" className="border-t border-border">
          {FAQ.map(([q, a], i) => (
            <Accordion.Item key={q} value={String(i)} className="border-b border-border">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center gap-5 py-7 text-left">
                  <span className="text-xs font-bold text-primary">0{i + 1}</span>
                  <span className="flex-1 text-lg font-semibold tracking-tight md:text-xl">{q}</span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border-strong transition-all duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:border-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                    <Plus className="size-4" />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="max-w-xl pb-7 pl-9 leading-relaxed text-muted-foreground">{a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Reveal>
    </section>
  );
}
