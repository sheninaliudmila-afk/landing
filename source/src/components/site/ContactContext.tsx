import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export const MESSAGE_MAX = 2000;

interface ContactCtx {
  message: string;
  setMessage: (value: string) => void;
  /** Replace a previously injected block (by key) or append a new one. Returns false if it would overflow. */
  injectBlock: (key: string, block: string) => boolean;
  /** Fill the message only when the field is empty. */
  suggestTopic: (topic: string) => void;
  goToContact: () => void;
}

const Ctx = createContext<ContactCtx | null>(null);

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function ContactProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const injected = useRef<Record<string, string>>({});
  const messageRef = useRef(message);
  messageRef.current = message;

  const injectBlock = useCallback((key: string, block: string) => {
    const original = messageRef.current;
    const previous = injected.current[key];
    const combined =
      previous && original.includes(previous)
        ? original.replace(previous, block)
        : original.trim()
          ? `${original.trim()}\n\n${block}`
          : block;
    if (combined.length > MESSAGE_MAX) return false;
    injected.current[key] = block;
    setMessage(combined);
    return true;
  }, []);

  const suggestTopic = useCallback((topic: string) => {
    if (!messageRef.current.trim()) setMessage(topic);
  }, []);

  const goToContact = useCallback(() => {
    scrollToId("contact");
    window.setTimeout(() => document.getElementById("name")?.focus({ preventScroll: true }), 450);
  }, []);

  const value = useMemo(
    () => ({ message, setMessage, injectBlock, suggestTopic, goToContact }),
    [message, injectBlock, suggestTopic, goToContact],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContact() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContact must be used inside ContactProvider");
  return ctx;
}
