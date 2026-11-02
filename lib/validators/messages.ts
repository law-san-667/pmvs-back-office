import type { Messages } from "@/i18n/messages";
import { useTranslations, type MessageKeys, type NestedKeyOf } from "next-intl";
import { useMemo } from "react";

/**
 * Zod schemas (lib/validators, forms) carry full message keys such as
 * "products.errors.titleRequired" instead of French texts, so they stay plain
 * modules. FieldError (components/ui/field.tsx) translates them; any other
 * text (zod defaults, API messages) is shown as is.
 */
export type MessageKey = MessageKeys<Messages, NestedKeyOf<Messages>>;

/** Marks a schema message as a message key (type-checked). */
export const msg = (key: MessageKey) => key;

export function useValidationMessage() {
  const t = useTranslations();

  return useMemo(() => {
    const text = (message: string) =>
      /^[a-z][\w]*\.[\w.]+$/.test(message) && t.has(message as MessageKey)
        ? t(message as MessageKey)
        : message;
    const error = <E extends { message?: string } | undefined>(value: E): E =>
      value?.message ? { ...value, message: text(value.message) } : value;

    return { text, error };
  }, [t]);
}
