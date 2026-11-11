import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Brand } from "./Brand";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="container-x flex flex-col items-start justify-between gap-6 border-t border-border py-10 text-sm text-muted-foreground md:flex-row md:items-center">
      <a href="#about" aria-label="FINCONSULT — в начало"><Brand /></a>
      <p>Финансовые решения с опорой на ваши цели.</p>
      <span>© 2026 · Алексеева Людмила</span>
    </footer>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 900);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <a
      href="#about"
      aria-label="Вернуться в начало"
      tabIndex={show ? 0 : -1}
      className={cn(
        "fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full border border-border-strong bg-card/90 shadow-card backdrop-blur-xl transition-all duration-500 hover:border-primary hover:text-primary",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUp className="size-5" />
    </a>
  );
}
