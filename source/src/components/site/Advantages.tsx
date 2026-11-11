import { useState } from "react";
import { ArrowUpRight, BarChart3, Crosshair, LayoutGrid, ShieldCheck, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";
import { useContact } from "./ContactContext";

const ITEMS = [
  {
    icon: BarChart3,
    title: "20+ лет практики",
    text: "Экспертный анализ корпоративных и личных финансов. Решения, проверенные на практике в кризисных условиях.",
    topic: "Опыт и финансовая диагностика",
    description:
      "20+ лет практики помогают смотреть на финансовые показатели в контексте бизнеса: видеть взаимосвязи, находить причины и расставлять приоритеты.",
    list: [
      "Анализ корпоративных и личных финансов.",
      "Разбор доходов, расходов и движения денежных средств.",
      "Определение финансовых рисков и приоритетных задач.",
    ],
  },
  {
    icon: Crosshair,
    title: "Индивидуальная стратегия",
    text: "Персональный финансовый план с учётом рисков, целей бизнеса и ваших личных приоритетов.",
    topic: "Индивидуальная финансовая стратегия",
    description:
      "Финансовый план начинается с ваших целей. Вместе определяем, какие решения помогут бизнесу развиваться и как учитывать личные приоритеты собственника.",
    list: [
      "Анализ текущей ситуации и ограничений.",
      "Финансовая модель с учётом целей и рисков.",
      "Последовательный план действий и контрольные показатели.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Конфиденциальность",
    text: "Бережное отношение к коммерческой тайне и финансовой информации. Детали вашего бизнеса остаются между нами.",
    topic: "Конфиденциальность и защита информации",
    description:
      "Финансовые данные требуют внимательного обращения. Формат обмена информацией, доступ к документам и условия конфиденциальности обсуждаем до начала работы.",
    list: [
      "Обсуждение условий работы с коммерческой тайной.",
      "Определение необходимого объёма финансовых данных.",
      "Согласование доступа к документам и результатам анализа.",
    ],
  },
  {
    icon: LayoutGrid,
    title: "Системный подход",
    text: "Сквозной управленческий учёт и понятные регламенты. Чтобы видеть полную картину и держать прибыль под контролем.",
    topic: "Система финансового управления",
    description:
      "Понятный управленческий учёт помогает видеть финансовое состояние компании и принимать решения на основе актуальных данных.",
    list: [
      "Отчёты ДДС, ОПиУ и управленческий баланс.",
      "Платёжный календарь и контроль кассовых разрывов.",
      "Регламенты, автоматизация в 1С/Excel и обучение команды.",
    ],
  },
];

export function Advantages() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { suggestTopic, goToContact } = useContact();
  const current = openIndex === null ? null : ITEMS[openIndex];

  return (
    <section id="services" aria-labelledby="services-title" className="section-y container-x">
      <SectionHead
        id="services-title"
        kicker="01 — Преимущества"
        title="За цифрами —"
        muted="ваши возможности."
        intro="Не просто отчёты и таблицы. Понятная система, которая помогает принимать взвешенные решения."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, i) => (
          <Reveal key={item.title} delay={i * 90} as="article" className="panel panel-hover group flex flex-col p-7">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-subtle">0{i + 1}</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="size-5" strokeWidth={1.6} />
              </span>
            </div>
            <h3 className="mt-12 text-xl font-bold tracking-tight">{item.title}</h3>
            <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-muted-foreground">{item.text}</p>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="mt-7 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Подробнее <ArrowUpRight className="size-4" />
            </button>
          </Reveal>
        ))}
      </div>

      <Dialog open={current !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent className="max-w-xl rounded-3xl border-border bg-card p-8 sm:rounded-3xl sm:p-10">
          {current && (
            <>
              <p className="kicker">FINCONSULT / подход к работе</p>
              <DialogTitle className="text-3xl font-extrabold leading-tight tracking-tight">{current.topic}</DialogTitle>
              <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                {current.description}
              </DialogDescription>
              <ul className="mt-2 space-y-3">
                {current.list.map((li) => (
                  <li key={li} className="flex gap-3 text-[0.95rem]">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {li}
                  </li>
                ))}
              </ul>
              <Button
                variant="coral"
                size="xl"
                className="mt-4 justify-self-start"
                onClick={() => {
                  suggestTopic(`Интересует: ${current.topic.toLowerCase()}.`);
                  setOpenIndex(null);
                  goToContact();
                }}
              >
                Обсудить задачу <ArrowUpRight />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
