import { z } from "zod";

export const MESSAGE_LIMIT = 2000;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя — минимум 2 символа.").max(100),
  email: z.string().trim().email("Проверьте адрес электронной почты.").max(200),
  message: z.string().trim().max(MESSAGE_LIMIT).default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
