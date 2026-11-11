import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { contactSchema } from "./contact-schema";
import { getRequest } from '@tanstack/react-start/server';

// Best-effort per-worker abuse protection, bounded and without storing visitor data.
const recentSubmissions = new Map<string, number>();

export const submitContactRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const now = Date.now();
    for (const [ip, expires] of recentSubmissions) if (expires <= now) recentSubmissions.delete(ip);
    const ip = getRequest().headers.get('cf-connecting-ip');
    if (ip && (recentSubmissions.get(ip) || 0) > now) throw new Error('Пожалуйста, подождите перед следующей заявкой.');
    if (ip) {
      if (recentSubmissions.size >= 5000) recentSubmissions.clear();
      recentSubmissions.set(ip, now + 60_000);
    }
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Сервис заявок временно недоступен.");

    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const id = crypto.randomUUID();
    const { error } = await supabase.from("contact_submissions").insert({ id, ...data });
    if (error) {
      console.error("contact insert failed", error);
      throw new Error("Не удалось отправить заявку. Попробуйте ещё раз.");
    }
    const { notifyContactOwners } = await import('./contact-notifications.server');
    await notifyContactOwners({ id, ...data });
    return { id };
  });
