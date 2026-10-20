import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  maskCurrency,
  parsePastedCurrency,
  parseCurrencyToCents,
} from "@/lib/currency";

export interface CurrencyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange"
> {
  value?: string | number | null;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (formattedValue: string, numericCents: number) => void;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(
  (
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      onPaste,
      className,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    // Formata o valor de exibição a partir das props
    const formattedDisplayValue = React.useMemo(() => {
      if (value !== undefined) {
        return maskCurrency(value);
      }
      if (defaultValue !== undefined) {
        return maskCurrency(defaultValue);
      }
      return undefined;
    }, [value, defaultValue]);

    // Mantém a posição do cursor no final após cada alteração de digitação/formatação
    React.useEffect(() => {
      if (
        internalRef.current &&
        document.activeElement === internalRef.current &&
        typeof internalRef.current.setSelectionRange === "function"
      ) {
        const len = internalRef.current.value.length;
        internalRef.current.setSelectionRange(len, len);
      }
    }, [formattedDisplayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const formatted = maskCurrency(rawInput);
      const numericCents = parseCurrencyToCents(formatted);

      // Atualiza o target.value do evento para que chamadores padrão de onChange recebam o valor formatado
      e.target.value = formatted;

      onChange?.(e);
      onValueChange?.(formatted, numericCents);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(e);
      if (e.defaultPrevented) return;

      const pasted = e.clipboardData.getData("text");
      if (!pasted) return;

      // Se houver qualquer dígito colado, intercepta e formata inteligentemente
      if (/\d/.test(pasted)) {
        e.preventDefault();
        const formatted = parsePastedCurrency(pasted);
        const numericCents = parseCurrencyToCents(formatted);

        if (internalRef.current) {
          internalRef.current.value = formatted;
        }

        const syntheticEvent = {
          ...e,
          target: internalRef.current || e.target,
          currentTarget: internalRef.current || e.currentTarget,
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        syntheticEvent.target.value = formatted;

        onChange?.(syntheticEvent);
        onValueChange?.(formatted, numericCents);
      }
    };

    return (
      <Input
        ref={internalRef}
        type="text"
        inputMode="numeric"
        value={formattedDisplayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        className={cn("tabular-nums", className)}
        {...props}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
