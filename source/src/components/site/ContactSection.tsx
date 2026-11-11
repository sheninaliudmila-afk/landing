import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { MESSAGE_MAX, useContact } from "./ContactContext";
import { contactEndpointConfigured, ContactRequestError, saveContactRequest, submitContactRequest } from "@/lib/contact-client";

type Errors = { name?: string | undefined; email?: string | undefined; consent?: string | undefined };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactSection() {
  const { message, setMessage } = useContact();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [completion, setCompletion] = useState<{ name: string; kind: "saved" | "sent" } | null>(null);
  const [sending, setSending] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Укажите имя — минимум 2 символа.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Проверьте адрес электронной почты.";
    if (!consent) e.consent = "Нужно согласие на обработку данных.";
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      if (first) document.getElementById(first)?.focus();
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      const data = { name: name.trim(), email: email.trim(), message: message.trim(), consent: true as const };
      if (contactEndpointConfigured) {
        await submitContactRequest(data);
        setCompletion({ name: data.name, kind: "sent" });
        toast.success("Заявка получена", { description: "Сервис подтвердил сохранение заявки." });
      } else {
        saveContactRequest(data);
        setCompletion({ name: data.name, kind: "saved" });
        toast.success("Файл заявки подготовлен", { description: "Он сохраняется на вашем устройстве." });
      }
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
    } catch (error) {
      toast.error(contactEndpointConfigured ? "Заявка не подтверждена" : "Не удалось сохранить файл", {
        description: error instanceof ContactRequestError
          ? error.message
          : "Попробуйте ещё раз. Ваша заявка остаётся в форме.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" aria-labelledby="contact-title" className="section-y container-x">
      <div className="relative grid gap-10 overflow-hidden rounded-[2.5rem] border border-border bg-card p-6 sm:p-10 lg:grid-cols-2 lg:p-16">
        <div aria-hidden="true" className="bg-spot pointer-events-none absolute inset-0" />
        <Reveal className="relative flex flex-col">
          <p className="kicker">07 — Первый шаг</p>
          <h2 id="contact-title" className="h-section mt-5">
            Ваш следующий шаг — <span className="text-coral-gradient">к ясности в финансах.</span>
          </h2>
          <p className="mt-6 max-w-sm text-lg text-muted-foreground">Расскажите о своей задаче. Разберёмся, с чего начать.</p>
          <svg className="mt-auto hidden size-28 text-primary lg:block" viewBox="0 0 94 94" fill="none" aria-hidden="true">
            <path d="M9 85 85 9M9 9h76v76" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Reveal>

        <Reveal delay={120} className="relative">
          {completion ? (
            <div role="status" className="flex h-full flex-col items-start justify-center rounded-3xl border border-border bg-background/60 p-8">
              <CheckCircle2 className="size-12 text-success" />
              <h3 className="mt-6 text-2xl font-extrabold tracking-tight">{completion.name}, спасибо!</h3>
              <p className="mt-3 text-muted-foreground">
                {completion.kind === "saved"
                  ? "Заявка сохранена на вашем устройстве. Чтобы передать её консультанту, отправьте скачанный TXT-файл удобным для вас способом."
                  : "Сервис подтвердил получение заявки. Консультант сможет ответить вам по указанной электронной почте."}
              </p>
              <Button variant="line" size="pill" className="mt-8" onClick={() => setCompletion(null)}>
                {completion.kind === "saved" ? "Подготовить ещё одну заявку" : "Отправить ещё одну заявку"}
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-border bg-background/60 p-6 sm:p-8">
              <div>
                <h3 className="text-xl font-bold">Записаться на консультацию</h3>
                <p className="mt-1 text-sm text-muted-foreground">Оставьте контакты и коротко опишите задачу.</p>
              </div>
              {!contactEndpointConfigured && (
                <p role="note" className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  Учебная версия: отправка заявок пока не подключена. Заполните форму, чтобы сохранить заявку в TXT-файл на своём устройстве.
                </p>
              )}
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                  Как к вам обращаться <span className="text-primary">*</span>
                </label>
                <input id="name" className="field-input" placeholder="Ваше имя" autoComplete="name" maxLength={100} value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                  aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
                {errors.name && <p id="name-error" className="mt-1.5 text-sm text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                  Электронная почта <span className="text-primary">*</span>
                </label>
                <input id="email" type="email" className="field-input" placeholder="you@company.ru" autoComplete="email" maxLength={200} value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
                {errors.email && <p id="email-error" className="mt-1.5 text-sm text-destructive">{errors.email}</p>}
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="message" className="text-sm font-semibold">О чём хотели бы поговорить</label>
                  <span className="text-xs tabular-nums text-subtle">{message.length} / {MESSAGE_MAX}</span>
                </div>
                <textarea id="message" rows={5} className="field-input resize-y" placeholder="Несколько слов о вашей задаче" maxLength={MESSAGE_MAX}
                  value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <div>
                <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
                  <input id="consent" type="checkbox" checked={consent}
                    onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: undefined })); }}
                    aria-invalid={Boolean(errors.consent)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]" />
                  Согласен(на) на обработку персональных данных для ответа на заявку.
                </label>
                {errors.consent && <p className="mt-1.5 text-sm text-destructive">{errors.consent}</p>}
              </div>
              <Button type="submit" variant="coral" size="xl" className="w-full" disabled={sending}>
                {sending
                  ? (<>{contactEndpointConfigured ? "Отправляем" : "Сохраняем"} <Loader2 className="animate-spin" /></>)
                  : contactEndpointConfigured
                    ? (<>Оставить заявку <ArrowUpRight /></>)
                    : (<>Сохранить заявку <Download /></>)}
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
