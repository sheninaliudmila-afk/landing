import { z } from "zod";
import { contactSchema, type ContactInput } from "./contact-schema";

export type ContactRequest = ContactInput & { consent: true };

const endpoint = import.meta.env["VITE_CONTACT_ENDPOINT"]?.trim() ?? "";
export const contactEndpointConfigured = endpoint.length > 0;
const receiptSchema = z.object({ id: z.string().uuid() });
const REQUEST_TIMEOUT_MS = 15_000;

export class ContactRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactRequestError";
  }
}

function validatedRequest(input: ContactRequest): ContactRequest {
  if (input.consent !== true) {
    throw new ContactRequestError("Подтвердите согласие на обработку данных.");
  }
  return { ...contactSchema.parse(input), consent: true };
}

/** A public HTTPS API must return the UUID of a durably stored submission. */
export async function submitContactRequest(input: ContactRequest): Promise<{ id: string }> {
  let target: URL;
  try {
    target = new URL(endpoint);
    if (target.protocol !== "https:" || target.username || target.password || target.hash) {
      throw new Error("Invalid contact endpoint");
    }
  } catch {
    throw new ContactRequestError(
      "Сервис заявок пока не настроен. Попробуйте позже или свяжитесь с консультантом напрямую.",
    );
  }

  const data = validatedRequest(input);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(target.href, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      redirect: "error",
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    if (response.status === 429) {
      throw new ContactRequestError("Слишком много попыток. Подождите минуту и попробуйте ещё раз.");
    }
    if (response.status === 400 || response.status === 422) {
      throw new ContactRequestError("Проверьте имя, электронную почту и текст заявки.");
    }
    if (!response.ok) {
      throw new ContactRequestError("Сервис заявок временно недоступен. Попробуйте позже.");
    }
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new ContactRequestError("Сервис не подтвердил получение заявки. Попробуйте позже.");
    }
    const receipt = receiptSchema.safeParse(await response.json());
    if (!receipt.success) {
      throw new ContactRequestError("Сервис не подтвердил получение заявки. Попробуйте позже.");
    }
    return receipt.data;
  } catch (error) {
    if (error instanceof ContactRequestError) throw error;
    if (controller.signal.aborted) {
      throw new ContactRequestError(
        "Не удалось дождаться подтверждения. Заявка могла быть получена — перед повторной отправкой свяжитесь с консультантом.",
      );
    }
    throw new ContactRequestError(
      "Нет подтверждения отправки. Проверьте интернет; если ошибка повторяется, свяжитесь с консультантом напрямую.",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

/** The training version downloads a local file and never claims remote delivery. */
export function saveContactRequest(input: ContactRequest): void {
  const data = validatedRequest(input);
  const now = new Date();
  const text = [
    "FINCONSULT — заявка на консультацию",
    `Дата: ${now.toLocaleString("ru-RU")}`,
    "",
    `Имя: ${data.name}`,
    `Электронная почта: ${data.email}`,
    "",
    "Задача:",
    data.message || "Не указана",
    "",
    "Согласие на обработку данных для ответа на заявку: подтверждено.",
    "",
    "Это локальная копия. Для передачи заявки отправьте файл консультанту выбранным вами способом.",
  ].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `finconsult-zayavka-${now.toISOString().slice(0, 10)}.txt`;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
