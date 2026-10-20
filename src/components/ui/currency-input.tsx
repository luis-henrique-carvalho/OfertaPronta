import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { maskCurrency, parsePastedCurrency } from "@/lib/currency";

export interface CurrencyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange"
> {
  value?: string | number | null;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(({ value, defaultValue, onChange, onPaste, className, ...props }, ref) => {
  const internalRef = React.useRef<HTMLInputElement | null>(null);

  React.useImperativeHandle(ref, () => internalRef.current!);

  const formattedDisplayValue = React.useMemo(() => {
    if (value !== undefined) return maskCurrency(value);
    if (defaultValue !== undefined) return maskCurrency(defaultValue);
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
    e.target.value = maskCurrency(e.target.value);
    onChange?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(e);
    if (e.defaultPrevented) return;

    const pasted = e.clipboardData.getData("text");
    if (!pasted || !/\d/.test(pasted)) return;

    e.preventDefault();
    const formatted = parsePastedCurrency(pasted);

    if (internalRef.current) {
      internalRef.current.value = formatted;
    }

    onChange?.(
      Object.assign(e, {
        target: internalRef.current || e.target,
        currentTarget: internalRef.current || e.currentTarget,
      }) as unknown as React.ChangeEvent<HTMLInputElement>,
    );
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
});

CurrencyInput.displayName = "CurrencyInput";
