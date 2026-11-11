import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./Brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#about", label: "О себе" },
  { href: "#services", label: "Преимущества" },
  { href: "#diagnostic", label: "Экспресс-тест" },
  { href: "#practice", label: "Отзывы и услуги" },
  { href: "#calculator", label: "Калькулятор" },
];

export const NAVIGATOR_URL = import.meta.env.BASE_URL + "navigator/start.html#start";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: "-15% 0px -60% 0px" },
    );
    document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || open ? "border-b border-border bg-background/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <a href="#about" aria-label="FINCONSULT — в начало" onClick={() => setOpen(false)}>
          <Brand />
        </a>
        <nav aria-label="Основная навигация" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "location" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-[0.82rem] font-medium transition-colors",
                active === item.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
          <a
            href={NAVIGATOR_URL}
            target="_blank"
            rel="noopener"
            aria-label="Расширенный анализ деятельности компании — откроется в новой вкладке"
            className="rounded-full px-3.5 py-2 text-[0.82rem] font-semibold text-primary transition-colors hover:text-primary-glow"
          >
            Анализ ↗
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="coral" size="pill" className="hidden sm:inline-flex">
            <a href="#contact">
              Обсудить задачу <ArrowUpRight />
            </a>
          </Button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-border-strong lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <div
        id="mobile-nav"
        className={cn(
          "grid overflow-hidden transition-all duration-500 lg:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <nav aria-label="Мобильная навигация" className="min-h-0">
          <div className="container-x flex flex-col gap-1 pb-6">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="border-b border-border py-4 text-2xl font-bold tracking-tight"
              >
                {item.label}
              </a>
            ))}
            <a
              href={NAVIGATOR_URL}
              target="_blank"
              rel="noopener"
              tabIndex={open ? 0 : -1}
              className="border-b border-border py-4 text-2xl font-bold tracking-tight text-primary"
            >
              Расширенный анализ ↗
            </a>
            <Button asChild variant="coral" size="xl" className="mt-4">
              <a href="#contact" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
                Обсудить задачу <ArrowUpRight />
              </a>
            </Button>
          </div>
        </nav>
      </div>
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px bg-primary transition-[width] duration-150"
        style={{ width: `${progress * 100}%` }}
      />
    </header>
  );
}
